import React, { useEffect, useState } from 'react'
import { Language } from './LanguageModal'
import { API_URL } from '../config'
import { useFetchWithAuth } from '../lib/fetchWithAuth'
import { useLanguage } from '../context/LanguageContext'
import InfoModal from './InfoModal'
import { ArrowRight, Loader2 } from 'lucide-react'

interface LanguageSelectorPanelProps {
  onLanguageSelected: (language: Language) => void
  onLanguageHover?: (languageName: string | null) => void
}

const LOCKED_LANG = 'da-DK'

const LanguageSelectorPanel: React.FC<LanguageSelectorPanelProps> = ({
  onLanguageSelected,
  onLanguageHover,
}) => {
  console.log('[LanguageSelectorPanel] Component rendered')
  const { fetchWithAuth } = useFetchWithAuth()
  const { t, setCurrentLanguage } = useLanguage()

  const [langs, setLangs] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null,
  )

  // Load available languages
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetchWithAuth(`${API_URL}/sessions/available-languages`)
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
        setLangs([]) // Clear languages on error
      } finally {
        setLoading(false)
      }
    })()
  }, [fetchWithAuth])

  const handleLanguageClick = (language: Language) => {
    console.log(
      '[LanguageSelectorPanel] Language clicked:',
      language.english_name,
    )
    setSelectedLanguage(language)
    setShowInfoModal(true)
  }

  const handleInfoModalAccept = () => {
    setShowInfoModal(false)
    if (selectedLanguage) {
      setCurrentLanguage(selectedLanguage.code)
      onLanguageSelected(selectedLanguage)
    }
  }

  const handleInfoModalReject = () => {
    setShowInfoModal(false)
    setSelectedLanguage(null)
    // Reset to previous state - don't change language or create session
  }

  return (
    <div>
      {/* Error state - hide authentication errors */}
      {err && !err.includes('authentication') && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm text-center">
            {err}
          </p>
        </div>
      )}

      {/* Language list - show immediately */}
      {langs.length > 0 && (
        <div className="space-y-2 max-w-md mx-auto">
          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-2 mb-4">
              <Loader2 className="h-4 w-4 animate-spin text-[#bc4d30] mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('loadingLanguages')}
              </span>
            </div>
          )}

          {langs.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageClick(lang)}
                onMouseEnter={() => onLanguageHover?.(lang.english_name)}
                onMouseLeave={() => onLanguageHover?.(null)}
                disabled={loading}
                className={`
                  w-full p-2 rounded-md border border-gray-200 dark:border-gray-600
                  ${
                    loading
                      ? 'opacity-70 cursor-not-allowed'
                      : 'hover:border-[#bc4d30] hover:bg-[#bc4d30]/5 dark:hover:bg-[#bc4d30]/10'
                  }
                  focus:outline-none focus:ring-2 focus:ring-[#bc4d30]/50
                  transition-all duration-200 text-left group
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#bc4d30]">
                      {lang.english_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      {lang.native_name}
                    </div>
                    {lang.region && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {lang.region}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#bc4d30] transition-colors" />
                </div>
              </button>
            ))}
        </div>
      )}

      {/* Info Modal */}
      {selectedLanguage && (
        <InfoModal
          isOpen={showInfoModal}
          onAccept={handleInfoModalAccept}
          onReject={handleInfoModalReject}
          selectedLanguage={selectedLanguage}
        />
      )}
    </div>
  )
}

export default LanguageSelectorPanel
