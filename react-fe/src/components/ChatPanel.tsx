// src/components/ChatPanel.tsx
import React, { useRef, useEffect, useState } from 'react'
import { Volume2, LogOut, Sun, Moon } from 'lucide-react'
import InputControls from './InputControls'
import logo from '../assets/white_logo.svg'
import { useLanguage } from '../context/LanguageContext'

// Helper function to detect if text contains Arabic characters
const containsArabic = (text: string): boolean => {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/
  return arabicRegex.test(text)
}

export interface ChatMessage {
  text: string
  sender: 'self' | 'other' | 'typing'
  tempId?: string
  originalText?: string // Added for showing original text on mobile
  originalLanguage?: string // Language code for original text
  translatedLanguage?: string // Language code for translated text
  typingPosition?: 'self' | 'other' // Where typing indicator should appear
  isTranslating?: boolean // Whether this message is currently being translated
  isSkeleton?: boolean // For skeleton loading state
}

interface ChatPanelProps {
  header: string
  messages: ChatMessage[]
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onRecord: (file: File) => Promise<string>
  onSpeak: (text: string, languageCode?: string) => void
  sendDisabled?: boolean
  micReady?: boolean
  audioContext?: AudioContext | null
  preloadedStream?: MediaStream | null
  showFinishSession: boolean | null
  showLogo: boolean | null
  onFinishSession: () => void
  customContent?: React.ReactNode // For showing custom content instead of messages
  showInputControls?: boolean // Whether to show input controls at bottom
  placeholderMessage?: string // Custom placeholder message for empty state
  hoveredLanguage?: string | null // For translating welcome message
  customInputControls?: React.ReactNode // Custom input controls component
  isDanishPanel?: boolean // Whether this is the Danish language panel
  languageACode?: string // Language A code for keyboard hints
  languageBCode?: string // Language B code for keyboard hints
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  header,
  messages,
  inputValue,
  onInputChange,
  onSend,
  onRecord,
  onSpeak,
  sendDisabled,
  micReady,
  audioContext,
  preloadedStream,
  showFinishSession,
  showLogo,
  onFinishSession,
  customContent,
  showInputControls = true,
  placeholderMessage = 'Vælg et sprog for at begynde',
  hoveredLanguage,
  customInputControls,
  isDanishPanel = false,
  languageACode,
  languageBCode,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [messageCount, setMessageCount] = useState(0)

  // Helper function to get "Original" in the correct language
  const getOriginalLabel = (translatedLanguage: string | undefined): string => {
    if (translatedLanguage === 'da-DK') {
      return 'Original' // Danish side shows "Original"
    } else {
      // For other languages, show "Original" in that language
      const originalTranslations: Record<string, string> = {
        'de-DE': 'Original',
        'es-ES': 'Original',
        'fr-FR': 'Original',
        'it-IT': 'Originale',
        'pt-PT': 'Original',
        'nl-NL': 'Origineel',
        'sv-SE': 'Original',
        'no-NO': 'Original',
        'fi-FI': 'Alkuperäinen',
        'pl-PL': 'Oryginał',
        'ru-RU': 'Оригинал',
        'ar-SA': 'الأصل',
        'zh-CN': '原文',
        'ja-JP': 'オリジナル',
        'ko-KR': '원본',
        'hi-IN': 'मूल',
        'tr-TR': 'Orijinal',
        'el-GR': 'Πρωτότυπο',
      }
      return originalTranslations[translatedLanguage || ''] || 'Original'
    }
  }

  // Text size management - using localStorage for persistence
  const [textSize, setTextSize] = useState(() => {
    const saved = localStorage.getItem('chat-text-size')
    return saved ? parseInt(saved) : 100 // Default 100% (base size)
  })

  // Listen for external text size changes
  useEffect(() => {
    const handleTextSizeChange = (event: any) => {
      setTextSize(event.detail)
    }

    window.addEventListener('text-size-change', handleTextSizeChange)
    return () => window.removeEventListener('text-size-change', handleTextSizeChange)
  }, [])

  // Check if user is near bottom of scroll area
  const isNearBottom = () => {
    const container = messagesContainerRef.current
    if (!container) return true

    const { scrollTop, scrollHeight, clientHeight } = container
    return scrollHeight - scrollTop - clientHeight < 100 // Within 100px of bottom
  }

  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    if (isNearBottom()) {
      setIsUserScrolling(false)
    } else {
      setIsUserScrolling(true)
    }
  }


  // Function to get translated welcome messages based on hovered language
  const getTranslatedWelcome = (languageName: string | null) => {
    if (!languageName) {
      return {
        title: 'Welcome to KK Translator',
        subtitle: 'Choose a language to begin translating',
      }
    }

    // Simple translations for common languages
    const translations: Record<string, { title: string; subtitle: string }> = {
      Spanish: {
        title: 'Bienvenido a KK Translator',
        subtitle: 'Elige un idioma para comenzar a traducir',
      },
      French: {
        title: 'Bienvenue à KK Translator',
        subtitle: 'Choisissez une langue pour commencer à traduire',
      },
      German: {
        title: 'Willkommen bei KK Translator',
        subtitle: 'Wählen Sie eine Sprache, um mit der Übersetzung zu beginnen',
      },
      Italian: {
        title: 'Benvenuto a KK Translator',
        subtitle: 'Scegli una lingua per iniziare a tradurre',
      },
      Portuguese: {
        title: 'Bem-vindo ao KK Translator',
        subtitle: 'Escolha um idioma para começar a traduzir',
      },
      Dutch: {
        title: 'Welkom bij KK Translator',
        subtitle: 'Kies een taal om te beginnen met vertalen',
      },
      Norwegian: {
        title: 'Velkommen til KK Translator',
        subtitle: 'Velg et språk for å begynne å oversette',
      },
      Swedish: {
        title: 'Välkommen till KK Translator',
        subtitle: 'Välj ett språk för att börja översätta',
      },
      Finnish: {
        title: 'Tervetuloa KK Translatoriin',
        subtitle: 'Valitse kieli aloittaaksesi kääntämisen',
      },
      Polish: {
        title: 'Witamy w KK Translator',
        subtitle: 'Wybierz język, aby rozpocząć tłumaczenie',
      },
      Russian: {
        title: 'Добро пожаловать в KK Translator',
        subtitle: 'Выберите язык, чтобы начать перевод',
      },
      Arabic: {
        title: 'مرحباً بك في KK Translator',
        subtitle: 'اختر لغة لبدء الترجمة',
      },
      Chinese: {
        title: '欢迎使用 KK Translator',
        subtitle: '选择一种语言开始翻译',
      },
      Japanese: {
        title: 'KK Translator へようこそ',
        subtitle: '翻訳を開始する言語を選択してください',
      },
      Korean: {
        title: 'KK Translator에 오신 것을 환영합니다',
        subtitle: '번역을 시작할 언어를 선택하세요',
      },
      Hindi: {
        title: 'KK Translator में आपका स्वागत है',
        subtitle: 'अनुवाद शुरू करने के लिए एक भाषा चुनें',
      },
      Turkish: {
        title: "KK Translator'a Hoş Geldiniz",
        subtitle: 'Çeviri yapmaya başlamak için bir dil seçin',
      },
      Greek: {
        title: 'Καλώς ήρθατε στο KK Translator',
        subtitle: 'Επιλέξτε μια γλώσσα για να ξεκινήσετε τη μετάφραση',
      },
    }

    return (
      translations[languageName] || {
        title: 'Welcome to KK Translator',
        subtitle: 'Choose a language to begin translating',
      }
    )
  }

  // Smart auto-scroll: only scroll when new messages arrive and user is near bottom
  useEffect(() => {
    // Track if a new message was added
    const currentMessageCount = messages.length
    const hasNewMessage = currentMessageCount > messageCount

    // Don't auto-scroll if we're showing custom content (language selector)
    // Also don't auto-scroll if there are no real messages (just placeholders)
    const hasRealMessages = messages.length > 0 &&
      !messages.every(msg => msg.tempId && (msg.tempId.includes('placeholder') || msg.tempId.includes('welcome')))

    // Only auto-scroll if:
    // 1. We have real messages
    // 2. A new message was added
    // 3. User is not scrolling up (near bottom or not actively scrolling)
    // 4. Not showing custom content
    if (!customContent && hasRealMessages && hasNewMessage && !isUserScrolling) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Update message count
    setMessageCount(currentMessageCount)
  }, [messages, customContent, messageCount, isUserScrolling])

  return (
    <div
      className="flex flex-col bg-white dark:bg-gray-900 rounded shadow h-full"
      style={{
        '--chat-scale': textSize / 100
      } as React.CSSProperties}
    >
      {/* Header - SHOULD NOT SHOW - only show if there's actual content */}
      {(header || showLogo || showFinishSession) && (
        <div
          className="sticky top-0 z-20 px-4 py-6 font-semibold border-b border-gray-300 dark:border-gray-600 text-lg flex items-center justify-between bg-[#bc4d30] dark:bg-gray-800"
          style={{ height: 80 }}
        >
          <div className="w-[110px] sm:w-[140px] md:w-[90px] lg:w-[160px] text-left">
            {showLogo && (
              <img src={logo} alt="Kalundborg Kommune logo" width={160} />
            )}
          </div>
          <div>
            <span className="text-white">
              {header} {header == 'Dansk' ? '🇩🇰 ' : ''}
            </span>
          </div>
          <div className="w-[110px] sm:w-[140px] md:w-[90px] lg:w-[160px] text-right">
            {showFinishSession && (
              <div className="w-[110px] sm:w-[140px] md:w-[90px] lg:w-[160px] text-right">
                {showFinishSession && (
                  <div className="flex justify-end gap-2 pt-4">
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
                      <Moon className="h-6 w-6 block dark:hidden text-white" />
                      <Sun className="h-6 w-6 hidden dark:block text-white" />
                    </button>

                    {/* Finish session button */}
                    <button
                      onClick={onFinishSession}
                      className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      aria-label="Finish session"
                    >
                      <LogOut className="h-5 w-5 text-white" />
                    </button>
                  </div>
                )}
              </div>
            )}{' '}
          </div>
        </div>
      )}

      {/* Messages or Custom Content */}
      {customContent ? (
        <div className="flex-1 p-4 space-y-2 max-w-6xl mx-auto w-full">
          {customContent}
        </div>
      ) : (
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 p-4 space-y-2 max-w-6xl mx-auto w-full overflow-y-auto"
        >
          {messages.length === 0 ||
          (messages.length === 1 &&
            (messages[0].tempId === 'danish-placeholder' ||
              messages[0].tempId === 'welcome-placeholder')) ? (
            placeholderMessage.includes('Welcome') ? (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <div>
                    <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
                      {getTranslatedWelcome(hoveredLanguage ?? null).title}
                    </h2>
                    <p className="mb-2 text-gray-500 dark:text-gray-400">
                      {getTranslatedWelcome(hoveredLanguage ?? null).subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ) : null
          ) : (
            messages.map((msg, idx) => {
              /* skip typing messages - we now handle this inline */
              if (msg.sender === 'typing') {
                return null
              }

              /* regular message */
              return (
                <div
                  key={msg.tempId ?? idx}
                  className={`flex ${
                    msg.sender === 'self' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="flex items-end space-x-1">
                    <div
                      className={`px-3 py-2 rounded-lg max-w-md shadow ${
                        msg.tempId?.includes('-error') || msg.text.includes('/ ingen oversættelse')
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                          : msg.sender === 'self'
                          ? 'bg-[#bc4d30] text-white'
                          : 'bg-gray-200 text-black '
                      }`}
                      style={{
                        fontSize: 'calc(1rem * var(--chat-scale))',
                        lineHeight: '1.5'
                      }}
                    >
                      <div
                        style={{
                          direction: containsArabic(msg.text) ? 'rtl' : 'ltr',
                          textAlign: containsArabic(msg.text) ? 'right' : 'left'
                        }}
                      >
                        {msg.isSkeleton ? (
                          <div className="min-w-[120px]">
                            {/* Skeleton for translation text - single bar matching text height */}
                            <div className="animate-pulse">
                              <div
                                className={`rounded ${
                                  msg.sender === 'self'
                                    ? 'bg-white/30'
                                    : 'bg-gray-400/30'
                                } w-3/4`}
                                style={{
                                  height: 'calc(1.5rem * var(--chat-scale))'
                                }}
                              />
                            </div>
                          </div>
                        ) : msg.isTranslating ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <span className={`w-2 h-2 rounded-full animate-pulse ${
                                msg.sender === 'self'
                                  ? 'bg-white/70'
                                  : 'bg-gray-500 dark:bg-gray-400'
                              }`} />
                              <span className={`w-2 h-2 rounded-full animate-pulse delay-100 ${
                                msg.sender === 'self'
                                  ? 'bg-white/70'
                                  : 'bg-gray-500 dark:bg-gray-400'
                              }`} />
                              <span className={`w-2 h-2 rounded-full animate-pulse delay-200 ${
                                msg.sender === 'self'
                                  ? 'bg-white/70'
                                  : 'bg-gray-500 dark:bg-gray-400'
                              }`} />
                            </div>
                            <span className={`text-sm ${
                              msg.sender === 'self'
                                ? 'text-white/80'
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {t('translating') || 'Translating...'}
                            </span>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                      {/* Show original text if available */}
                      {msg.originalText && (
                          <div
                            className={`mt-2 pt-2 border-t text-xs opacity-70 ${
                              msg.sender === 'self'
                                ? 'border-white/30'
                                : 'border-gray-400/30'
                            }`}
                            style={{
                              fontSize: 'calc(0.85rem * var(--chat-scale))',
                              lineHeight: '1.4'
                            }}
                          >
                            <span
                              className="italic"
                              style={{
                                direction: containsArabic(msg.originalText || '') ? 'rtl' : 'ltr',
                                textAlign: containsArabic(msg.originalText || '') ? 'right' : 'left'
                              }}
                            >
                              {getOriginalLabel(msg.translatedLanguage)}:{' '}
                              {msg.originalText}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Speak buttons */}
                    <div className="flex flex-col gap-1">
                      {/* Speak translated text button */}
                      {msg.text && (
                        <button
                          onClick={() => onSpeak(msg.text, msg.translatedLanguage)}
                          className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                          aria-label={t('readAloud')}
                          title={`${t('readAloud')} (${msg.translatedLanguage === 'da-DK' ? 'Danish' : 'Foreign language'})`}
                        >
                          <Volume2 className="h-4 w-4 text-black dark:text-white" />
                        </button>
                      )}

                      {/* Speak original text button */}
                      {msg.originalText && (
                        <button
                          onClick={() => onSpeak(msg.originalText!, msg.originalLanguage)}
                          className="p-1 rounded-full hover:bg-gray-200 focus:outline-none opacity-70"
                          aria-label={`${t('readAloud')} ${t('originalText')}`}
                          title={`${t('readAloud')} ${t('originalText')} (${msg.originalLanguage === 'da-DK' ? 'Danish' : 'Foreign language'})`}
                        >
                          <Volume2 className="h-3 w-3 text-black dark:text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      )}


      {/* Input / mic controls - Fixed at bottom */}
      {showInputControls && !customInputControls && (
        <div className="sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
          <InputControls
            micReady={micReady}
            inputValue={inputValue}
            onInputChange={onInputChange}
            onSend={onSend}
            onRecord={onRecord}
            disabled={sendDisabled}
            audioContext={audioContext}
            preloadedStream={preloadedStream}
            isDanishPanel={isDanishPanel}
            languageACode={languageACode}
            languageBCode={languageBCode}
          />
        </div>
      )}

      {/* Custom input controls when provided */}
      {customInputControls}
    </div>
  )
}

export default ChatPanel
