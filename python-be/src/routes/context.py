"""
Contextual Translation Management API Endpoints

This module handles the enhanced translation context features including:
- System settings management
- Language-specific cultural context
- Domain-specific word definitions

This module provides full database-backed CRUD operations for:
- System settings management
- Language-specific cultural context
- Domain-specific word definitions
"""
import logging

from flask_restx import Namespace, Resource, reqparse
from flask import request

logger = logging.getLogger(__name__)
from typing import Dict, List, Any
from auth.admin_password import require_admin_secret
from db.sql import db
from models.system_settings import SystemSettings as SystemSettingsModel
from models.language_context import LanguageContext
from models.word_definition import WordDefinition


ns_context = Namespace("context", description="Contextual translation management endpoints")

# Parser for system settings
system_settings_parser = reqparse.RequestParser()
# Translation prompt settings
system_settings_parser.add_argument("translation_prompt_mode", type=str, help="Translation prompt mode (default, extended, custom)")
system_settings_parser.add_argument("translation_prompt_custom", type=str, help="Custom translation prompt")
system_settings_parser.add_argument("translation_prompt_additions", type=str, help="Additional instructions for translation")
# Recap prompt settings
system_settings_parser.add_argument("recap_prompt_mode", type=str, help="Recap prompt mode (default, extended, custom)")
system_settings_parser.add_argument("recap_prompt_custom", type=str, help="Custom recap prompt")
system_settings_parser.add_argument("recap_prompt_additions", type=str, help="Additional instructions for recap")
# Translation Context Settings
system_settings_parser.add_argument("include_conversation_history", type=bool, help="Include conversation history in translations")
system_settings_parser.add_argument("include_language_pair_info", type=bool, help="Include language pair information in translations")
system_settings_parser.add_argument("include_language_context", type=bool, help="Include cultural and language-specific context")
system_settings_parser.add_argument("include_word_dictionary", type=bool, help="Include custom word definitions and translations")
# Recap Context Settings (separate from translation)
system_settings_parser.add_argument("recap_include_conversation_history", type=bool, help="Include conversation history in recaps")
system_settings_parser.add_argument("recap_include_language_pair_info", type=bool, help="Include language pair information in recaps")
system_settings_parser.add_argument("recap_include_language_context", type=bool, help="Include cultural and language-specific context in recaps")
system_settings_parser.add_argument("recap_include_word_dictionary", type=bool, help="Include custom word definitions in recaps")
# Legacy/General settings
system_settings_parser.add_argument("base_system_prompt", type=str, help="Base system prompt for translations")
system_settings_parser.add_argument("context_enhancement_enabled", type=bool, help="Enable context enhancement")

# Parser for language contexts
language_context_parser = reqparse.RequestParser()
language_context_parser.add_argument("language_code", type=str, required=True, help="Language code (e.g., da-DK)")
language_context_parser.add_argument("language_name", type=str, required=True, help="Language display name")
language_context_parser.add_argument("formality_level", type=str, help="Formality level")
language_context_parser.add_argument("formality_notes", type=str, help="Notes about formality")
language_context_parser.add_argument("cultural_notes", type=str, help="Cultural communication notes")
language_context_parser.add_argument("system_prompt", type=str, help="Language-specific prompt")

# Parser for word definitions
word_definition_parser = reqparse.RequestParser()
word_definition_parser.add_argument("word", type=str, required=True, help="The word or term")
word_definition_parser.add_argument("language_code", type=str, required=True, help="Language code")
word_definition_parser.add_argument("context_type", type=str, required=True, help="Context type")
word_definition_parser.add_argument("definition", type=str, required=True, help="Definition of the word")
word_definition_parser.add_argument("usage_examples", type=str, help="Usage examples")
word_definition_parser.add_argument("translation_hints", type=str, help="Translation hints")
word_definition_parser.add_argument("synonyms", type=str, help="Synonyms")
word_definition_parser.add_argument("avoid_translations", type=str, help="Translations to avoid")
word_definition_parser.add_argument("priority", type=int, help="Priority level")


@ns_context.route("/system-settings")
class SystemSettings(Resource):
    """System-wide translation settings management"""

    method_decorators = [require_admin_secret]

    def get(self):
        """Get current system settings"""
        try:
            settings = {}
            for setting in SystemSettingsModel.query.filter_by(is_active=True).all():
                # Parse the value based on type
                if setting.setting_type == 'json' and setting.setting_value:
                    try:
                        import json
                        value = json.loads(setting.setting_value)
                    except:
                        value = setting.setting_value
                elif setting.setting_type == 'boolean':
                    value = setting.setting_value.lower() in ('true', '1', 'yes', 'on') if setting.setting_value else False
                elif setting.setting_type == 'integer':
                    try:
                        value = int(setting.setting_value) if setting.setting_value else 0
                    except:
                        value = 0
                else:
                    value = setting.setting_value

                settings[setting.setting_key] = value

            # Provide defaults for new prompt settings if they don't exist
            defaults = {
                'translation_prompt_mode': 'default',
                'translation_prompt_custom': '',
                'translation_prompt_additions': '',
                'recap_prompt_mode': 'default',
                'recap_prompt_custom': '',
                'recap_prompt_additions': '',
                'include_conversation_history': True,
                'include_language_pair_info': True,
                'include_language_context': True,
                'include_word_dictionary': True,
                'recap_include_conversation_history': True,
                'recap_include_language_pair_info': True,
                'recap_include_language_context': True,
                'recap_include_word_dictionary': True,
                'base_system_prompt': 'You are a professional interpreter working for Kalundborg Municipality. Your role is to provide accurate, culturally appropriate translations that maintain the intent and tone of the original message. Always consider the cultural context of both the source and target languages.',
                'context_enhancement_enabled': True
            }

            # Merge defaults for any missing settings
            for key, default_value in defaults.items():
                if key not in settings:
                    settings[key] = default_value

            return settings
        except Exception as e:
            logger.error("Database query failed in system settings, returning defaults: %s", e)
            # Return defaults if database fails
            return {
                'translation_prompt_mode': 'default',
                'translation_prompt_custom': '',
                'translation_prompt_additions': '',
                'recap_prompt_mode': 'default',
                'recap_prompt_custom': '',
                'recap_prompt_additions': '',
                'include_conversation_history': True,
                'include_language_pair_info': True,
                'include_language_context': True,
                'include_word_dictionary': True,
                'recap_include_conversation_history': True,
                'recap_include_language_pair_info': True,
                'recap_include_language_context': True,
                'recap_include_word_dictionary': True,
                'base_system_prompt': 'You are a professional interpreter working for Kalundborg Municipality. Your role is to provide accurate, culturally appropriate translations that maintain the intent and tone of the original message. Always consider the cultural context of both the source and target languages.',
                'context_enhancement_enabled': True
            }

    @ns_context.expect(system_settings_parser)
    def put(self):
        """Update system settings"""
        try:
            args = system_settings_parser.parse_args()

            for key, value in args.items():
                if value is not None:
                    setting = SystemSettingsModel.query.filter_by(setting_key=key).first()

                    # Convert value to string based on type
                    if key in ['context_enhancement_enabled', 'include_conversation_history', 'include_language_pair_info', 'include_language_context', 'include_word_dictionary', 'recap_include_conversation_history', 'recap_include_language_pair_info', 'recap_include_language_context', 'recap_include_word_dictionary']:
                        str_value = 'true' if value else 'false'
                        setting_type = 'boolean'
                    else:
                        str_value = str(value)
                        setting_type = 'text'

                    if setting:
                        setting.setting_value = str_value
                        setting.setting_type = setting_type
                        from datetime import datetime
                        setting.updated_at = datetime.utcnow()
                    else:
                        # Map setting keys to proper names and categories
                        setting_names = {
                            'translation_prompt_mode': 'Translation Prompt Mode',
                            'translation_prompt_custom': 'Custom Translation Prompt',
                            'translation_prompt_additions': 'Translation Prompt Additions',
                            'recap_prompt_mode': 'Recap Prompt Mode',
                            'recap_prompt_custom': 'Custom Recap Prompt',
                            'recap_prompt_additions': 'Recap Prompt Additions',
                        }
                        setting_name = setting_names.get(key, key.replace('_', ' ').title())
                        category = 'prompts' if 'prompt' in key else 'general'

                        setting = SystemSettingsModel(
                            setting_key=key,
                            setting_name=setting_name,
                            setting_value=str_value,
                            setting_type=setting_type,
                            category=category,
                            description=f"Setting for {setting_name.lower()}"
                        )
                        db.session.add(setting)

            db.session.commit()
            return {"message": "Settings updated successfully"}, 200

        except Exception as e:
            logger.error("Failed to update system settings: %s", e)
            db.session.rollback()
            return {"error": f"Failed to update settings: {str(e)}"}, 500


@ns_context.route("/language-contexts")
class LanguageContextsList(Resource):
    """List and create language contexts"""

    method_decorators = [require_admin_secret]

    def get(self):
        """Get all language contexts"""
        contexts = LanguageContext.query.filter_by(is_active=True).all()
        return [context.to_dict() for context in contexts]

    @ns_context.expect(language_context_parser)
    def post(self):
        """Create new language context"""
        args = language_context_parser.parse_args()

        context = LanguageContext(**args)
        db.session.add(context)
        db.session.commit()
        return context.to_dict(), 201


@ns_context.route("/language-contexts/<string:language_code>")
class LanguageContextDetail(Resource):
    """Manage specific language context"""

    method_decorators = [require_admin_secret]

    def get(self, language_code):
        """Get language context by code"""
        context = LanguageContext.get_by_language_code(language_code)
        if not context:
            return {"error": "Language context not found"}, 404
        return context.to_dict()

    @ns_context.expect(language_context_parser)
    def put(self, language_code):
        """Update language context"""
        args = language_context_parser.parse_args()

        context = LanguageContext.get_by_language_code(language_code)
        if not context:
            return {"error": "Language context not found"}, 404

        for key, value in args.items():
            if value is not None:
                setattr(context, key, value)

        db.session.commit()
        return context.to_dict()

    def delete(self, language_code):
        """Delete language context"""
        context = LanguageContext.get_by_language_code(language_code)
        if not context:
            return {"error": "Language context not found"}, 404

        context.is_active = False
        db.session.commit()
        return {"message": "Language context deleted"}, 200


@ns_context.route("/word-definitions")
class WordDefinitionsList(Resource):
    """List and create word definitions"""

    method_decorators = [require_admin_secret]

    def get(self):
        """Get word definitions with optional filters"""
        language_code = request.args.get("language_code")
        context_type = request.args.get("context_type")
        search = request.args.get("search")

        query = WordDefinition.query.filter_by(is_active=True)
        if language_code:
            query = query.filter_by(language_code=language_code)
        if context_type:
            query = query.filter_by(context_type=context_type)
        if search:
            query = query.filter(WordDefinition.word.ilike(f'%{search}%'))

        definitions = query.order_by(WordDefinition.priority.desc()).all()
        return [definition.to_dict() for definition in definitions]

    @ns_context.expect(word_definition_parser)
    def post(self):
        """Create new word definition"""
        args = word_definition_parser.parse_args()

        definition = WordDefinition(**args)
        db.session.add(definition)
        db.session.commit()

        return definition.to_dict(), 201


@ns_context.route("/word-definitions/<int:definition_id>")
class WordDefinitionDetail(Resource):
    """Manage specific word definition"""

    method_decorators = [require_admin_secret]

    def get(self, definition_id):
        """Get word definition by ID"""
        definition = WordDefinition.query.get(definition_id)
        if not definition or not definition.is_active:
            return {"error": "Word definition not found"}, 404
        return definition.to_dict()

    @ns_context.expect(word_definition_parser)
    def put(self, definition_id):
        """Update word definition"""
        try:
            args = word_definition_parser.parse_args()
            logger.debug("PUT word definition %s with args: %s", definition_id, args)

            definition = WordDefinition.query.get(definition_id)
            if not definition or not definition.is_active:
                logger.error("Word definition %s not found or inactive", definition_id)
                return {"error": "Word definition not found"}, 404

            for key, value in args.items():
                if value is not None:
                    setattr(definition, key, value)

            db.session.commit()
            logger.debug("Successfully updated word definition %s", definition_id)
            return definition.to_dict()
        except Exception as e:
            logger.error("Failed to update word definition %s: %s", definition_id, e)
            db.session.rollback()
            return {"error": f"Failed to update word definition: {str(e)}"}, 500

    def delete(self, definition_id):
        """Delete word definition"""
        definition = WordDefinition.query.get(definition_id)
        if not definition:
            return {"error": "Word definition not found"}, 404

        definition.is_active = False
        db.session.commit()
        return {"message": "Word definition deleted"}, 200


@ns_context.route("/word-definitions/search")
class WordDefinitionSearch(Resource):
    """Search word definitions for translation context"""

    def post(self):
        """Find relevant word definitions for a given text"""
        data = request.get_json() or {}
        text = data.get("text", "").lower()
        language_code = data.get("language_code")
        context_type = data.get("context_type", "official_term")

        if not text or not language_code:
            return {"error": "Text and language_code are required"}, 400

        # Find definitions using database
        words_in_text = text.split()
        matching_definitions = []

        for word in words_in_text:
            clean_word = word.strip('.,!?').lower()
            definition = WordDefinition.query.filter_by(
                word=clean_word,
                language_code=language_code,
                context_type=context_type,
                is_active=True
            ).order_by(WordDefinition.priority.desc()).first()

            if definition:
                matching_definitions.append(definition.to_dict())

        return {
            "text": text,
            "language_code": language_code,
            "context_type": context_type,
            "matching_definitions": matching_definitions,
            "context_available": len(matching_definitions) > 0
        }


@ns_context.route("/translation-context")
class TranslationContext(Resource):
    """Get complete translation context for enhanced translations"""

    def post(self):
        """Get full context package for translation enhancement"""
        data = request.get_json() or {}
        text = data.get("text", "")
        from_language = data.get("from_language")
        to_language = data.get("to_language")
        context_type = data.get("context_type", "official_term")

        if not all([text, from_language, to_language]):
            return {"error": "text, from_language, and to_language are required"}, 400

        # Get system settings from database
        system_settings = {}
        try:
            for setting in SystemSettingsModel.query.filter_by(is_active=True).all():
                if setting.setting_type == 'boolean':
                    value = setting.setting_value.lower() in ('true', '1', 'yes', 'on') if setting.setting_value else False
                elif setting.setting_type == 'integer':
                    try:
                        value = int(setting.setting_value) if setting.setting_value else 0
                    except:
                        value = 0
                else:
                    value = setting.setting_value
                system_settings[setting.setting_key] = value
        except Exception as e:
            logger.error("Failed to get system settings: %s", e)
            system_settings = {"context_enhancement_enabled": True}

        # Get language contexts from database
        from_context = LanguageContext.get_by_language_code(from_language)
        to_context = LanguageContext.get_by_language_code(to_language)
        from_context = from_context.to_dict() if from_context else None
        to_context = to_context.to_dict() if to_context else None

        # Get relevant word definitions from database
        words_in_text = text.lower().split()
        relevant_definitions = []

        for word in words_in_text:
            clean_word = word.strip('.,!?').lower()
            definition = WordDefinition.query.filter_by(
                word=clean_word,
                language_code=from_language,
                context_type=context_type,
                is_active=True
            ).order_by(WordDefinition.priority.desc()).first()

            if definition:
                relevant_definitions.append(definition.to_dict())

        return {
            "system_settings": system_settings,
            "from_language_context": from_context,
            "to_language_context": to_context,
            "relevant_definitions": relevant_definitions,
            "context_type": context_type,
            "enhancement_available": bool(from_context or to_context or relevant_definitions)
        }