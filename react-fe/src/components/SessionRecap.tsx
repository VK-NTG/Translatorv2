import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { API_URL, API_KEY } from '../config'
import { useFetchWithAuth } from '../lib/fetchWithAuth'

interface ChatHistoryItem {
  id: number
  timestamp: string
  from_lang: string
  to_lang: string
  from_lang_name: string
  to_lang_name: string
  original: string
  translated: string
}

interface RecapData {
  summary_a: string
  summary_b: string
  language_a: string
  language_b: string
  language_a_name: string
  language_b_name: string
  chat_history: ChatHistoryItem[]
  session_info: {
    created_at: string
    translation_count: number
    status: string
  }
}

// Map language names to their native names for display
const getNativeLanguageName = (langName: string): string => {
  const nativeNames: Record<string, string> = {
    'Danish (Denmark)': 'Dansk',
    'Danish': 'Dansk',
    'German (Germany)': 'Tysk',
    'German': 'Tysk',
    'English (United States)': 'Engelsk',
    'English (United Kingdom)': 'Engelsk',
    'English': 'Engelsk',
    'Arabic': 'Arabisk',
    'Arabic (Saudi Arabia)': 'Arabisk',
    'Ukrainian': 'Ukrainsk',
    'Ukrainian (Ukraine)': 'Ukrainsk',
    'Polish': 'Polsk',
    'Polish (Poland)': 'Polsk',
    'Turkish': 'Tyrkisk',
    'Turkish (Turkey)': 'Tyrkisk',
    'Romanian': 'Rumænsk',
    'Romanian (Romania)': 'Rumænsk',
  }
  return nativeNames[langName] || langName
}

const SessionRecap: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const sessionId = location.state?.sessionId as string | undefined

  const [recapData, setRecapData] = useState<RecapData | null>(null)
  const [activeTab, setActiveTab] = useState<'summary_a' | 'summary_b' | 'chat'>('summary_a')
  const [error, setError] = useState<string | null>(null)
  const { fetchWithAuth } = useFetchWithAuth()

  useEffect(() => {
    if (!recapData && sessionId) {
      const fetchRecap = async () => {
        try {
          const res = await fetchWithAuth(
            `${API_URL}/sessions/recap?session_id=${sessionId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
              },
            },
          )
          if (!res.ok) {
            throw new Error(`Failed to fetch recap (${res.status})`)
          }
          const data = await res.json()
          setRecapData(data)
        } catch (err) {
          setError((err as Error).message)
        }
      }
      fetchRecap()
    }
  }, [sessionId, recapData])

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Opsummering af samtale</h1>
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#bc4d30] text-white rounded"
        >
          Ny Session
        </button>
      </div>
    )
  }

  if (!recapData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Opsummering af samtale</h1>
        <div className="flex items-center space-x-3">
          <svg
            className="h-5 w-5 animate-spin text-[#bc4d30]"
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
          <span className="text-gray-500 dark:text-gray-400">Henter opsummering...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Opsummering</h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Session fra {recapData.session_info.created_at} • {recapData.session_info.translation_count} oversættelser
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle button */}
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('summary_a')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary_a'
                ? 'border-[#bc4d30] text-[#bc4d30]'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            📝 {getNativeLanguageName(recapData.language_a_name)} opsummering
          </button>
          <button
            onClick={() => setActiveTab('summary_b')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary_b'
                ? 'border-[#bc4d30] text-[#bc4d30]'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            📝 {getNativeLanguageName(recapData.language_b_name)} opsummering
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'chat'
                ? 'border-[#bc4d30] text-[#bc4d30]'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            💬 Fuld Samtale
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Summary A Tab */}
        {activeTab === 'summary_a' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#bc4d30] dark:text-[#d85a3a]">
              {getNativeLanguageName(recapData.language_a_name)} opsummering
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-relaxed">
                {recapData.summary_a}
              </pre>
            </div>
          </div>
        )}

        {/* Summary B Tab */}
        {activeTab === 'summary_b' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#bc4d30] dark:text-[#d85a3a]">
              {getNativeLanguageName(recapData.language_b_name)} opsummering
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-relaxed">
                {recapData.summary_b}
              </pre>
            </div>
          </div>
        )}

        {/* Chat History Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#bc4d30] dark:text-[#d85a3a]">
              Fuld Samtale ({recapData.chat_history.length} {recapData.chat_history.length === 1 ? 'oversættelse' : 'oversættelser'})
            </h2>
            <div className="space-y-4">
              {recapData.chat_history.map((item, index) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                    <span className="text-xs text-gray-500">{item.timestamp}</span>
                  </div>
                  
                  {/* Original Text */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">
                        {item.from_lang_name} → {item.to_lang_name}
                      </span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border-l-4 border-blue-400">
                      <p className="text-gray-800 dark:text-gray-200">{item.original}</p>
                    </div>
                  </div>

                  {/* Translated Text */}
                  <div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-400">
                      <p className="text-gray-800 dark:text-gray-200">{item.translated}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-[#bc4d30] text-white rounded-lg hover:bg-[#a03d26] transition-colors"
        >
          Ny Session
        </button>
        <button
          onClick={() => navigate('/sessions')}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Alle Sessioner
        </button>
      </div>
    </div>
  )
}

export default SessionRecap
