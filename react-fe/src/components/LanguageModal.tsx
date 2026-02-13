// pages/LanguageModal.tsx
import React, { useEffect, useState } from 'react'
import { SessionData } from '../App'
import { API_URL, API_KEY } from '../config'
import { useFetchWithAuth } from '../lib/fetchWithAuth'
import { useLanguage } from '../context/LanguageContext'
import { Globe } from 'lucide-react'
import languageTranslations from '../data/languageTranslations.json'
import { LangConfig } from '../lib/fetchLanguages'

export interface Language {
  code: string
  english_name: string
  native_name: string
  region: string
}

interface Props {
  onSessionCreated: (session: SessionData) => void
}

const LOCKED_LANG = 'da-DK' // <- single source of truth

const LanguageModal: React.FC<Props> = ({ onSessionCreated }) => {
  const { fetchWithAuth } = useFetchWithAuth()
  const { setCurrentLanguage } = useLanguage()

  /* ── state ────────────────────────────────────────────── */
  const [langs, setLangs] = useState<Language[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null)
  const [modelInfo, setModelInfo] = useState<LangConfig | null>(null)

  /* ── initial load ─────────────────────────────────────── */
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetchWithAuth(
          `${API_URL}/sessions/available-languages`,
          { headers: { 'x-api-key': API_KEY } },
        )
        if (!r.ok) throw new Error(await r.text())

        const data: Language[] = await r.json()
        // strip ALL Danish variants on the client as an extra safety‑net
        setLangs(data.filter((l) =>
          l.code !== LOCKED_LANG &&
          !l.code.startsWith('da') &&
          l.english_name.toLowerCase() !== 'danish'
        ))
      } catch (e) {
        setErr((e as Error).message)
      }
    })()
  }, [fetchWithAuth])

  /* ── choose a language ────────────────────────────────── */
  const selectLanguage = async (code: string) => {
    if (busy) return
    const chosen = langs.find((l) => l.code === code)!
    setSelectedLanguage(chosen)

    // Fetch model info for selected language
    try {
      const response = await fetchWithAuth(`${API_URL}/sessions/languages`, {
        headers: { 'x-api-key': API_KEY }
      })
      if (response.ok) {
        const langConfigs: LangConfig[] = await response.json()
        const config = langConfigs.find(l => l.code === code)
        setModelInfo(config || null)
      }
    } catch (error) {
      console.error('Failed to fetch model info:', error)
      setModelInfo(null)
    }
  }

  const startSession = async () => {
    if (busy || !selectedLanguage) return
    try {
      setBusy(true)
      setErr('')

      // Set the interface language to the selected language
      setCurrentLanguage(selectedLanguage.code)

      /* 1️⃣  create an empty session */
      const start = await fetchWithAuth(`${API_URL}/sessions/start-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      })
      if (!start.ok) throw new Error(await start.text())
      const { session_id } = await start.json()

      /* 2️⃣  store the chosen language – DK is auto‑paired server‑side */
      const sel = await fetchWithAuth(`${API_URL}/sessions/select-language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ session_id, language: selectedLanguage.code }),
      })
      if (!sel.ok) throw new Error(await sel.text())
      const session = await sel.json()

      onSessionCreated({
        ...session,
        language_a: selectedLanguage,
        language_b: {
          code: LOCKED_LANG,
          english_name: 'Danish',
          native_name: 'Dansk',
          region: 'Denmark',
        },
      })
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleReject = () => {
    setSelectedLanguage(null)
    setModelInfo(null)
    // Reset to previous state - don't change language or create session
  }

  // Get language-specific welcome message
  const getLanguageSpecificContent = (language: Language) => {
    return languageTranslations[language.code as keyof typeof languageTranslations] || {
      welcome: 'Welcome to Vejle Municipality\'s Interpretation Solution',
      description: 'This solution helps you communicate in Danish and your chosen language.'
    }
  }

  /* ── UI ───────────────────────────────────────────────── */

  // Mobile-first full-screen layout
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Mobile UI
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-[#bc4d30]">
          <h1 className="text-lg font-semibold text-white text-center">
            {selectedLanguage ? selectedLanguage.native_name : 'Vælg sprog'}
          </h1>
        </div>

        {!selectedLanguage ? (
          /* Step 1: Language Selection */
          <>
            {/* Brief instruction */}
            <div className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Vælg det sprog der skal oversættes
              </p>
            </div>

            {/* Language list - full height scrollable */}
            <div className="flex-1 overflow-y-auto">
              {langs.length === 0 && !err ? (
                /* Loading skeleton */
                <div className="p-4 space-y-2">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
                    >
                      <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-2" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {langs.map((l) => (
                    <button
                      key={l.code}
                      disabled={busy}
                      onClick={() => selectLanguage(l.code)}
                      className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-left active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-lg">
                        {l.native_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {l.english_name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error state */}
            {err && (
              <div className="flex-shrink-0 p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{err}</p>
              </div>
            )}
          </>
        ) : (
          /* Step 2: Confirmation - primarily in selected language */
          <>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Language pair header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {selectedLanguage.native_name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedLanguage.english_name} ↔ Dansk
                </p>
              </div>

              {/* Welcome message in selected language */}
              <div className="bg-[#bc4d30]/5 dark:bg-[#bc4d30]/10 rounded-xl p-5 mb-6">
                <p className="text-lg font-medium text-gray-800 dark:text-gray-200 text-center leading-relaxed">
                  {getLanguageSpecificContent(selectedLanguage).welcome}
                </p>
              </div>

              {/* How it works - in selected language */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#bc4d30] text-white rounded-full flex items-center justify-center font-medium">1</span>
                  <span className="text-gray-700 dark:text-gray-300 pt-1">
                    {getLanguageSpecificContent(selectedLanguage).step1 || 'Write or speak your message'}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#bc4d30] text-white rounded-full flex items-center justify-center font-medium">2</span>
                  <span className="text-gray-700 dark:text-gray-300 pt-1">
                    {getLanguageSpecificContent(selectedLanguage).step2 || 'The message is automatically translated'}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#bc4d30] text-white rounded-full flex items-center justify-center font-medium">3</span>
                  <span className="text-gray-700 dark:text-gray-300 pt-1">
                    {getLanguageSpecificContent(selectedLanguage).step3 || 'The other person can listen and respond'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-3">
              <button
                onClick={startSession}
                disabled={busy}
                className="w-full py-4 bg-[#bc4d30] text-white rounded-xl font-medium text-lg disabled:opacity-50 active:bg-[#a03d28] transition-colors flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Starter...</span>
                  </>
                ) : (
                  getLanguageSpecificContent(selectedLanguage).buttonText || 'Start'
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={busy}
                className="w-full py-3 text-gray-600 dark:text-gray-400 font-medium active:bg-gray-200 dark:active:bg-gray-700 rounded-xl transition-colors"
              >
                ← Vælg et andet sprog
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Desktop UI (original)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-7xl rounded-lg bg-white dark:bg-gray-900 p-3 sm:p-4 md:p-8 shadow-lg max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">

        {/* Main Content - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-8 flex-1 min-h-0">
          {/* Left Column - Welcome Text & Disclaimer */}
          <div className="flex flex-col">
            {!selectedLanguage ? (
              <>
                {/* Initial welcome state - Danish content first */}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Velkommen til Vejle Kommunes Tolkeløsning
                </h2>

                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Vælg det sprog, du gerne vil oversætte fra. Alle oversættelser vil blive parret med dansk.
                </p>

                {/* How it works in Danish */}
                <div className="mb-6">
                  <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                    Sådan virker det:
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">1</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Skriv eller tal din besked
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">2</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Beskeden oversættes automatisk
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">3</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Den anden person kan høre og svare
                      </span>
                    </div>
                  </div>
                </div>

                {/* Placeholder grey box where orange box will appear */}
                <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                    <Globe size={18} />
                    <span>
                      Vælg et sprog
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Language selected state - Danish content first */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Velkommen til Vejle Kommunes Tolkeløsning
                </h2>

                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Vælg det sprog, du gerne vil oversætte fra. Alle oversættelser vil blive parret med dansk.
                </p>

                {/* How it works in Danish */}
                <div className="mb-6">
                  <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                    Sådan virker det:
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">1</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Skriv eller tal din besked
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">2</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Beskeden oversættes automatisk
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">3</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Den anden person kan høre og svare
                      </span>
                    </div>
                  </div>
                </div>

                {/* Orange box with translated content */}
                <div className="p-6 bg-[#bc4d30]/10 rounded-lg border border-[#bc4d30]/20">
                  {/* Language pair header */}
                  <div className="flex items-center gap-2 text-[#bc4d30] dark:text-[#bc4d30] font-medium mb-4">
                    <Globe size={18} />
                    <span>
                      {selectedLanguage.native_name} - Dansk
                    </span>
                  </div>

                  {/* Welcome title in selected language */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {getLanguageSpecificContent(selectedLanguage).welcome}
                  </h2>

                  {/* Description in selected language */}
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    {getLanguageSpecificContent(selectedLanguage).description}
                  </p>

                  {/* How it works in selected language */}
                  <div>
                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                      {getLanguageSpecificContent(selectedLanguage).howItWorksTitle || 'How it works:'}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">1</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {getLanguageSpecificContent(selectedLanguage).step1 || 'Write or speak your message'}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">2</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {getLanguageSpecificContent(selectedLanguage).step2 || 'The message is automatically translated'}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-[#bc4d30] text-white text-xs rounded-full flex items-center justify-center font-medium">3</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {getLanguageSpecificContent(selectedLanguage).step3 || 'The other person can listen and respond'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Model information display - concise format */}
                  {modelInfo && (
                    <div className="mt-4 pt-3 border-t border-[#bc4d30]/20">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Models: {modelInfo.models.transcribeModel} • {modelInfo.models.translationModel} • {modelInfo.models.summaryModel}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Column - Language Selection */}
          <div className="flex flex-col min-h-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex-shrink-0">
              Vælg dit sprog
            </h3>

            {/* Error state */}
            {err && !err.includes('authentication') && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex-shrink-0">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {err}
                </p>
              </div>
            )}

            {/* Loading indicator - Skeleton placeholders */}
            {langs.length === 0 && !err ? (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="overflow-y-auto space-y-2 pr-4 flex-1">
                  {/* Create 12 skeleton placeholders that match the actual button structure */}
                  {Array.from({ length: 12 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="w-full p-3 rounded border border-gray-200 dark:border-gray-600 animate-pulse"
                    >
                      <div>
                        {/* Native name skeleton - font-medium height, truly randomized 100-300px */}
                        <div
                          className="bg-gray-300 dark:bg-gray-600 rounded mb-1"
                          style={{
                            width: `${100 + Math.abs(Math.sin(index * 12.34) * Math.cos(index * 5.67) * 200)}px`,
                            height: '22px'
                          }}
                        />
                        {/* English name skeleton - text-sm height, truly randomized 100-300px */}
                        <div
                          className="bg-gray-200 dark:bg-gray-700 rounded"
                          style={{
                            width: `${100 + Math.abs(Math.sin(index * 7.89) * Math.cos(index * 3.45) * 200)}px`,
                            height: '18px'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Language list - Scrollable container */
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="overflow-y-auto space-y-2 pr-4 flex-1">
                  {langs.map((l) => (
                    <button
                      key={l.code}
                      disabled={busy}
                      onClick={() => selectLanguage(l.code)}
                      className={`w-full p-3 rounded border text-left group disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                        selectedLanguage?.code === l.code
                          ? 'border-[#bc4d30] bg-[#bc4d30]/10 dark:bg-[#bc4d30]/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-[#bc4d30] hover:bg-[#bc4d30]/5 dark:hover:bg-[#bc4d30]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${
                            selectedLanguage?.code === l.code
                              ? 'text-[#bc4d30] dark:text-[#bc4d30]'
                              : 'text-gray-900 dark:text-white group-hover:text-[#bc4d30]'
                          }`}>
                            {l.native_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {l.english_name}
                          </div>
                          {l.region && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {l.region}
                            </div>
                          )}
                        </div>
                        <div className={`transition-opacity ${
                          selectedLanguage?.code === l.code
                            ? 'text-[#bc4d30] opacity-100'
                            : 'text-[#bc4d30] opacity-0 group-hover:opacity-100'
                        }`}>
                          {selectedLanguage?.code === l.code ? '✓' : '→'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Area - Always visible */}
        <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleReject}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuller
            </button>
            <button
              onClick={startSession}
              disabled={busy || !selectedLanguage}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                !selectedLanguage
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : busy
                  ? 'bg-[#bc4d30] text-white opacity-50 cursor-not-allowed'
                  : 'bg-[#bc4d30] text-white hover:bg-[#a03d28]'
              }`}
            >
              {busy ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
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
                  Opretter session...
                </>
              ) : selectedLanguage ? (
                getLanguageSpecificContent(selectedLanguage).buttonText || 'Jeg forstår, lad os begynde'
              ) : (
                'Jeg forstår, lad os begynde'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LanguageModal
