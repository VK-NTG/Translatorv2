import React, { useEffect, useState } from 'react'
import { ArrowLeftRight, Sun, Moon } from 'lucide-react'

// Helper function to get flag emoji for language codes
const getLanguageFlag = (languageCode: string): string => {
  const flagMap: Record<string, string> = {
    'da-DK': '🇩🇰',
    'en-US': '🇺🇸',
    'en-GB': '🇬🇧',
    'de-DE': '🇩🇪',
    'fr-FR': '🇫🇷',
    'es-ES': '🇪🇸',
    'it-IT': '🇮🇹',
    'pt-PT': '🇵🇹',
    'nl-NL': '🇳🇱',
    'sv-SE': '🇸🇪',
    'no-NO': '🇳🇴',
    'fi-FI': '🇫🇮',
    'pl-PL': '🇵🇱',
    'ru-RU': '🇷🇺',
    'ar-SA': '🇸🇦',
    'zh-CN': '🇨🇳',
    'ja-JP': '🇯🇵',
    'ko-KR': '🇰🇷',
    'hi-IN': '🇮🇳',
    'tr-TR': '🇹🇷',
    'el-GR': '🇬🇷',
    'he-IL': '🇮🇱',
    'uk-UA': '🇺🇦',
    'ca-ES': '🇪🇸', // Catalan uses Spain flag
    'fa-IR': '🇮🇷',
    'ur-PK': '🇵🇰',
    'ta-IN': '🇮🇳',
    'bn-BD': '🇧🇩',
    'th-TH': '🇹🇭',
    'vi-VN': '🇻🇳',
    'id-ID': '🇮🇩',
    'ms-MY': '🇲🇾',
    'tl-PH': '🇵🇭',
  }
  return flagMap[languageCode] || '🌐'
}

// Helper function to get "Enter text" placeholder in different languages
const getEnterTextPlaceholder = (languageCode: string): string => {
  const placeholders: Record<string, string> = {
    'da-DK': 'Angiv tekst...',
    'en-US': 'Enter text...',
    'en-GB': 'Enter text...',
    'de-DE': 'Text eingeben...',
    'fr-FR': 'Saisir du texte...',
    'es-ES': 'Escribir texto...',
    'it-IT': 'Inserisci testo...',
    'pt-PT': 'Introduzir texto...',
    'nl-NL': 'Voer tekst in...',
    'sv-SE': 'Ange text...',
    'no-NO': 'Skriv inn tekst...',
    'fi-FI': 'Kirjoita tekstiä...',
    'pl-PL': 'Wpisz tekst...',
    'ru-RU': 'Введите текст...',
    'ar-SA': 'أدخل النص...',
    'ar-EG': 'أدخل النص...',
    'zh-CN': '输入文字...',
    'ja-JP': 'テキストを入力...',
    'ko-KR': '텍스트 입력...',
    'hi-IN': 'पाठ दर्ज करें...',
    'tr-TR': 'Metin girin...',
    'el-GR': 'Εισαγωγή κειμένου...',
    'he-IL': 'הזן טקסט...',
    'uk-UA': 'Введіть текст...',
    'ca-ES': 'Introduïu text...',
    'fa-IR': 'متن را وارد کنید...',
    'ur-PK': 'متن درج کریں...',
    'ta-IN': 'உரையை உள்ளிடவும்...',
    'bn-BD': 'টেক্সট লিখুন...',
    'th-TH': 'ป้อนข้อความ...',
    'vi-VN': 'Nhập văn bản...',
    'id-ID': 'Masukkan teks...',
    'ms-MY': 'Masukkan teks...',
    'tl-PH': 'Ilagay ang teksto...',
  }
  // Try exact match first, then try base language code
  if (placeholders[languageCode]) {
    return placeholders[languageCode]
  }
  // Try base language (e.g., 'ar' from 'ar-XX')
  const baseCode = languageCode?.split('-')[0]
  const baseMatch = Object.entries(placeholders).find(([key]) => key.startsWith(baseCode + '-'))
  if (baseMatch) {
    return baseMatch[1]
  }
  return 'Enter text...'
}

import ChatPanel, { ChatMessage } from './ChatPanel'
import LanguageModal from './LanguageModal'
import InputControls from './InputControls'
import { SessionData } from '../App'
import { API_URL, API_KEY } from '../config'
import { useFetchWithAuth } from '../lib/fetchWithAuth'
import { useTTS } from '../hooks/useTTS'
import logo from '../assets/white_logo.svg'

interface Translation {
  created_at: string
  from: string
  to: string
  original: string
  translated: string
  tempId?: string
}

interface SessionViewProps {
  sessionData: SessionData | null
  micReady?: boolean
  audioContext?: AudioContext | null
  preloadedStream?: MediaStream | null
  onFinishSession: () => void
  onSessionCreated: (session: SessionData) => void
}

const SessionView: React.FC<SessionViewProps> = ({
  sessionData,
  micReady,
  audioContext,
  preloadedStream,
  onFinishSession,
  onSessionCreated,
}) => {
  const [inputA, setInputA] = useState('')
  const [inputB, setInputB] = useState('')
  const [translations, setTranslations] = useState<Translation[]>([])
  const [processingA, setProcessingA] = useState(false)
  const [processingB, setProcessingB] = useState(false)
  const { fetchWithAuth } = useFetchWithAuth()
  const speak = useTTS()

  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [inputLanguage, setInputLanguage] = useState<'A' | 'B'>('A')

  // Text size state for zoom controls
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem('chat-text-size')
    return saved ? parseInt(saved) : 100
  })

  // Confirmation dialog state
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showNewConfirm, setShowNewConfirm] = useState(false)

  // Show language modal when no session exists
  useEffect(() => {
    if (!sessionData) {
      setShowLanguageModal(true)
    }
  }, [sessionData])

  const handleSessionCreated = (session: SessionData) => {
    setShowLanguageModal(false)
    onSessionCreated(session)
  }

  useEffect(() => {
    if (!sessionData) return

    const fetchSession = async () => {
      const res = await fetchWithAuth(
        `${API_URL}/sessions/${sessionData?.session_id}`,
        {
          headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        },
      )
      const data = await res.json()

      if (data.translations) {
        setTranslations((prev) => {
          const serverTranslations = data.translations

          // Create a map for faster lookup
          const serverMap = new Map()
          serverTranslations.forEach((t: any) => {
            const key = `${t.from}-${t.to}-${t.original}`
            serverMap.set(key, t)
          })

          // Update existing messages: replace temp with server data if available, keep temp if not
          const updated = prev.map((msg) => {
            // Remove typing indicators when real messages arrive
            if (msg.tempId?.includes('-typing')) {
              return null
            }

            // Check if this message has server data available
            const key = `${msg.from}-${msg.to}-${msg.original}`
            const serverData = serverMap.get(key)

            if (serverData) {
              // Replace temp with server data
              return serverData
            } else {
              // Keep temp message as is
              return msg
            }
          }).filter(Boolean)

          // Add any new server messages that don't have temp counterparts
          const existingKeys = new Set(updated.map(msg => `${msg.from}-${msg.to}-${msg.original}`))
          const newServerMessages = serverTranslations.filter((t: any) => {
            const key = `${t.from}-${t.to}-${t.original}`
            return !existingKeys.has(key)
          })

          const combined = [...updated, ...newServerMessages]
          return combined.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          )
        })
      }

      setProcessingA(false)
      setProcessingB(false)
    }

    fetchSession()
    const interval = setInterval(fetchSession, 1000)
    return () => clearInterval(interval)
  }, [sessionData])

  // Note: leftMessages and rightMessages removed as they're no longer used
  // The component now uses unifiedMobileMessages for both desktop and mobile views

  // Create unified mobile messages that combine both languages in chronological order
  const unifiedMobileMessages = translations
    .filter((t) => {
      // Filter out empty messages unless they're typing indicators
      if (t.tempId?.includes('-typing')) {
        return true // Show typing indicators
      }
      // Show messages that have original content (translated can be empty for skeleton)
      return t.original.trim() !== ''
    })
    .map((t): ChatMessage | null => {

      // Handle typing indicators - position them where the translation will appear
      if (t.tempId?.includes('-typing')) {
        // Determine where the translation will appear based on direction
        const fromDanish = t.from === sessionData?.language_b.code // Danish is language B
        const typingPosition = fromDanish ? 'other' : 'self' // Danish->Foreign appears on left, Foreign->Danish on right
        return {
          text: '',
          sender: 'typing' as const,
          tempId: t.tempId,
          typingPosition,
        }
      }

      // Handle error messages
      if (t.tempId?.includes('-error')) {
        return { text: t.original, sender: 'other' as const, tempId: t.tempId }
      }

      // Determine the sender (who originally sent the message)
      // For unified view: Danish messages always on right (self), foreign language messages on left (other)
      const fromDanish = t.from === sessionData?.language_b.code // Danish is language B
      const sender = fromDanish ? ('self' as const) : ('other' as const)


      // Show the original message first, then translation
      const originalText = t.original.trim()
      const translatedText = t.translated.trim()

      // If no translation yet, show skeleton
      if (originalText && !translatedText) {
        return {
          text: '',
          sender: sender,
          originalText: originalText,
          tempId: t.tempId,
          isSkeleton: true,
          translatedLanguage: t.to,
          originalLanguage: t.from,
        }
      }

      // Skip messages with no content
      if (!originalText && !translatedText) {
        return null
      }

      // Show translation as main text, original as secondary
      const displayText = translatedText
      const secondaryText = originalText // Always show original text when available

      return {
        text: displayText,
        sender: sender,
        originalText: secondaryText,
        tempId: t.tempId,
        translatedLanguage: t.to, // The language of the main displayed text
        originalLanguage: t.from, // The language of the original text
      }
    })
    .filter(Boolean) // Remove null entries

  const sendMessage = async (
    fromLang: string,
    toLang: string,
    text?: string,
    audioFile?: File,
  ) => {
    const formData = new FormData()
    formData.append('session_id', sessionData?.session_id || '')
    formData.append('from', fromLang)
    formData.append('to', toLang)
    if (text) formData.append('text', text)
    if (audioFile) formData.append('audio', audioFile)

    await fetchWithAuth(`${API_URL}/sessions/translate`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: formData,
    })
  }

  const transcribeOnly = async (lang: string, file: File): Promise<string> => {
    if (!sessionData) return ''
    const formData = new FormData()
    formData.append('from', lang)
    formData.append('audio', file)

    const res = await fetchWithAuth(`${API_URL}/sessions/transcribe`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      body: formData,
    })
    if (!res.ok) {
      const errText = await res.text()
      alert(`[SessionView] Transcription error: ${errText}`)
      return ''
    }
    const data = await res.json()
    return data.original || ''
  }

  const handleSendA = async () => {
    console.log('🔵 handleSendA called - sending from Language A to Danish')
    const tempId = `temp-${Date.now()}`
    const messageText = inputA.trim()
    if (!messageText) return

    setProcessingA(true)
    setInputA('') // Clear immediately

    setTranslations((prev) => [
      ...prev,
      {
        created_at: new Date().toISOString(),
        from: sessionData?.language_a.code ?? '',
        to: sessionData?.language_b.code ?? '',
        original: messageText,
        translated: '', // Empty initially - will show skeleton then real translation
        tempId,
      },
    ])

    try {
      await sendMessage(
        sessionData?.language_a.code ?? '',
        sessionData?.language_b.code ?? '',
        messageText,
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      setProcessingA(false)

      // Replace typing indicator with original text as fallback (both original and translated)
      setTranslations((prev) =>
        prev.map((t) =>
          t.tempId === `${tempId}-typing`
            ? {
                ...t,
                original: messageText,
                translated: messageText,
                tempId: tempId,
              }
            : t,
        ),
      )
    }
  }

  const handleSendB = async () => {
    console.log('🔴 handleSendB called - sending from Danish to Language A')
    const tempId = `temp-${Date.now()}`
    const messageText = inputB.trim()
    if (!messageText) return

    setProcessingB(true)
    setInputB('') // Clear immediately

    setTranslations((prev) => [
      ...prev,
      {
        created_at: new Date().toISOString(),
        from: sessionData?.language_b.code ?? '',
        to: sessionData?.language_a.code ?? '',
        original: messageText,
        translated: '', // Empty initially - will show skeleton then real translation
        tempId,
      },
    ])

    try {
      await sendMessage(
        sessionData?.language_b.code ?? '',
        sessionData?.language_a.code ?? '',
        messageText,
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      setProcessingB(false)

      // Replace typing indicator with original text as fallback (both original and translated)
      setTranslations((prev) =>
        prev.map((t) =>
          t.tempId === `${tempId}-typing`
            ? {
                ...t,
                original: messageText,
                translated: messageText,
                tempId: tempId,
              }
            : t,
        ),
      )
    }
  }

  const onRecordForLanguageA = async (file: File): Promise<string> => {
    return await transcribeOnly(sessionData?.language_a.code ?? '', file)
  }

  const onRecordForLanguageB = async (file: File): Promise<string> => {
    return await transcribeOnly(sessionData?.language_b.code ?? '', file)
  }

  return (
    <>
      {/* Desktop: Unified chat with dual input panels */}
      <div className="hidden md:block w-full min-h-screen">
        {sessionData ? (
          <div className="flex flex-col h-screen">
            {/* Header - Full Width */}
            <div
              className="sticky top-0 z-20 px-4 py-6 font-semibold border-b border-gray-300 dark:border-gray-600 text-lg flex items-center justify-between bg-[#bc4d30] dark:bg-gray-800"
              style={{ height: 80 }}
            >
              <div className="w-[110px] sm:w-[140px] md:w-[90px] lg:w-[160px] text-left">
                <img src={logo} alt="Kalundborg Kommune logo" width={160} />
              </div>
              <div>
                <span className="text-white">
                  {getLanguageFlag(sessionData?.language_a.code ?? '')}{' '}
                  {sessionData?.language_a.english_name} - 🇩🇰 Dansk
                </span>
              </div>
              <div className="w-[110px] sm:w-[140px] md:w-[90px] lg:w-[160px] flex justify-end gap-2">
                {/* Theme toggle button */}
                <button
                  onClick={() => {
                    const html = document.documentElement
                    const isDark = html.classList.toggle('dark')
                    localStorage.theme = isDark ? 'dark' : 'light'
                  }}
                  className="p-1 rounded-full transition-colors"
                  aria-label="Toggle theme"
                >
                  <Moon className="h-4 w-4 block dark:hidden text-white" />
                  <Sun className="h-4 w-4 hidden dark:block text-white" />
                </button>

              </div>
            </div>

            {/* Chat Messages - Constrained Width with proper spacing */}
            <div className="flex-1 overflow-hidden">
              <div className="max-w-6xl mx-auto h-full">
                <div className="h-full overflow-hidden">
                  <ChatPanel
                    header=""
                    messages={unifiedMobileMessages.filter(
                      (msg): msg is ChatMessage => msg !== null,
                    )}
                    inputValue=""
                    onInputChange={() => {}}
                    onSend={() => {}}
                    onRecord={async () => ''}
                    sendDisabled={true}
                    micReady={micReady}
                    audioContext={audioContext}
                    preloadedStream={preloadedStream}
                    onFinishSession={onFinishSession}
                    showFinishSession={false}
                    showLogo={false}
                    showInputControls={false}
                    languageACode={sessionData?.language_a.code}
                    languageBCode="da-DK"
                    onSpeak={(txt, languageCode) =>
                      speak(
                        txt,
                        languageCode ?? sessionData?.language_a.code ?? '',
                      )
                    }
                    placeholderMessage=""
                  />
                </div>
              </div>
            </div>
            {/* Dual Input Panels - clean design */}
            <div className="flex border-t border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              {/* Left Panel - Language A Input */}
              <div className="flex-1 border-r border-gray-300 dark:border-gray-600">
                <InputControls
                  micReady={micReady}
                  inputValue={inputA}
                  onInputChange={setInputA}
                  onSend={handleSendA}
                  onRecord={async (file) => {
                    const recognized = await onRecordForLanguageA(file)
                    setInputA(recognized)
                    return recognized
                  }}
                  disabled={processingA}
                  audioContext={audioContext}
                  preloadedStream={preloadedStream}
                  isDanishPanel={false}
                  languageAName={sessionData?.language_a.english_name}
                  languageBName="Dansk"
                  currentInputLanguage="A"
                  languageACode={sessionData?.language_a.code}
                  languageBCode={sessionData?.language_b.code}
                  textSize={textSize}
                />
              </div>
              {/* Right Panel - Danish Input */}
              <div className="flex-1">
                <InputControls
                  micReady={micReady}
                  inputValue={inputB}
                  onInputChange={setInputB}
                  onSend={handleSendB}
                  onRecord={async (file) => {
                    const recognized = await onRecordForLanguageB(file)
                    setInputB(recognized)
                    return recognized
                  }}
                  disabled={processingB}
                  audioContext={audioContext}
                  preloadedStream={preloadedStream}
                  isDanishPanel={true}
                  languageAName={sessionData?.language_a.english_name}
                  languageBName="Dansk"
                  currentInputLanguage="B"
                  languageACode={sessionData?.language_a.code}
                  languageBCode={sessionData?.language_b.code}
                  textSize={textSize}
                />
              </div>
            </div>

            {/* Floating Footer with Controls */}
            <div className="fixed bottom-[230px] right-4 flex items-center gap-2 z-50">
              {/* Text size controls - floating individually */}
              <button
                onClick={() => {
                  let newSize = textSize - 10
                  if (newSize >= 95 && newSize <= 105) newSize = 100
                  newSize = Math.max(75, newSize)
                  setTextSize(newSize)
                  localStorage.setItem('chat-text-size', newSize.toString())
                  window.dispatchEvent(
                    new CustomEvent('text-size-change', { detail: newSize }),
                  )
                }}
                className="p-1 hover:opacity-70 transition-opacity"
                aria-label="Decrease text size"
              >
                <svg
                  className="h-5 w-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[35px] text-center font-medium">
                {textSize}%
              </span>

              <button
                onClick={() => {
                  let newSize = textSize + 10
                  if (newSize >= 95 && newSize <= 105) newSize = 100
                  newSize = Math.min(150, newSize)
                  setTextSize(newSize)
                  localStorage.setItem('chat-text-size', newSize.toString())
                  window.dispatchEvent(
                    new CustomEvent('text-size-change', { detail: newSize }),
                  )
                }}
                className="p-1 hover:opacity-70 transition-opacity"
                aria-label="Increase text size"
              >
                <svg
                  className="h-5 w-5 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>

              {/* End Session button */}
              <button
                onClick={onFinishSession}
                className="px-4 py-2 bg-[#bc4d30] hover:bg-[#a03d26] text-white text-sm font-medium rounded-full shadow-lg transition-colors"
              >
                Afslut
              </button>
            </div>
          </div>
        ) : (
          <ChatPanel
            header="Select Language"
            messages={[]}
            inputValue=""
            onInputChange={() => {}}
            onSend={() => {}}
            onRecord={async () => ''}
            sendDisabled={true}
            micReady={micReady}
            audioContext={audioContext}
            preloadedStream={preloadedStream}
            onFinishSession={onFinishSession}
            showFinishSession={false}
            showLogo={true}
            showInputControls={false}
            languageACode="en-US"
            languageBCode="da-DK"
            onSpeak={() => {}}
            placeholderMessage=""
          />
        )}
      </div>

      {/* Mobile: Google Translate-inspired layout */}
      <div className="block md:hidden w-full h-screen flex flex-col bg-white dark:bg-gray-900">
        {sessionData ? (
          <>
            {/* Top Header Bar with Logo and Theme Toggle */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#bc4d30] dark:bg-gray-800 shrink-0">
              <img src={logo} alt="Kalundborg Kommune" className="h-8" />
              <button
                onClick={() => {
                  const html = document.documentElement
                  const isDark = html.classList.toggle('dark')
                  localStorage.theme = isDark ? 'dark' : 'light'
                }}
                className="p-2 rounded-full"
                aria-label="Toggle theme"
              >
                <Moon className="h-5 w-5 block dark:hidden text-white" />
                <Sun className="h-5 w-5 hidden dark:block text-white" />
              </button>
            </div>

            {/* Large Text Input at TOP - Google Translate Style */}
            <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <textarea
                value={inputLanguage === 'A' ? inputA : inputB}
                onChange={(e) => inputLanguage === 'A' ? setInputA(e.target.value) : setInputB(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (inputLanguage === 'A') handleSendA()
                    else handleSendB()
                  }
                }}
                placeholder={inputLanguage === 'A'
                  ? getEnterTextPlaceholder(sessionData?.language_a.code || 'en-US')
                  : 'Angiv tekst...'
                }
                className="w-full h-24 p-4 text-lg bg-transparent border-none resize-none focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 dark:text-white"
              />
            </div>

            {/* Chat Messages Area - MIDDLE (scrollable) */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <ChatPanel
                header=""
                messages={unifiedMobileMessages.filter(
                  (msg): msg is ChatMessage => msg !== null,
                )}
                inputValue=""
                onInputChange={() => {}}
                onSend={() => {}}
                onRecord={async (file) => {
                  if (inputLanguage === 'A') {
                    const recognized = await onRecordForLanguageA(file)
                    setInputA(recognized)
                    return recognized
                  } else {
                    const recognized = await onRecordForLanguageB(file)
                    setInputB(recognized)
                    return recognized
                  }
                }}
                sendDisabled={processingA || processingB}
                micReady={micReady}
                audioContext={audioContext}
                preloadedStream={preloadedStream}
                onFinishSession={onFinishSession}
                showFinishSession={false}
                showLogo={false}
                languageACode={sessionData?.language_a.code}
                languageBCode="da-DK"
                onSpeak={(txt, languageCode) =>
                  speak(
                    txt,
                    languageCode ??
                      (inputLanguage === 'A'
                        ? sessionData?.language_a.code ?? ''
                        : sessionData?.language_b.code ?? ''),
                  )
                }
                placeholderMessage=""
                showInputControls={false}
              />
            </div>

            {/* Language Selector at BOTTOM - Google Translate Style */}
            <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 shrink-0">
              <button
                onClick={() => setInputLanguage('A')}
                className={`flex-1 max-w-[140px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  inputLanguage === 'A'
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {sessionData?.language_a.english_name?.split(' (')[0] || sessionData?.language_a.english_name}
              </button>

              <button
                onClick={() => setInputLanguage(inputLanguage === 'A' ? 'B' : 'A')}
                className="p-2 text-gray-500 dark:text-gray-400"
                aria-label="Swap languages"
              >
                <ArrowLeftRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => setInputLanguage('B')}
                className={`flex-1 max-w-[140px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  inputLanguage === 'B'
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Dansk
              </button>
            </div>

            {/* Action Buttons at BOTTOM - [End] (MIC/SEND) [New] */}
            <div className="bg-white dark:bg-gray-900 pb-safe shrink-0">
              <InputControls
                micReady={micReady}
                inputValue={inputLanguage === 'A' ? inputA : inputB}
                onInputChange={() => {}}
                onSend={() => inputLanguage === 'A' ? handleSendA() : handleSendB()}
                onRecord={async (file) => {
                  if (inputLanguage === 'A') {
                    const recognized = await onRecordForLanguageA(file)
                    setInputA(recognized)
                    return recognized
                  } else {
                    const recognized = await onRecordForLanguageB(file)
                    setInputB(recognized)
                    return recognized
                  }
                }}
                disabled={processingA || processingB}
                audioContext={audioContext}
                preloadedStream={preloadedStream}
                languageAName={sessionData?.language_a.english_name}
                languageBName="Dansk"
                currentInputLanguage={inputLanguage}
                languageACode={sessionData?.language_a.code}
                languageBCode={sessionData?.language_b.code}
                textSize={textSize}
                isMobile={true}
                onEndConversation={() => setShowEndConfirm(true)}
                onNewConversation={() => setShowNewConfirm(true)}
                hideTextInput={true}
              />
            </div>
          </>
        ) : (
          <ChatPanel
            header="Select Language"
            messages={[]}
            inputValue=""
            onInputChange={() => {}}
            onSend={() => {}}
            onRecord={async () => ''}
            sendDisabled={true}
            micReady={micReady}
            audioContext={audioContext}
            preloadedStream={preloadedStream}
            onFinishSession={onFinishSession}
            showFinishSession={false}
            showLogo={true}
            languageACode="en-US"
            languageBCode="da-DK"
            onSpeak={() => {}}
            placeholderMessage=""
          />
        )}
      </div>

      {/* Language selection modal overlay */}
      {showLanguageModal && (
        <LanguageModal onSessionCreated={handleSessionCreated} />
      )}

      {/* End conversation confirmation dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Afslut samtale?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Er du sikker på, at du vil afslutte denne samtale?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  setShowEndConfirm(false)
                  onFinishSession()
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#bc4d30] text-white font-medium hover:bg-[#a03d26] transition-colors"
              >
                Afslut
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New conversation confirmation dialog */}
      {showNewConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Start ny samtale?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Den nuværende samtale vil blive afsluttet. Vil du fortsætte?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  setShowNewConfirm(false)
                  // Clear current conversation and show language selector
                  setTranslations([])
                  setInputA('')
                  setInputB('')
                  setShowLanguageModal(true)
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#bc4d30] text-white font-medium hover:bg-[#a03d26] transition-colors"
              >
                Start ny
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SessionView
