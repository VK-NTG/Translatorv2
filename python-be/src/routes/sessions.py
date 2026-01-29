import azure.cognitiveservices.speech as speechsdk
import os
import uuid
import logging
from babel import Locale, UnknownLocaleError
from flask_restx import Namespace, Resource, reqparse
from flask import request, Response
from werkzeug.datastructures import FileStorage
from db.sql import db
from models.session import Session
from models.translation import Translation
import requests
from typing import TypedDict, NotRequired
from auth.admin_password import require_admin_secret
from auth.api_rate_limit import rate_limit, translation_limiter, transcription_limiter, recap_limiter


from services.voices import list_voices
from services.translation_service import get_effective_recap_prompt, get_contextual_recap_prompt, bulk_translate_optimized

from config import (
    MODEL_URL_MAP,
    DEFAULT_AUDIO_PATH,
    STATUS_LANGUAGE_SET,
    STATUS_ONGOING,
    STATUS_FINISHED,
    AZURE_SPEECH_KEY,
    AZURE_SPEECH_REGION,
)

from services.transcription_service import transcribe_audio
from services.translation_service import translate_text
from utils.security import safe_audio_path

logger = logging.getLogger(__name__)


def make_speech_config() -> speechsdk.SpeechConfig:

    return speechsdk.SpeechConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_SPEECH_REGION,
    )


ns_sessions = Namespace("sessions", description="Session-related endpoints")

audio_parser = reqparse.RequestParser()
audio_parser.add_argument("audio", type=FileStorage, location="files")


TRANSCRIBE_CHOICES = ["promte_whisper", "azure_speech"]
TRANSLATE_CHOICES = ["gpt4o-mini", "promte_4o"]
SUMMARY_CHOICES = ["gpt4o-mini", "promte_4o"]


class LangBase(TypedDict):
    english_name: str
    native_name: str
    region: str
    default_voice: str
    models: dict[str, str]


DEFAULT_MODELS = {
    "transcribeModel": TRANSCRIBE_CHOICES[0],
    "translationModel": TRANSLATE_CHOICES[0],
    "summaryModel": SUMMARY_CHOICES[0],
}


def safe_parse(code: str) -> Locale:
    """Return a Babel Locale or a dummy fallback."""
    try:
        # Babel wants underscore, not dash
        return Locale.parse(code.replace("-", "_"))
    except UnknownLocaleError:
        # fabricate a minimal locale object so .get_display_name() works
        # (this just echoes the code back)
        return Locale("und")  # “undetermined”


LOCKED_LANG = "da-DK"  # Danish is ALWAYS USED
LOCKED_DEFAULT = {  # only used if the row is absent
    "english_name": "Danish",
    "native_name": "Dansk",
    "region": "Denmark",
    "default_voice": "da-DK-ChristelNeural",
    "models": {
        "transcribeModel": DEFAULT_MODELS["transcribeModel"],
        "translationModel": DEFAULT_MODELS["translationModel"],
        "summaryModel": DEFAULT_MODELS["summaryModel"],
    },
}


def get_lang_base(code: str) -> LangBase:
    """
    Build the base config for *any* locale.

    • If a row exists in `language_settings` → merge that.
    • If not, fabricate defaults from Babel … **except** for the locked
      Danish locale, where we return the hard‑coded details above.
    """
    row = LanguageSetting.query.filter_by(code=code).first()

    # --- 1. special‑case Danish if row missing ---------------------------
    if code == LOCKED_LANG and row is None:
        return LOCKED_DEFAULT  # ← nothing in DB yet, use fixed values

    # --- 2. normal path ---------------------------------------------------
    loc = safe_parse(code)
    base: LangBase = {
        "english_name": loc.get_display_name("en").title(),
        "native_name": loc.get_display_name(loc).title(),
        "region": "",
        "default_voice": row.voice if row else "",
        "models": {
            "transcribeModel": (row.transcribe_model if row else None)
            or DEFAULT_MODELS["transcribeModel"],
            "translationModel": (row.translation_model if row else None)
            or DEFAULT_MODELS["translationModel"],
            "summaryModel": (row.summary_model if row else None)
            or DEFAULT_MODELS["summaryModel"],
        },
    }
    return base


@ns_sessions.route("/choices")
class ModelChoices(Resource):
    def get(self):
        return {
            "transcribe": TRANSCRIBE_CHOICES,
            "translate": TRANSLATE_CHOICES,
            "summary": SUMMARY_CHOICES,
        }


class LanguageSetting(db.Model):
    __tablename__ = "language_settings"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(8), unique=True, nullable=False)  # "fr-FR"
    enabled = db.Column(db.Boolean, default=False)

    voice = db.Column(db.String(64))
    transcribe_model = db.Column(db.String(32))
    translation_model = db.Column(db.String(32))
    summary_model = db.Column(db.String(32))

    def to_dict(self, base: dict) -> dict:
        """merge DB override onto the static LANGUAGES entry"""
        return {
            **base,  # english_name, native_name, region…
            "enabled": self.enabled,
            "voice": self.voice or base["default_voice"],
            "models": {
                "transcribeModel": self.transcribe_model
                or base["models"]["transcribeModel"],
                "translationModel": self.translation_model
                or base["models"]["translationModel"],
                "summaryModel": self.summary_model or base["models"]["summaryModel"],
            },
        }


def safe_locale(code: str) -> Locale:
    """Return a Babel Locale, falling back to 'und' (undetermined)."""
    if not code:
        return Locale("und")
    try:
        return Locale.parse(code.replace("-", "_"))
    except UnknownLocaleError:
        return Locale("und")


def get_lang_cfg(code: str) -> dict:

    row = LanguageSetting.query.filter_by(code=code).first()
    loc = safe_locale(code)

    cfg = {
        "english_name": loc.get_display_name("en").title(),
        "native_name": loc.get_display_name(loc).title(),
        "region": "",
        "default_voice": row.voice if row else "",
        "models": {
            "transcribeModel": (
                (row.transcribe_model if row else None) or DEFAULT_MODELS["transcribeModel"]
            ),
            "translationModel": (
                (row.translation_model if row else None) or DEFAULT_MODELS["translationModel"]
            ),
            "summaryModel": ((row.summary_model if row else None) or DEFAULT_MODELS["summaryModel"]),
        },
    }
    return cfg


def make_stub_base(locale_code: str, voice: str | None = None) -> dict:
    """Create a minimal LANGUAGES‑like entry for a DB‑only locale"""
    loc = Locale.parse(locale_code.replace("_", "-"))
    return {
        "english_name": loc.get_display_name("en").title(),
        "native_name": loc.get_display_name(loc).title(),
        "region": "",
        "models": {
            "transcribeModel": TRANSCRIBE_CHOICES[0],
            "translationModel": TRANSLATE_CHOICES[0],
            "summaryModel": SUMMARY_CHOICES[0],
        },
        "default_voice": voice or "",
    }


@ns_sessions.route("/languages")
class LanguageConfig(Resource):

    def get(self):
        rows = {r.code: r for r in LanguageSetting.query.all()}
        out = []

        # (1) every row we've ever created
        for code, row in rows.items():
            base = get_lang_cfg(code)
            merged = row.to_dict(base) | {
                "code": code,
                "locked": code == LOCKED_LANG,
            }
            if code == LOCKED_LANG:
                merged["enabled"] = True
            out.append(merged)

        # (2) Danish static entry (already covered by step 1 if row exists)
        if LOCKED_LANG not in rows:
            out.append(
                get_lang_cfg(LOCKED_LANG)
                | {
                    "code": LOCKED_LANG,
                    "enabled": True,
                    "locked": True,
                }
            )

        return out


def get_or_create_lang(code: str) -> LanguageSetting:
    """Return existing LanguageSetting row or create a new one (disabled)."""
    ls = LanguageSetting.query.filter_by(code=code).first()
    if ls:
        return ls
    ls = LanguageSetting(code=code)  # enabled defaults to False
    db.session.add(ls)
    return ls


@ns_sessions.route("/languages/<string:code>")
class LanguageConfigUpdate(Resource):
    method_decorators = [require_admin_secret]

    def patch(self, code: str):
        # validate format quickly: must have dash and two segments
        if "-" not in code:
            return {"error": "locale must be like fr-FR"}, 400

        payload = request.get_json(force=True) or {}
        ls = get_or_create_lang(code)

        if code == LOCKED_LANG:
            payload.pop("enabled", None)  # can’t toggle

        if "enabled" in payload:
            ls.enabled = bool(payload["enabled"])
        if "voice" in payload:
            ls.voice = payload["voice"]

        if payload.get("transcribeModel") in TRANSCRIBE_CHOICES:
            ls.transcribe_model = payload["transcribeModel"]
        if payload.get("translationModel") in TRANSLATE_CHOICES:
            ls.translation_model = payload["translationModel"]
        if payload.get("summaryModel") in SUMMARY_CHOICES:
            ls.summary_model = payload["summaryModel"]

        db.session.commit()

        base = get_lang_base(code)

        return ls.to_dict(get_lang_cfg(code)) | {
            "code": code,
            "locked": code == LOCKED_LANG,
        }


@ns_sessions.route("/start-session")
class StartSession(Resource):
    def post(self):
        session = Session()
        db.session.add(session)
        db.session.commit()
        return {"session_id": session.id, "status": session.status}


# ── helper --------------------------------------------------------------
def build_public_lang(code: str) -> dict:
    """
    Shape used by the front‑end’s ‘Available languages’ selector.
    Pulls names from get_lang_base() so it works for DB‑only rows too.
    """
    base = get_lang_base(code)
    return {
        "code": code,
        "english_name": base["english_name"],
        "native_name": base["native_name"],
        "region": base["region"],
    }


# ── /available-languages  ----------------------------------------------
@ns_sessions.route("/available-languages")
class AvailableLanguages(Resource):
    def get(self):
        enabled = (
            LanguageSetting.query.filter(LanguageSetting.enabled.is_(True))
            .with_entities(LanguageSetting.code)
            .all()
        )
        # flatten rows -> {"sq-AL", "ar-EG", ...}
        enabled_codes = {c for (c,) in enabled}

        # NEVER offer Danish as the selectable language
        enabled_codes.discard(LOCKED_LANG)

        return sorted(
            [build_public_lang(code) for code in enabled_codes],
            key=lambda x: x["english_name"],
        )


@ns_sessions.route("/select-language")
class SelectLanguage(Resource):
    def post(self):
        payload = request.get_json(force=True) or {}
        session_id = payload.get("session_id")
        language = payload.get("language")

        session_obj = Session.query.get(session_id)
        if not session_obj:
            return {"error": "Session not found"}, 404

        # language must be enabled in the dashboard
        row = LanguageSetting.query.filter_by(code=language, enabled=True).first()
        if not row:
            return {"error": "Unsupported language"}, 400

        danish = LOCKED_LANG
        session_obj.language_a = language
        session_obj.language_b = danish
        session_obj.model_a = get_lang_cfg(language)["models"]
        session_obj.model_b = get_lang_cfg(danish)["models"]
        session_obj.status = STATUS_LANGUAGE_SET
        db.session.commit()

        return session_obj.to_dict()


@ns_sessions.route("/translate")
class Translate(Resource):
    method_decorators = [rate_limit(translation_limiter)]

    @ns_sessions.expect(audio_parser)
    def post(self):
        args = audio_parser.parse_args()
        audio_file = args.get("audio")
        form = request.form or request.json or {}
        session_id = form.get("session_id")
        from_lang = form.get("from")
        to_lang = form.get("to")
        text = form.get("text")

        sess = Session.query.get(session_id)
        if not sess:
            return {"error": "Session not found"}, 404

        # Always use Language A (foreign language) settings since Language B is always Danish
        cfg_language_a = get_lang_cfg(sess.language_a)
        cfg_from = get_lang_cfg(from_lang)

        # --- 1. transcribe (if audio / empty text) -------------------------
        transcribe_model = cfg_from["models"]["transcribeModel"]

        if audio_file or not text:
            audio_path = DEFAULT_AUDIO_PATH
            if audio_file:
                try:
                    tmp = safe_audio_path(audio_file.filename)
                except ValueError as e:
                    logger.warning("Invalid audio file: %s", e)
                    return {"error": f"Invalid audio file: {e}"}, 400
                audio_file.save(tmp)
                audio_path = tmp

            try:
                original = transcribe_audio(audio_path, transcribe_model, from_lang)
            finally:
                if audio_file and os.path.exists(audio_path):
                    os.remove(audio_path)
        else:
            original = text

        # --- 2. translate --------------------------------------------------
        # Always use Language A's translation model (both directions Danish <-> Foreign)
        translation_model = cfg_language_a["models"]["translationModel"]
        translated = translate_text(original, translation_model, from_lang, to_lang)

        # --- 3. persist ----------------------------------------------------
        db.session.add(
            Translation(
                session_id=session_id,
                from_lang=from_lang,
                to_lang=to_lang,
                original=original,
                translated=translated,
            )
        )
        sess.status = STATUS_ONGOING
        db.session.commit()

        return {
            "session_id": session_id,
            "from": from_lang,
            "to": to_lang,
            "original": original,
            "translated": translated,
        }


@ns_sessions.route("/quick-translate")
class QuickTranslate(Resource):
    """Standalone translation endpoint for browser extension use (no session required)."""
    method_decorators = [rate_limit(translation_limiter)]

    def post(self):
        payload = request.get_json() or {}
        text = payload.get("text", "").strip()
        from_lang = payload.get("from") or payload.get("source_language") or "da"
        to_lang = payload.get("to") or payload.get("target_language") or "en"

        if not text:
            return {"error": "No text provided"}, 400

        # Use default translation model
        model_key = TRANSLATE_CHOICES[0]  # gpt4o-mini

        try:
            translated = translate_text(text, model_key, from_lang, to_lang)
            return {
                "from": from_lang,
                "to": to_lang,
                "original": text,
                "translation": translated,
            }
        except Exception as e:
            logger.error("Quick translate error: %s", e)
            return {"error": str(e)}, 500


@ns_sessions.route("/bulk-translate")
class BulkTranslate(Resource):
    """
    Optimized bulk translation endpoint for translating multiple texts in one request.

    Uses parallel processing and LLM-level batching for much faster translations.
    - 10 parallel API workers
    - 5 texts batched per LLM call
    - Simplified prompts (no DB lookups)

    For 50 texts: ~2-4 seconds instead of ~25-50 seconds
    """
    method_decorators = [rate_limit(translation_limiter)]

    def post(self):
        payload = request.get_json() or {}
        texts = payload.get("texts", [])
        from_lang = payload.get("from") or payload.get("source_language") or "auto"
        to_lang = payload.get("to") or payload.get("target_language") or "da"
        use_context = payload.get("use_context", False)  # Optional: enable context for higher quality

        if not texts or not isinstance(texts, list):
            return {"error": "No texts provided. Expected 'texts' array."}, 400

        if len(texts) > 100:
            return {"error": "Too many texts. Maximum 100 per request."}, 400

        # Use default translation model
        model_key = TRANSLATE_CHOICES[0]  # gpt4o-mini

        # Use optimized bulk translation with parallelization and batching
        try:
            results = bulk_translate_optimized(
                texts=texts,
                model_key=model_key,
                from_lang=from_lang,
                to_lang=to_lang,
                use_context=use_context,
                max_workers=10,  # 10 parallel API calls
                batch_size=5     # 5 texts per LLM prompt
            )
        except Exception as e:
            logger.error("Bulk translate failed: %s", e)
            return {"error": f"Bulk translation failed: {str(e)}"}, 500

        return {
            "from": from_lang,
            "to": to_lang,
            "results": results,
            "total": len(texts),
            "success": sum(1 for r in results if r.get("translation") is not None)
        }


@ns_sessions.route("/finish-session")
class FinishSession(Resource):
    def post(self):
        payload = request.get_json()
        session_id = payload.get("session_id")
        session_obj = Session.query.get(session_id)
        if not session_obj:
            return {"error": "Session not found"}, 404

        session_obj.status = STATUS_FINISHED
        db.session.commit()
        return {"session_id": session_id, "status": STATUS_FINISHED}


@ns_sessions.route("/recap")
class Recap(Resource):
    method_decorators = [rate_limit(recap_limiter)]

    def get(self):
        session_id = request.args.get("session_id")
        sess = Session.query.get(session_id)
        if not sess:
            return {"error": "Session not found"}, 404

        cfg_a = get_lang_cfg(sess.language_a or "en")
        lang_a_name = cfg_a.get("english_name", sess.language_a)
        summary_model = cfg_a["models"]["summaryModel"]
        summary_url = MODEL_URL_MAP[summary_model]

        headers = (
            {
                "Content-Type": "application/json",
                "api-key": os.getenv("AZURE_OPENAI_KEY"),
            }
            if summary_model in {"gpt4o-mini", "gpt35"}
            else {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {os.getenv('PROMTE_API_KEY')}",
            }
        )

        # Group translations by direction to better represent the conversation flow
        danish_speaker_messages = []
        foreign_speaker_messages = []

        for t in sess.translations:
            if t.from_lang == sess.language_b:  # Danish to Foreign
                danish_speaker_messages.append(f"[{t.created_at:%Y-%m-%d %H:%M:%S}] Danish Speaker: {t.original}")
                foreign_speaker_messages.append(f"[{t.created_at:%Y-%m-%d %H:%M:%S}] Translation to {lang_a_name}: {t.translated}")
            else:  # Foreign to Danish
                foreign_speaker_messages.append(f"[{t.created_at:%Y-%m-%d %H:%M:%S}] {lang_a_name} Speaker: {t.original}")
                danish_speaker_messages.append(f"[{t.created_at:%Y-%m-%d %H:%M:%S}] Translation to Danish: {t.translated}")

        # Create a simple conversation flow that only shows what was actually said
        convo_lines = []
        if sess.translations:
            # Just show the actual translations without extra context
            all_translations = sorted(sess.translations, key=lambda x: x.created_at)
            for t in all_translations:
                if t.from_lang == sess.language_b:  # Danish to Foreign
                    convo_lines.append(f"Danish: {t.original}")
                    convo_lines.append(f"{lang_a_name}: {t.translated}")
                else:  # Foreign to Danish
                    convo_lines.append(f"{lang_a_name}: {t.original}")
                    convo_lines.append(f"Danish: {t.translated}")

        convo = "\n".join(convo_lines) if convo_lines else "No conversation data available."

        # Generate summaries in both languages
        cfg_b = get_lang_cfg(sess.language_b or "da")
        lang_b_name = cfg_b.get("english_name", sess.language_b)

        # Handle empty conversations with simple summaries
        if not sess.translations or len(sess.translations) == 0:
            summary_a = f"Ingen samtale blev registreret i denne session."
            summary_b = f"No conversation was recorded in this session."
        else:
            try:
                # Summary in Language A (using contextual prompt with word definitions)
                payload_a = {
                    "messages": [
                        {
                            "role": "system",
                            "content": get_contextual_recap_prompt(lang_a_name, convo, sess.language_a or "en"),
                        },
                        {"role": "user", "content": convo},
                    ],
                    "temperature": 0.3,
                }

                # Summary in Language B (using contextual prompt with word definitions)
                payload_b = {
                    "messages": [
                        {
                            "role": "system",
                            "content": get_contextual_recap_prompt(lang_b_name, convo, sess.language_b or "da"),
                        },
                        {"role": "user", "content": convo},
                    ],
                    "temperature": 0.3,
                }

                # Generate both summaries
                resp_a = requests.post(summary_url, headers=headers, json=payload_a)
                resp_a.raise_for_status()
                summary_a = (
                    resp_a.json()["choices"][0]["message"]["content"].strip()
                    if summary_model in {"gpt4o-mini", "gpt35", "promte_4o"}
                    else resp_a.text.strip()
                )

                resp_b = requests.post(summary_url, headers=headers, json=payload_b)
                resp_b.raise_for_status()
                summary_b = (
                    resp_b.json()["choices"][0]["message"]["content"].strip()
                    if summary_model in {"gpt4o-mini", "gpt35", "promte_4o"}
                    else resp_b.text.strip()
                )
            except Exception as e:
                # Fallback summaries when AI service is unavailable
                logger.warning("Could not generate AI summaries: %s", e)
                summary_a = "Opsummering ikke tilgængelig (AI-tjeneste fejl)."
                summary_b = "Summary not available (AI service error)."

        # Prepare complete chat history with enhanced details
        chat_history = [
            {
                "id": t.id,
                "timestamp": t.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "from_lang": t.from_lang,
                "to_lang": t.to_lang,
                "from_lang_name": get_lang_cfg(t.from_lang).get("english_name", t.from_lang),
                "to_lang_name": get_lang_cfg(t.to_lang).get("english_name", t.to_lang),
                "original": t.original,
                "translated": t.translated
            }
            for t in sess.translations
        ]

        return {
            "session_id": session_id,
            "summary_a": summary_a,
            "summary_b": summary_b,
            "language_a": sess.language_a,
            "language_b": sess.language_b,
            "language_a_name": lang_a_name,
            "language_b_name": lang_b_name,
            "chat_history": chat_history,
            "session_info": {
                "created_at": sess.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "translation_count": len(sess.translations),
                "status": sess.status
            },
            "translations": [t.to_dict() for t in sess.translations],
        }


@ns_sessions.route("/list")
class ListSessions(Resource):
    def get(self):
        sessions = Session.query.order_by(Session.created_at.desc()).all()
        return [s.to_dict() for s in sessions]


@ns_sessions.route("/<string:session_id>")
class GetSession(Resource):
    def get(self, session_id):
        session_obj = Session.query.get(session_id)
        if not session_obj:
            return {"error": "Session not found"}, 404

        return {
            **session_obj.to_dict(),
            "translations": [t.to_dict() for t in session_obj.translations],
        }


@ns_sessions.route("/transcribe")
class Transcribe(Resource):
    method_decorators = [rate_limit(transcription_limiter)]

    @ns_sessions.expect(audio_parser)
    def post(self):
        args = audio_parser.parse_args()
        audio_file = args.get("audio")
        form = request.form or request.json or {}
        from_lang = form.get("from")

        if not audio_file:
            return {"error": "No audio provided"}, 400

        cfg = get_lang_cfg(from_lang)
        model_key = cfg["models"]["transcribeModel"]

        try:
            tmp = safe_audio_path(audio_file.filename)
        except ValueError as e:
            logger.warning("Invalid audio file in transcribe: %s", e)
            return {"error": f"Invalid audio file: {e}"}, 400

        audio_file.save(tmp)
        try:
            text = transcribe_audio(tmp, model_key, from_lang)
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)

        return {"original": text}


@ns_sessions.route("/available-voices")
class AvailableVoices(Resource):
    method_decorators = [require_admin_secret]

    def get(self):
        logger.debug("Fetching available voices")
        voices_list = list_voices()
        logger.debug("Found %d voices", len(voices_list) if voices_list else 0)
        return voices_list


@ns_sessions.route("/tts")
class TextToSpeech(Resource):
    def post(self):
        data = request.get_json(force=True) or {}
        text = (data.get("text") or "").strip()
        if not text:
            return {"error": "No text supplied"}, 400

        voice = data.get("voice")
        if not voice:
            lang_hint = data.get("lang")
            if not lang_hint and (sid := data.get("session_id")):
                sess = Session.query.get(sid)
                lang_hint = (
                    sess.language_b if text.startswith("da-") else sess.language_a
                )
            if lang_hint:
                voice = get_lang_cfg(lang_hint)["default_voice"]

        voice = voice or "en-GB-LibbyNeural"

        speech_config = make_speech_config()
        speech_config.speech_synthesis_voice_name = voice
        synthesizer = speechsdk.SpeechSynthesizer(speech_config, audio_config=None)
        result = synthesizer.speak_text_async(text).get()

        if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            return {"error": "TTS failed"}, 500

        return Response(result.audio_data, 200, mimetype="audio/wav")
