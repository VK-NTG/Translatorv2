import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import SessionView from './components/SessionView'
import { Language } from './components/LanguageModal'
import AllSessions from './components/AllSessions'
import { API_URL, API_KEY } from './config'
import { useMicPreloader } from './hooks/useMicPreloader'
import SessionRecap from './components/SessionRecap'
import { useFetchWithAuth } from './lib/fetchWithAuth'
import Settings from './components/Settings'
import { useDarkMode } from './hooks/useDarkMode'
import { LanguageProvider } from './context/LanguageContext'

export interface SessionData {
  session_id: string
  status: string
  language_a: Language
  language_b: Language
  model_a: any
  model_b: any
}

const AppContent: React.FC = () => {
  useDarkMode()
  const [activeSession, setActiveSession] = useState<SessionData | null>(null)
  const [isFinishing, setIsFinishing] = useState<boolean>(false)
  const navigate = useNavigate()
  const { fetchWithAuth } = useFetchWithAuth()

  console.log('[App] Rendered with activeSession:', activeSession, 'isFinishing:', isFinishing)

  // const [debugMessages, setDebugMessages] = useState<string[]>([])

  /*  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        setDebugMessages((prev) => [...prev, event.data])
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, []) */

  // Pre-initialize mic on mount (so that mic is "warm" when used in the UI)
  const { micReady, audioContextRef, streamRef } = useMicPreloader()

  const onSessionCreated = (session: SessionData) => {
    setActiveSession(session)
  }

  const finishSession = async () => {
    if (!activeSession) return

    setIsFinishing(true)

    try {
      console.log('Finishing session:', activeSession.session_id)

      const finishResponse = await fetchWithAuth(`${API_URL}/sessions/finish-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ session_id: activeSession.session_id }),
      })

      if (!finishResponse.ok) {
        const errorText = await finishResponse.text()
        console.error('Finish session failed:', finishResponse.status, errorText)
        throw new Error(`Failed to finish session: ${finishResponse.status}`)
      }

      console.log('Session finished successfully, fetching recap...')

      const res = await fetchWithAuth(
        `${API_URL}/sessions/recap?session_id=${activeSession.session_id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
        },
      )

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Recap fetch failed:', res.status, errorText)
        throw new Error(`Failed to fetch recap: ${res.status}`)
      }

      await res.json()

      setActiveSession(null)
      navigate('/recap', { state: { sessionId: activeSession.session_id } })
    } catch (error) {
      console.error('Error in finishSession:', error)
      // Keep isFinishing=false in the finally block to hide spinner
    } finally {
      setIsFinishing(false)
    }
  }

  return (
    // Allow natural page height and scrolling with consistent background
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/*<AppBar
        // onShowSessions={() => navigate('/sessions')}
        onFinishSession={finishSession}
        // onShowSettings={() => {
        //
        // }}
      />*/}

      {/*
        removed debug iframe messages, comment this in to see them again
      {debugMessages.length > 0 && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '8px',
            zIndex: 9999,
            fontSize: '12px',
            maxWidth: '300px',
            overflowWrap: 'break-word',
          }}
        >
          <strong>IFRAME Debug Messages</strong>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {debugMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}*/}

      {/* Main content area - allow natural height */}
      <div className="flex-1">
        <SessionView
          sessionData={activeSession}
          micReady={micReady}
          audioContext={audioContextRef.current}
          preloadedStream={streamRef.current}
          onFinishSession={finishSession}
          onSessionCreated={onSessionCreated}
        />
      </div>

      {/* Finish Session Loading Spinner */}
      {isFinishing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
            <svg
              className="h-6 w-6 animate-spin text-[#bc4d30]"
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
            <span className="text-gray-700 dark:text-gray-200">Afslutter session...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Get base path from Vite env (set during Docker build)
const basename = import.meta.env.BASE_URL || '/'

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/sessions" element={<AllSessions />} />
          <Route path="/recap" element={<SessionRecap />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
