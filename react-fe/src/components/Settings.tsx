import { useEffect, useMemo, useState, memo, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import logo from '../assets/white_logo.svg'

import { API_URL, API_KEY } from '../config'
import { fetchLanguages, fetchChoices, LangConfig } from '../lib/fetchLanguages'
import { fetchVoices, VoiceInfo } from '../lib/fetchVoices'
import { groupVoicesByLang } from '../lib/groupVoices'
import { getAdminSecret, setAdminSecret } from '../lib/adminSecret'
import { fetchLanguageContexts, updateLanguageContext, createLanguageContext, LanguageContext, fetchWordDefinitions, createWordDefinition, updateWordDefinition, deleteWordDefinition, WordDefinition } from '../lib/contextApi'
import { Volume1Icon, Settings, Languages, BookOpen, Mic, Sun, Moon, Info, X } from 'lucide-react'

// Default system prompts that ship with the application
const DEFAULT_TRANSLATION_PROMPT = 'You are a translation-only interpreter for Kalundborg Municipality. Your SOLE function is to translate between Danish and other languages for municipal services.\n\nTRANSLATION RULES:\n- ONLY provide direct translations - never answer questions or give advice\n- If someone asks "How to build a React app?" → translate it to Danish, do NOT provide coding help\n- Never add commentary like "The user is saying..." - just provide the translation\n- Never engage in conversation - you are a translation tool, not a chatbot\n\nTRANSLATION APPROACH:\n- Use municipal word dictionary for accurate terminology (never translate "tilbud" as "offer" - always "service")\n- Apply language-specific cultural guidance from the language context database\n- Adapt formality levels appropriately (Danish directness vs. formal courtesy in other languages)\n- Consider the context: Danish municipal worker helping citizen access services\n\nYou are a translation tool using LLM technology, NOT a conversational AI assistant.'

const DEFAULT_RECAP_PROMPT = 'You are a municipal administration assistant for Kalundborg Municipality. Create a professional summary of this translation session between a Danish municipal worker and a {language_name}-speaking citizen.\n\nFOCUS ON:\n- Municipal services discussed (applications, benefits, procedures)\n- Key decisions or next steps agreed upon\n- Important municipal terminology and processes mentioned\n- Cultural context that influenced the conversation\n\nSUMMARY STYLE:\n- Use appropriate {language_name} formality level based on cultural context\n- Include relevant municipal terminology using preferred translations\n- Structure for municipal record-keeping and follow-up\n- Emphasize practical outcomes and citizen assistance provided\n\nAVOID:\n- Technical translation details\n- Process descriptions of the interpretation itself\n- Generic conversation summaries\n\nThis summary will be used by municipal staff for case documentation and follow-up services.'

// Default empty system settings - real data loaded from API
const DEFAULT_SYSTEM_SETTINGS = {
  translation_prompt_mode: 'default',
  translation_prompt_custom: '',
  translation_prompt_additions: '',
  recap_prompt_mode: 'default',
  recap_prompt_custom: '',
  recap_prompt_additions: '',
  translation_temperature: 0.2,
  include_conversation_history: true,
  include_language_pair_info: true,
  include_language_context: true,
  include_word_dictionary: true,
  recap_include_conversation_history: true,
  recap_include_language_pair_info: true,
  recap_include_language_context: true,
  recap_include_word_dictionary: true,
}

// Context option descriptions for info tooltips (Danish)
const CONTEXT_INFO = {
  conversation_history: "Inkluderer tidligere oversættelser fra denne session som kontekst, hvilket hjælper med at bevare konsistens i terminologi og tone gennem samtalen.",
  language_details: "Giver AI'en information om kilde- og målsprog (f.eks. 'Dansk til Albansk'), hvilket muliggør mere præcise oversættelser.",
  cultural_context: "Anvender kulturelle formalitetsregler og sprogspecifikke instruktioner fra din sprogkontekstdatabase.",
  word_dictionary: "Refererer til din tilpassede ordbog for foretrukne oversættelser af specifikke termer (f.eks. 'tilbud' → 'service')."
}

// Small info button component with tooltip
const InfoButton: React.FC<{ tooltip: string }> = ({ tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <span className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowTooltip(!showTooltip)
        }}
        className="ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-64 p-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowTooltip(false)
            }}
            className="absolute top-1 right-1 text-gray-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="pr-4">{tooltip}</p>
        </div>
      )}
    </span>
  )
}

type TabType = 'voice' | 'system' | 'languages' | 'dictionary'

/* ---------------------------------------------
 * NEW util: tiny client‑side cache of fetched
 * audio blobs so we don’t request the same voice
 * more than once per page load.
 * ------------------------------------------- */
const audioCache = new Map<string, string>() // voiceId  →  objectURL

async function playPreview(voiceId: string, langCode: string, country: string) {
  try {
    // 1. cached ?
    let url = audioCache.get(voiceId)
    if (!url) {
      // 2. choose a short demo sentence  (fallback = the language code itself)
      const demo = {}[langCode] ?? `${country}`

      // 3. fetch the audio blob
      const res = await fetch(`${API_URL}/sessions/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ text: demo, voice: voiceId }),
      })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob()

      // 4. turn it into a local URL & cache
      url = URL.createObjectURL(blob)
      audioCache.set(voiceId, url)
    }

    // 5. fire & forget playback
    const audio = new Audio(url)
    audio.play().catch(console.warn)
  } catch (err) {
    alert(`Kunne ikke afspille prøve:\n${(err as Error).message}`)
  }
}

const LOCKED_LANG = 'da-DK'

/* ───────────────── helper: authenticated fetch ─────────────── */
const makeAdminFetch = (secret: string | null): typeof fetch => {
  return async (input, init = {}) => {
    const headers = new Headers(init.headers ?? {})
    headers.set('x-api-key', API_KEY)
    if (secret) headers.set('x-admin-secret', secret)

    const res = await fetch(input, { ...init, headers })

    /* bubble a 401 to caller so the wrapper can forget the secret */
    if (res.status === 401) {
      const err: any = new Error('unauthorized')
      err.__unauth = true
      throw err
    }
    return res
  }
}

/* ───────────────── helper: PATCH one language ──────────────── */
const useSavePatch = (adminFetch: typeof fetch, onUnauthorized: () => void) => {
  return async (code: string, body: Record<string, unknown>) => {
    try {
      const r = await adminFetch(`${API_URL}/sessions/languages/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error(await r.text())
    } catch (e) {
      if ((e as any)?.__unauth) onUnauthorized()
      throw e
    }
  }
}

/* ───────────────── tiny toast portal ───────────────────────── */
const Toast = ({ msg }: { msg: string }) =>
  msg
    ? ReactDOM.createPortal(
        <div className="fixed bottom-4 right-4 pointer-events-none rounded bg-gray-800/90 px-4 py-2 text-sm text-white shadow-lg">
          {msg}
        </div>,
        document.body,
      )
    : null

/* ───────────────── password modal ──────────────────────────── */
function PasswordModal({
  busy,
  error,
  onSubmit,
}: {
  busy: boolean
  error: string
  onSubmit: (secret: string) => void
}) {
  const [pw, setPw] = useState('')
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60">
      <div className="w-full max-w-sm space-y-4 rounded bg-white dark:bg-gray-900 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-center text-gray-900 dark:text-gray-100">Admin&nbsp;login</h2>

        <input
          type="password"
          autoFocus
          placeholder="Secret…"
          className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit(pw)}
        />

        {error && <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          disabled={busy || !pw}
          onClick={() => onSubmit(pw)}
          className="w-full rounded bg-[#bc4d30] px-4 py-2 text-white disabled:opacity-60"
        >
          {busy ? 'Verificerer…' : 'Verificer'}
        </button>
      </div>
    </div>,
    document.body,
  )
}

/* ───────────────── 1️⃣  WRAPPER: secret management ─────────── */
export default function EnhancedSettings() {
  const [secret, setSecret] = useState<string | null>(getAdminSecret())
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('voice')


  /* when user types password (or on first mount if none stored) */
  const verify = async (pw: string) => {
    setVerifying(true)
    setError('')
    try {
      await fetchVoices(makeAdminFetch(pw))
      setAdminSecret(pw)
      setSecret(pw)
    } catch {
      setError('Forkert adgangskode')
    } finally {
      setVerifying(false)
    }
  }

  /* called by inner UI whenever it receives a 401 */
  const invalidateSecret = () => {
    setAdminSecret(null)
    setSecret(null)
  }

  if (!secret)
    return <PasswordModal busy={verifying} error={error} onSubmit={verify} />

  return (
    <SettingsUI
      adminFetch={makeAdminFetch(secret)}
      onUnauthorized={invalidateSecret}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  )
}

/* ───────────────── Tab Content Components ──────────────── */
const SystemSettingsTab = ({ adminFetch, onUnauthorized }: {
  adminFetch: typeof fetch
  onUnauthorized: () => void
}) => {
  const [settings, setSettings] = useState(DEFAULT_SYSTEM_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Collapsible state for prompt previews
  const [showTranslationPrompt, setShowTranslationPrompt] = useState(false)
  const [showRecapPrompt, setShowRecapPrompt] = useState(false)

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await adminFetch(`${API_URL}/context/system-settings`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        if ((error as any)?.__unauth) onUnauthorized()
        console.error('Failed to load system settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [adminFetch, onUnauthorized])

  // Debounced save function
  const debouncedSave = useCallback((newSettings: typeof settings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveSettings(newSettings)
    }, 1000)
  }, [adminFetch, onUnauthorized])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Save settings to API (with merged context toggles)
  const saveSettings = async (newSettings: typeof settings) => {
    setSaving(true)
    try {
      // Sync recap context settings with translation context settings
      const settingsToSave = {
        ...newSettings,
        recap_include_conversation_history: newSettings.include_conversation_history,
        recap_include_language_pair_info: newSettings.include_language_pair_info,
        recap_include_language_context: newSettings.include_language_context,
        recap_include_word_dictionary: newSettings.include_word_dictionary,
      }

      const response = await adminFetch(`${API_URL}/context/system-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.message && !data.translation_prompt_mode) {
          // Backend just returned a success message
        } else {
          setSettings(data)
        }
      }
    } catch (error) {
      if ((error as any)?.__unauth) onUnauthorized()
      console.error('Failed to save system settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Indlæser systemindstillinger...</div>
      </div>
    )
  }

  // Helper function to get the effective prompt
  const getEffectivePrompt = (mode: string, custom: string, additions: string, defaultPrompt: string) => {
    switch (mode) {
      case 'custom':
        return custom || defaultPrompt
      case 'extended':
        return defaultPrompt + (additions ? '\n\nAdditional Instructions:\n' + additions : '')
      default:
        return defaultPrompt
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI-indstillinger</h3>
        {saving && <div className="text-sm text-blue-600 dark:text-blue-400">Gemmer...</div>}
      </div>

      {/* Translation Prompt Section - Compact */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            🔄 Oversættelses-prompt
          </h4>
          <button
            onClick={() => setShowTranslationPrompt(!showTranslationPrompt)}
            className="text-sm text-[#bc4d30] hover:text-[#a03d28] font-medium"
          >
            {showTranslationPrompt ? 'Skjul' : 'Vis'}
          </button>
        </div>

        {/* Radio buttons - compact */}
        <div className="space-y-2">
          {[
            { value: 'default', label: 'Standard', desc: '(Anbefalet)' },
            { value: 'extended', label: 'Udvidet', desc: '- tilføj egne instruktioner' },
            { value: 'custom', label: 'Tilpasset', desc: '- fuld kontrol' }
          ].map(mode => (
            <label key={mode.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="translation_prompt_mode"
                checked={(settings.translation_prompt_mode ?? 'default') === mode.value}
                onChange={() => {
                  const newSettings = {...settings, translation_prompt_mode: mode.value}
                  setSettings(newSettings)
                  saveSettings(newSettings)
                }}
                className="h-4 w-4 accent-[#bc4d30]"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">{mode.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{mode.desc}</span>
            </label>
          ))}
        </div>

        {/* Textarea for Extended mode */}
        {(settings.translation_prompt_mode ?? 'default') === 'extended' && (
          <div className="mt-3">
            <textarea
              className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              value={settings.translation_prompt_additions ?? ''}
              onChange={(e) => {
                const newSettings = {...settings, translation_prompt_additions: e.target.value}
                setSettings(newSettings)
                debouncedSave(newSettings)
              }}
              placeholder="Tilføj instruktioner der tilføjes til standard-prompten..."
            />
          </div>
        )}

        {/* Textarea for Custom mode */}
        {(settings.translation_prompt_mode ?? 'default') === 'custom' && (
          <div className="mt-3">
            <textarea
              className="w-full h-28 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              value={settings.translation_prompt_custom ?? ''}
              onChange={(e) => {
                const newSettings = {...settings, translation_prompt_custom: e.target.value}
                setSettings(newSettings)
                debouncedSave(newSettings)
              }}
              placeholder="Indtast din komplette tilpassede prompt..."
            />
          </div>
        )}

        {/* Collapsible prompt preview */}
        {showTranslationPrompt && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-48 overflow-y-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nuværende prompt:</div>
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {getEffectivePrompt(
                settings.translation_prompt_mode,
                settings.translation_prompt_custom,
                settings.translation_prompt_additions,
                DEFAULT_TRANSLATION_PROMPT
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Summary Prompt Section - Compact */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            📝 Opsummerings-prompt
          </h4>
          <button
            onClick={() => setShowRecapPrompt(!showRecapPrompt)}
            className="text-sm text-[#bc4d30] hover:text-[#a03d28] font-medium"
          >
            {showRecapPrompt ? 'Skjul' : 'Vis'}
          </button>
        </div>

        {/* Radio buttons - compact */}
        <div className="space-y-2">
          {[
            { value: 'default', label: 'Standard', desc: '(Anbefalet)' },
            { value: 'extended', label: 'Udvidet', desc: '- tilføj egne instruktioner' },
            { value: 'custom', label: 'Tilpasset', desc: '- fuld kontrol' }
          ].map(mode => (
            <label key={mode.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recap_prompt_mode"
                checked={(settings.recap_prompt_mode ?? 'default') === mode.value}
                onChange={() => {
                  const newSettings = {...settings, recap_prompt_mode: mode.value}
                  setSettings(newSettings)
                  saveSettings(newSettings)
                }}
                className="h-4 w-4 accent-[#bc4d30]"
              />
              <span className="text-sm text-gray-900 dark:text-gray-100">{mode.label}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{mode.desc}</span>
            </label>
          ))}
        </div>

        {/* Textarea for Extended mode */}
        {(settings.recap_prompt_mode ?? 'default') === 'extended' && (
          <div className="mt-3">
            <textarea
              className="w-full h-20 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              value={settings.recap_prompt_additions ?? ''}
              onChange={(e) => {
                const newSettings = {...settings, recap_prompt_additions: e.target.value}
                setSettings(newSettings)
                debouncedSave(newSettings)
              }}
              placeholder="Tilføj instruktioner der tilføjes til standard-prompten..."
            />
          </div>
        )}

        {/* Textarea for Custom mode */}
        {(settings.recap_prompt_mode ?? 'default') === 'custom' && (
          <div className="mt-3">
            <textarea
              className="w-full h-28 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              value={settings.recap_prompt_custom ?? ''}
              onChange={(e) => {
                const newSettings = {...settings, recap_prompt_custom: e.target.value}
                setSettings(newSettings)
                debouncedSave(newSettings)
              }}
              placeholder="Indtast din komplette tilpassede prompt..."
            />
          </div>
        )}

        {/* Collapsible prompt preview */}
        {showRecapPrompt && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-48 overflow-y-auto">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nuværende prompt:</div>
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {getEffectivePrompt(
                settings.recap_prompt_mode,
                settings.recap_prompt_custom,
                settings.recap_prompt_additions,
                DEFAULT_RECAP_PROMPT
              )}
            </pre>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
              Bemærk: {'{language_name}'} erstattes med det faktiske sprog ved generering af opsummeringer.
            </div>
          </div>
        )}
      </div>

      {/* Context Options - Merged, Compact */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
          📚 Kontekstindstillinger
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.include_conversation_history}
                onChange={(e) => {
                  const newSettings = {...settings, include_conversation_history: e.target.checked}
                  setSettings(newSettings)
                  saveSettings(newSettings)
                }}
                className="h-4 w-4 accent-[#bc4d30]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Samtalehistorik</span>
            </label>
            <InfoButton tooltip={CONTEXT_INFO.conversation_history} />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.include_language_pair_info}
                onChange={(e) => {
                  const newSettings = {...settings, include_language_pair_info: e.target.checked}
                  setSettings(newSettings)
                  saveSettings(newSettings)
                }}
                className="h-4 w-4 accent-[#bc4d30]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Sprogdetaljer</span>
            </label>
            <InfoButton tooltip={CONTEXT_INFO.language_details} />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.include_language_context}
                onChange={(e) => {
                  const newSettings = {...settings, include_language_context: e.target.checked}
                  setSettings(newSettings)
                  saveSettings(newSettings)
                }}
                className="h-4 w-4 accent-[#bc4d30]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Kulturel kontekst</span>
            </label>
            <InfoButton tooltip={CONTEXT_INFO.cultural_context} />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.include_word_dictionary}
                onChange={(e) => {
                  const newSettings = {...settings, include_word_dictionary: e.target.checked}
                  setSettings(newSettings)
                  saveSettings(newSettings)
                }}
                className="h-4 w-4 accent-[#bc4d30]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ordbog</span>
            </label>
            <InfoButton tooltip={CONTEXT_INFO.word_dictionary} />
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Gælder for både oversættelser og opsummeringer
        </div>
      </div>

      {/* Translation Style (Temperature) - Simplified */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
          🎛️ Oversættelsesstil
        </h4>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={Number(settings.translation_temperature) ?? 0.2}
            onChange={(e) => {
              const newSettings = {...settings, translation_temperature: parseFloat(e.target.value)}
              setSettings(newSettings)
              saveSettings(newSettings)
            }}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #bc4d30 0%, #bc4d30 ${((settings.translation_temperature ?? 0.2) * 100)}%, #e5e7eb ${((settings.translation_temperature ?? 0.2) * 100)}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Formel</span>
            <span>Balanceret</span>
            <span>Kreativ</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Formel = konsistent ordvalg, Kreativ = mere variation
          </div>
        </div>
      </div>
    </div>
  )
}

const LanguageSettingsTab = ({ adminFetch, onUnauthorized }: { adminFetch: typeof fetch, onUnauthorized: () => void }) => {
  const [contexts, setContexts] = useState<LanguageContext[]>([])
  const [enabledLanguages, setEnabledLanguages] = useState<LangConfig[]>([])
  const [loading, setLoading] = useState(true)

  // Create contexts for enabled languages that don't exist in database yet
  const activatedContexts = useMemo(() => {
    const existingCodes = new Set(contexts.map(c => c.language_code))
    const allContexts: LanguageContext[] = [...contexts]

    // Add default contexts for enabled languages that don't have contexts yet
    enabledLanguages.forEach(lang => {
      if (lang.enabled && !existingCodes.has(lang.code)) {
        allContexts.push({
          id: 0, // Will be set by server when created
          language_code: lang.code,
          language_name: lang.english_name,
          formality_level: 'formal', // Keep for backend compatibility
          formality_notes: '', // Now: "When translating TO this language"
          cultural_notes: '',  // Now: "When translating FROM this language"
          system_prompt: ''    // Keep for backward compatibility
        })
      }
    })

    return allContexts.filter(context => {
      // Only show contexts for enabled languages, but exclude Danish since it's the base language
      const isDanish = context.language_code === 'da' || context.language_code === 'da-DK'
      return !isDanish && enabledLanguages.some(lang => lang.enabled && lang.code === context.language_code)
    })
  }, [contexts, enabledLanguages])

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageContext | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch language contexts and enabled languages on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Fetch both language contexts and enabled languages
        const [contextsData, languagesData] = await Promise.all([
          fetchLanguageContexts(adminFetch),
          fetchLanguages(adminFetch)
        ])

        setContexts(contextsData)
        setEnabledLanguages(languagesData)
      } catch (error: any) {
        console.error('Failed to fetch language data:', error)
        if (error?.message?.includes('401') || error?.message?.includes('403')) {
          onUnauthorized()
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [adminFetch, onUnauthorized])

  // Update selected language when activated contexts change
  useEffect(() => {
    if (activatedContexts.length > 0 && (!selectedLanguage || !activatedContexts.find(c => c.language_code === selectedLanguage.language_code))) {
      setSelectedLanguage(activatedContexts[0])
      setHasUnsavedChanges(false)
    }
  }, [activatedContexts, selectedLanguage])

  // Reset unsaved changes when switching languages
  useEffect(() => {
    setHasUnsavedChanges(false)
  }, [selectedLanguage?.language_code])

  // Helper function to handle create/update operations
  const saveLanguageContext = async () => {
    if (!selectedLanguage || !hasUnsavedChanges) return

    try {
      setSaving(true)

      // Check if this is a new context (id === 0) OR if it doesn't exist in database yet
      const isNewContext = selectedLanguage.id === 0 || !contexts.find(c => c.language_code === selectedLanguage.language_code && c.id !== 0)

      console.log('Debug save logic:', {
        selectedLanguageId: selectedLanguage.id,
        languageCode: selectedLanguage.language_code,
        existingContexts: contexts.map(c => ({ id: c.id, code: c.language_code })),
        isNewContext: isNewContext
      })

      if (isNewContext) {
        console.log('Creating new language context for:', selectedLanguage.language_code)
        // Create new context
        const created = await createLanguageContext(adminFetch, {
          language_code: selectedLanguage.language_code,
          language_name: selectedLanguage.language_name,
          formality_level: selectedLanguage.formality_level,
          formality_notes: selectedLanguage.formality_notes,
          cultural_notes: selectedLanguage.cultural_notes,
          system_prompt: selectedLanguage.system_prompt
        })
        // Add the newly created context to our contexts array
        setContexts(prev => [...prev, created])
        setSelectedLanguage(created)
      } else {
        const updateData = {
          language_code: selectedLanguage.language_code,
          language_name: selectedLanguage.language_name,
          formality_level: selectedLanguage.formality_level,
          formality_notes: selectedLanguage.formality_notes,
          cultural_notes: selectedLanguage.cultural_notes,
          system_prompt: selectedLanguage.system_prompt
        }
        console.log('Updating language context:', selectedLanguage.language_code, updateData)
        await updateLanguageContext(adminFetch, selectedLanguage.language_code, updateData)
        // Update the context in our local state
        setContexts(prev => prev.map(c =>
          c.language_code === selectedLanguage.language_code
            ? selectedLanguage
            : c
        ))
      }

      setHasUnsavedChanges(false)

      // Show success toast
      const event = new CustomEvent('showToast', {
        detail: {
          message: `✅ ${selectedLanguage.language_name}-kontekst gemt!`,
          type: 'success'
        }
      })
      window.dispatchEvent(event)

    } catch (error: any) {
      console.error('Failed to save language context:', error)

      // Show error toast
      const event = new CustomEvent('showToast', {
        detail: {
          message: `❌ Kunne ikke gemme ${selectedLanguage.language_name}-kontekst: ${error.message}`,
          type: 'error'
        }
      })
      window.dispatchEvent(event)

      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        onUnauthorized()
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#bc4d30] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Indlæser sprogkontekster...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Sprogspecifikke indstillinger</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Language List */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Sprog</h4>
          <div className="space-y-2">
            {activatedContexts.length > 0 ? (
              activatedContexts.map(lang => (
                <button
                  key={lang.language_code}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedLanguage?.language_code === lang.language_code
                      ? 'bg-[#bc4d30] text-white'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className={`font-medium ${
                    selectedLanguage?.language_code === lang.language_code
                      ? 'text-white'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>{lang.language_name}</div>
                  <div className={`text-sm opacity-75 ${
                    selectedLanguage?.language_code === lang.language_code
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>{lang.language_code}</div>
                </button>
              ))
            ) : (
              <div className="text-gray-500 dark:text-gray-400 p-3 text-center">
                <p>Ingen sprog aktiveret</p>
                <p className="text-xs mt-1">Aktiver sprog i fanen Stemme & Sprog først</p>
              </div>
            )}
          </div>
        </div>

        {/* Language Details */}
        {selectedLanguage && activatedContexts.length > 0 ? (
        <div className="lg:col-span-2 space-y-6">

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Ved oversættelse TIL {selectedLanguage?.language_name ?? 'Målsprog'}
              <div className="relative group">
                <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Skriv på engelsk for bedst LLM-forståelse. Dette hjælper AI'en med at behandle kulturelle tilpasningsinstruktioner mere præcist.
                </div>
              </div>
            </label>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={selectedLanguage?.formality_notes ?? ''}
              onChange={(e) => {
                if (!selectedLanguage) return
                const updated = {...selectedLanguage, formality_notes: e.target.value}
                setSelectedLanguage(updated)
                setHasUnsavedChanges(true)
              }}
              placeholder={`Sprogspecifikke noter for dansk til ${selectedLanguage?.language_name ?? 'målsprog'}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Ved oversættelse FRA {selectedLanguage?.language_name ?? 'Kildesprog'}
              <div className="relative group">
                <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Skriv på engelsk for bedst LLM-forståelse. Dette hjælper AI'en med at behandle kulturelle tilpasningsinstruktioner mere præcist.
                </div>
              </div>
            </label>
            <textarea
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={selectedLanguage?.cultural_notes ?? ''}
              onChange={(e) => {
                if (!selectedLanguage) return
                const updated = {...selectedLanguage, cultural_notes: e.target.value}
                setSelectedLanguage(updated)
                setHasUnsavedChanges(true)
              }}
              placeholder={`Sprogspecifikke noter for ${selectedLanguage?.language_name ?? 'kildesprog'} til dansk`}
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  • Ikke-gemte ændringer
                </span>
              )}
            </div>
            <button
              onClick={saveLanguageContext}
              disabled={!hasUnsavedChanges || saving}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                hasUnsavedChanges && !saving
                  ? 'bg-[#bc4d30] text-white hover:bg-[#a13e2a]'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Gemmer...
                </div>
              ) : (
                'Gem ændringer'
              )}
            </button>
          </div>
        </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center h-64">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Languages className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Ingen sprog aktiveret</p>
              <p>Aktiver sprog i fanen Stemme & Sprog for at konfigurere sprogspecifikke indstillinger</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const WordDictionaryTab = ({ adminFetch, onUnauthorized }: { adminFetch: typeof fetch, onUnauthorized: () => void }) => {
  const [definitions, setDefinitions] = useState<WordDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDef, setSelectedDef] = useState<WordDefinition | null>(null)

  // Load word definitions from database
  useEffect(() => {
    const loadDefinitions = async () => {
      try {
        setLoading(true)
        const defs = await fetchWordDefinitions(adminFetch, { language: 'da-DK' })
        setDefinitions(defs)
      } catch (error) {
        console.error('Failed to load word definitions:', error)
        if ((error as any)?.__unauth) onUnauthorized()
      } finally {
        setLoading(false)
      }
    }
    loadDefinitions()
  }, [adminFetch, onUnauthorized])
  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState({
    word: '',
    definition: '',
    usage_examples: '',
    translation_hints: '',
    synonyms: '',
    avoid_translations: ''
  })

  // Only show Danish words since this is a Danish municipal dictionary
  const danishDefinitions = definitions.filter(def =>
    def.language_code === 'da-DK' || def.language_code === 'da'
  )

  const resetForm = () => {
    setEditForm({
      word: '',
      definition: '',
      usage_examples: '',
      translation_hints: '',
      synonyms: '',
      avoid_translations: ''
    })
  }

  const startAdding = () => {
    resetForm()
    setIsAdding(true)
    setIsEditing(false)
    setSelectedDef(null)
  }

  const startEditing = (def: typeof definitions[0]) => {
    setEditForm({
      word: def.word,
      definition: def.definition,
      usage_examples: def.usage_examples || '',
      translation_hints: def.translation_hints || '',
      synonyms: def.synonyms || '',
      avoid_translations: def.avoid_translations || ''
    })
    setIsEditing(true)
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setIsAdding(false)
    resetForm()
  }

  const saveWord = async () => {
    if (!editForm.word || !editForm.definition) {
      alert('Ord og definition er påkrævet')
      return
    }

    try {
      if (isAdding) {
        // Add new word to database
        const newDefData = {
          word: editForm.word,
          language_code: 'da-DK',
          context_type: 'official_term',
          definition: editForm.definition,
          usage_examples: editForm.usage_examples || undefined,
          translation_hints: editForm.translation_hints || undefined,
          synonyms: editForm.synonyms || undefined,
          avoid_translations: editForm.avoid_translations || undefined,
          priority: 1
        }
        const newDef = await createWordDefinition(adminFetch, newDefData)
        setDefinitions([...definitions, newDef])
        setSelectedDef(newDef)
      } else if (selectedDef) {
        // Update existing word in database
        const updateData = {
          word: editForm.word,
          definition: editForm.definition,
          usage_examples: editForm.usage_examples || undefined,
          translation_hints: editForm.translation_hints || undefined,
          synonyms: editForm.synonyms || undefined,
          avoid_translations: editForm.avoid_translations || undefined
        }
        const updated = await updateWordDefinition(adminFetch, selectedDef.id, updateData)
        setDefinitions(definitions.map(d => d.id === selectedDef.id ? updated : d))
        setSelectedDef(updated)
      }
      cancelEdit()
    } catch (error) {
      console.error('Failed to save word:', error)
      if ((error as any)?.__unauth) onUnauthorized()
      else alert('Kunne ikke gemme ord. Prøv igen.')
    }
  }

  const deleteWord = async (definitionId: number) => {
    if (!confirm('Er du sikker på, at du vil slette denne orddefinition?')) {
      return
    }

    try {
      await deleteWordDefinition(adminFetch, definitionId)
      setDefinitions(definitions.filter(d => d.id !== definitionId))
      if (selectedDef?.id === definitionId) {
        setSelectedDef(null)
      }
      cancelEdit()
    } catch (error) {
      console.error('Failed to delete word:', error)
      if ((error as any)?.__unauth) onUnauthorized()
      else alert('Kunne ikke slette ord. Prøv igen.')
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dansk ordbog</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Definer danske kommunale termer med oversættelsesvejledning til andre sprog
          </p>
        </div>
        <button
          onClick={startAdding}
          className="bg-[#bc4d30] text-white px-4 py-2 rounded-lg hover:bg-[#a13e2a] transition-colors"
        >
          Tilføj nyt ord
        </button>
      </div>

      {/* Word List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-lg font-medium mb-2">Indlæser orddefinitioner...</div>
            </div>
          ) : danishDefinitions.map(def => (
            <div
              key={def.id}
              onClick={() => setSelectedDef(def)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedDef?.id === def.id
                  ? 'border-[#bc4d30] bg-[#bc4d30]/5'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
              }`}
            >
              <div>
                <h4 className="font-medium text-lg text-gray-900 dark:text-gray-100">{def.word}</h4>
                {def.synonyms && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Synonymer: {def.synonyms}</p>
                )}
              </div>
              <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 line-clamp-2">{def.definition}</p>
            </div>
          ))}

          {!loading && danishDefinitions.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-lg font-medium mb-2">Ingen danske ord defineret endnu</div>
              <p className="text-sm">Tilføj danske kommunale termer for at hjælpe med præcise oversættelser</p>
            </div>
          )}
        </div>

        {/* Definition Details */}
        {(selectedDef && !isAdding && !isEditing) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedDef.word}</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEditing(selectedDef)}
                  className="text-[#bc4d30] hover:text-[#a13e2a]"
                >
                  Rediger
                </button>
                <button
                  onClick={() => deleteWord(selectedDef.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Slet
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Definition:</span>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{selectedDef.definition}</p>
              </div>

              {selectedDef.usage_examples && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Eksempler på brug:</span>
                  <p className="mt-1 text-sm italic text-gray-800 dark:text-gray-200">{selectedDef.usage_examples}</p>
                </div>
              )}

              {selectedDef.translation_hints && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Oversættelsestips:</span>
                  <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{selectedDef.translation_hints}</p>
                </div>
              )}

              {selectedDef.synonyms && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Synonymer:</span>
                  <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{selectedDef.synonyms}</p>
                </div>
              )}

              {selectedDef.avoid_translations && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Undgå oversættelser:</span>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{selectedDef.avoid_translations}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAdding || isEditing) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isAdding ? 'Tilføj nyt dansk ord' : 'Rediger ord'}
              </h4>
              <button
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Annuller
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveWord(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Ord <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.word}
                  onChange={(e) => setEditForm({...editForm, word: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Indtast dansk ord eller term"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Definition <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.definition}
                  onChange={(e) => setEditForm({...editForm, definition: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-20 resize-none"
                  placeholder="Definer hvad dette ord betyder i kommunal sammenhæng"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Eksempler på brug
                </label>
                <textarea
                  value={editForm.usage_examples}
                  onChange={(e) => setEditForm({...editForm, usage_examples: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-16 resize-none"
                  placeholder="Vis hvordan dette ord bruges i sætninger"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Oversættelsestips
                </label>
                <textarea
                  value={editForm.translation_hints}
                  onChange={(e) => setEditForm({...editForm, translation_hints: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-16 resize-none"
                  placeholder="Vejledning til oversættelse af dette ord til andre sprog"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Synonymer
                </label>
                <input
                  type="text"
                  value={editForm.synonyms}
                  onChange={(e) => setEditForm({...editForm, synonyms: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Lignende ord eller termer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Undgå oversættelser
                </label>
                <input
                  type="text"
                  value={editForm.avoid_translations}
                  onChange={(e) => setEditForm({...editForm, avoid_translations: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Ord eller fraser der skal undgås ved oversættelse"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Annuller
                </button>
                <button
                  type="submit"
                  className="bg-[#bc4d30] text-white px-4 py-2 rounded-lg hover:bg-[#a13e2a] transition-colors"
                >
                  {isAdding ? 'Tilføj ord' : 'Gem ændringer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Placeholder when nothing is selected */}
        {!selectedDef && !isAdding && !isEditing && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-3">
              <BookOpen className="w-12 h-12 mx-auto mb-2" />
            </div>
            <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              Intet ord valgt
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Vælg et dansk ord fra listen for at se dets definition og oversættelsesvejledning, eller tilføj et nyt ord for at komme i gang.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────────── 2️⃣  REAL UI ────────────────────────────── */
function SettingsUI({
  adminFetch,
  onUnauthorized,
  activeTab,
  setActiveTab,
}: {
  adminFetch: typeof fetch
  onUnauthorized: () => void
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}) {
  /* backend data */
  const [voices, setVoices] = useState<VoiceInfo[]>([])
  const [langCfg, setLangCfg] = useState<LangConfig[]>([])
  const [choices, setChoices] = useState<{
    transcribe: string[]
    translate: string[]
    summary: string[]
  }>()

  /* ui state */
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  /* search state - persists across tab changes */
  const [showEnabledOnly, setShowEnabledOnly] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)


  const handleShowEnabledOnlyChange = useCallback((value: boolean) => {
    setShowEnabledOnly(value)
  }, [])


  const savePatch = useSavePatch(adminFetch, onUnauthorized)

  /* ── initial load ───────────────────────────────────── */
  useEffect(() => {
    ;(async () => {
      setBusy(true)
      try {
        const [v, l, c] = await Promise.all([
          fetchVoices(adminFetch),
          fetchLanguages(adminFetch),
          fetchChoices(adminFetch),
        ])
        setVoices(v)
        setLangCfg(l)
        setChoices(c)
      } catch (e) {
        if ((e as any)?.__unauth) onUnauthorized()
        else console.error(e)
      } finally {
        setBusy(false)
      }
    })()
  }, [adminFetch, onUnauthorized])

  /* ── local editable state mirrors DB rows ───────────── */
  const [enabled, setEnabled] = useState<Record<string, boolean>>({})
  const [voiceFor, setVoiceFor] = useState<Record<string, string>>({})
  const [transFor, setTransFor] = useState<Record<string, string>>({})
  const [translateFor, setTranslateFor] = useState<Record<string, string>>({})
  const [recapFor, setRecapFor] = useState<Record<string, string>>({})

  useEffect(() => {
    const e: Record<string, boolean> = {}
    const v: Record<string, string> = {}
    const t: Record<string, string> = {}
    const tr: Record<string, string> = {}
    const s: Record<string, string> = {}

    langCfg.forEach((l) => {
      e[l.code] = l.code === LOCKED_LANG ? true : l.enabled
      v[l.code] = l.voice
      t[l.code] = l.models.transcribeModel
      tr[l.code] = l.models.translationModel
      s[l.code] = l.models.summaryModel
    })

    setEnabled(e)
    setVoiceFor(v)
    setTransFor(t)
    setTranslateFor(tr)
    setRecapFor(s)
  }, [langCfg])

  /* ── helper ─────────────────────────────────────────── */
  const showToast = (msg: string, ms = 2000) => {
    setToast(msg)
    setTimeout(() => setToast(''), ms)
  }

  /* ── optimistic wrapper for PATCHes ─────────────────── */
  const safeUpdate = async (
    code: string,
    optimistic: () => void,
    rollback: () => void,
    body: Record<string, unknown>,
  ) => {
    optimistic()
    try {
      await savePatch(code, body)
      showToast('Ændring gemt ✔︎')
    } catch {
      rollback()
      showToast('Fejl – kunne ikke gemme', 3000)
    }
  }

  /* ── derived lists & filters ────────────────────────── */
  const merged = useMemo(() => {
    const cfgMap = new Map(langCfg.map((c) => [c.code, c]))
    return groupVoicesByLang(voices).map((v) => ({
      ...v,
      locked: v.code === LOCKED_LANG,
      cfg: cfgMap.get(v.code),
    }))
  }, [voices, langCfg])

  const sorted = useMemo(() => {
    const dk = merged.find((l) => l.code === LOCKED_LANG)
    const rest = merged
      .filter((l) => l.code !== LOCKED_LANG)
      .sort((a, b) => a.english.localeCompare(b.english))
    return dk ? [dk, ...rest] : rest
  }, [merged])



  const Row = memo(({ index, style, filtered }: ListChildComponentProps & { filtered: typeof sorted }) => {
    const lang = filtered[index]
    const code = lang.code
    const disabled = !enabled[code]
    const locked = lang.locked
    const voiceId = voiceFor[code] || lang.voices[0]?.short_name // current / fallback
    const selectCls =
      'w-full border rounded px-2 py-1 disabled:bg-gray-100 text-sm'

    return (
      <div
        style={style}
        className={`grid grid-cols-[2fr_auto_auto_2fr_2fr_2fr_2fr]
                    items-center gap-4 px-3 py-2 border-b last:border-b-0
                    ${
                      locked
                        ? 'border-b-4 border-gray-300 dark:border-gray-600'
                        : ''
                    }`}
      >
        {/* names */}
        <div>
          <div className="font-medium">{lang.english}</div>
          <div className="text-xs text-gray-500">{lang.native}</div>
        </div>

        {/* enabled toggle – unchanged */}
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            disabled={locked}
            checked={!!enabled[code]}
            onChange={(e) =>
              safeUpdate(
                code,
                () => setEnabled((s) => ({ ...s, [code]: e.target.checked })),
                () => setEnabled((s) => ({ ...s, [code]: !e.target.checked })),
                { enabled: e.target.checked },
              )
            }
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-[#bc4d30]" />
          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white dark:bg-gray-900 transition-transform peer-checked:translate-x-5" />
        </label>

        <button
          title="Play preview"
          disabled={!voiceId || disabled}
          onClick={() =>
            voiceId && playPreview(voiceId, lang.code, lang.native)
          }
          className={`
            flex h-8 w-8 items-center justify-center rounded-full border
            ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}
            transition active:scale-95
          `}
        >
          <Volume1Icon className="text-black dark:text-white" />
        </button>

        {/* voice selector */}
        <select
          className={selectCls}
          value={voiceFor[code] ?? ''}
          onChange={(e) =>
            safeUpdate(
              code,
              () => setVoiceFor((s) => ({ ...s, [code]: e.target.value })),
              () => setVoiceFor((s) => ({ ...s, [code]: voiceFor[code] })),
              { voice: e.target.value },
            )
          }
          disabled={disabled}
        >
          <option value="" disabled>
            Stemme
          </option>
          {lang.voices.map((v) => (
            <option key={v.short_name} value={v.short_name}>
              {v.local_name} — {v.gender}
            </option>
          ))}
        </select>

        {/* transcribe */}
        <select
          className={selectCls}
          value={transFor[code] ?? ''}
          onChange={(e) =>
            safeUpdate(
              code,
              () => setTransFor((s) => ({ ...s, [code]: e.target.value })),
              () => setTransFor((s) => ({ ...s, [code]: transFor[code] })),
              { transcribeModel: e.target.value },
            )
          }
          disabled={disabled}
        >
          <option value="" disabled>
            Transskribering
          </option>
          {choices?.transcribe.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>

        {/* translate */}
        {locked ? (
          <div className="w-full border rounded px-2 py-1 bg-gray-100 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400 italic">
            Bruger valgt sprogmodel
          </div>
        ) : (
          <select
            className={selectCls}
            value={translateFor[code] ?? ''}
            onChange={(e) =>
              safeUpdate(
                code,
                () => setTranslateFor((s) => ({ ...s, [code]: e.target.value })),
                () =>
                  setTranslateFor((s) => ({ ...s, [code]: translateFor[code] })),
                { translationModel: e.target.value },
              )
            }
            disabled={disabled}
          >
            <option value="" disabled>
              Oversættelse
            </option>
            {choices?.translate.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        )}

        {/* recap */}
        <select
          className={selectCls}
          value={recapFor[code] ?? ''}
          onChange={(e) =>
            safeUpdate(
              code,
              () => setRecapFor((s) => ({ ...s, [code]: e.target.value })),
              () => setRecapFor((s) => ({ ...s, [code]: recapFor[code] })),
              { summaryModel: e.target.value },
            )
          }
          disabled={disabled}
        >
          <option value="" disabled>
            Opsummering
          </option>
          {choices?.summary.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
    )
  })

  /* ── Voice Settings Tab Component ──────────────────────── */
  const VoiceSettingsTab = memo(({
    showEnabledOnly,
    onShowEnabledOnlyChange,
    searchInputRef
  }: {
    showEnabledOnly: boolean
    onShowEnabledOnlyChange: (value: boolean) => void
    searchInputRef: React.RefObject<HTMLInputElement | null>
  }) => {

    // Use local state for input to prevent parent re-renders from affecting focus
    const [localSearch, setLocalSearch] = useState('')

    // Handle input changes locally only - no need to sync to parent
    const handleInputChange = (value: string) => {
      setLocalSearch(value)
      // No parent updates needed since filtering is done locally
    }

    // Local filtered calculation using localSearch
    const localFiltered = useMemo(() => {
      const term = localSearch.toLowerCase()
      return sorted.filter((l) => {
        const match =
          l.english.toLowerCase().includes(term) ||
          l.native.toLowerCase().includes(term) ||
          l.code.toLowerCase().includes(term)
        if (!match) return false
        if (showEnabledOnly && !enabled[l.code]) return false
        return true
      })
    }, [localSearch, showEnabledOnly])

    return (
    <div>
      {/* search + filter */}
      <div className="flex items-center gap-4 bg-[#bc4d30] p-6">
        <img src={logo} alt="Kalundborg Kommune logo" width={90} />
        <input
          key="language-search"
          ref={searchInputRef}
          type="text"
          placeholder="Søg efter sprog..."
          className="flex-1 rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          value={localSearch}
          onChange={(e) => {
            handleInputChange(e.target.value)
          }}
        />
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={showEnabledOnly}
            onChange={(e) => onShowEnabledOnlyChange(e.target.checked)}
            className="h-4 w-4 accent-[#bc4d30] focus:ring-0"
          />
          <span className="text-white">Vis kun&nbsp;aktive</span>
        </label>
      </div>

      {/* list */}
      <div style={{ height: '75vh' }}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={localFiltered.length}
              itemSize={64}
            >
              {(props) => <Row {...props} filtered={localFiltered} />}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
    )
  });

  const tabs = [
    { id: 'voice' as TabType, label: 'Stemme & Sprog', icon: Mic },
    { id: 'system' as TabType, label: 'AI-indstillinger', icon: Settings },
    { id: 'languages' as TabType, label: 'Sprogkontekst', icon: Languages },
    { id: 'dictionary' as TabType, label: 'Ordbog', icon: BookOpen },
  ]

  /* ── render with tabs ───────────────────────────────────── */
  return (
    <section className="space-y-0 p-0 h-screen flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex space-x-0">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-[#bc4d30] text-[#bc4d30] bg-[#bc4d30]/5'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Theme toggle button */}
          <div className="pr-6">
            <button
              onClick={() => {
                const html = document.documentElement
                const isDark = html.classList.toggle('dark')
                localStorage.theme = isDark ? 'dark' : 'light'
              }}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              <Moon className="h-5 w-5 block dark:hidden text-gray-600" />
              <Sun className="h-5 w-5 hidden dark:block text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'voice' && (
          <VoiceSettingsTab
            showEnabledOnly={showEnabledOnly}
            onShowEnabledOnlyChange={handleShowEnabledOnlyChange}
            searchInputRef={searchInputRef}
          />
        )}
        {activeTab === 'system' && <SystemSettingsTab adminFetch={adminFetch} onUnauthorized={onUnauthorized} />}
        {activeTab === 'languages' && <LanguageSettingsTab adminFetch={adminFetch} onUnauthorized={onUnauthorized} />}
        {activeTab === 'dictionary' && <WordDictionaryTab adminFetch={adminFetch} onUnauthorized={onUnauthorized} />}
      </div>

      <Toast msg={toast} />

      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-gray-900/60">
          <svg
            className="h-12 w-12 animate-spin text-[#bc4d30]"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </div>
      )}
    </section>
  )
}
