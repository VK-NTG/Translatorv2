import React, { useRef, useState } from 'react'
import { ArrowUp, LogOut, Plus } from 'lucide-react'
import MicRecorderWithWaveform from './MicRecorderWithWaveform'
import { useLanguage } from '../context/LanguageContext'

// Helper function to convert language codes to standard language tags for keyboard hints
const getLanguageTag = (languageCode: string): string => {
  // Convert our internal codes to standard language tags
  const codeMap: Record<string, string> = {
    'da-DK': 'da',
    'en-US': 'en',
    'de-DE': 'de',
    'fr-FR': 'fr',
    'es-ES': 'es',
    'ar-SA': 'ar',
    'ar-EG': 'ar',
    'he-IL': 'he',
    'sv-SE': 'sv',
    'zh-CN': 'zh',
    'ca-ES': 'ca',
    'uk-UA': 'uk',
    'pl-PL': 'pl',
    'nl-NL': 'nl',
    'fa-IR': 'fa',
    'ur-PK': 'ur',
    'ta-IN': 'ta',
    'bn-BD': 'bn'
  }
  return codeMap[languageCode] || languageCode.split('-')[0] || 'en'
}

// Helper function to check if a language is RTL
const isRTLLanguage = (languageCode: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur']
  const baseLanguage = languageCode?.split('-')[0] || ''
  return rtlLanguages.includes(baseLanguage)
}

interface InputControlsProps {
  micReady?: boolean
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onRecord: (file: File) => Promise<string>
  disabled?: boolean
  audioContext?: AudioContext | null
  preloadedStream?: MediaStream | null
  // New props for dual mic setup
  isMobile?: boolean
  onRecordLanguageA?: (file: File) => Promise<string>
  onRecordLanguageB?: (file: File) => Promise<string>
  languageAName?: string
  languageBName?: string
  currentInputLanguage?: 'A' | 'B'
  // Desktop-specific props
  isDanishPanel?: boolean
  // Language codes for keyboard hints
  languageACode?: string
  languageBCode?: string
  // Text scaling
  textSize?: number
  // Mobile action buttons (Google Translate style)
  onEndConversation?: () => void
  onNewConversation?: () => void
  // Hide text input (for Google Translate style where input is at top)
  hideTextInput?: boolean
}

const InputControls: React.FC<InputControlsProps> = ({
  micReady = false,
  inputValue,
  onInputChange,
  onSend,
  onRecord,
  disabled,
  audioContext,
  preloadedStream,
  isMobile = false,
  onRecordLanguageA,
  onRecordLanguageB,
  languageAName = 'Language A',
  // languageBName = 'Dansk', // eslint-disable-line @typescript-eslint/no-unused-vars
  currentInputLanguage = 'A',
  isDanishPanel = false,
  languageACode,
  languageBCode,
  textSize = 100,
  onEndConversation,
  onNewConversation,
  hideTextInput = false,
}) => {
  const { t } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingLanguage, setRecordingLanguage] = useState<'A' | 'B' | null>(null)
  const [transcribing, setTranscribing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  /* --------------------------- helpers --------------------------- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl + Enter: Add line break (default textarea behavior)
        return // Let the default behavior happen
      } else {
        // Plain Enter: Send message
        e.preventDefault()
        if (!disabled && !transcribing && inputValue.trim().length > 0) {
          onSend()
        }
      }
    }
  }

  const handleRecorded = async (file: File) => {
    setTranscribing(true)
    try {
      let text = ''
      if (isMobile && recordingLanguage) {
        if (recordingLanguage === 'A' && onRecordLanguageA) {
          text = await onRecordLanguageA(file)
        } else if (recordingLanguage === 'B' && onRecordLanguageB) {
          text = await onRecordLanguageB(file)
        }
      } else {
        text = await onRecord(file)
      }
      onInputChange(text)
    } finally {
      setTranscribing(false)
      setRecordingLanguage(null)
    }
  }

  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording)
    if (!recording) {
      setRecordingLanguage(null)
    }
  }
  /* ---------------------------- view ----------------------------- */
  if (isMobile) {
    // Google Translate style: action buttons row only (text input is at top in parent)
    if (hideTextInput) {
      const hasText = inputValue.trim().length > 0

      return (
        <div className="flex items-center justify-center gap-8 pt-3">
          {/* New button - circular icon (left side) */}
          {onNewConversation ? (
            <button
              onClick={onNewConversation}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-14 w-14 rounded-full bg-gray-700 dark:bg-gray-700 flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Ny</span>
            </button>
          ) : (
            <div className="w-14" /> // Spacer to maintain layout
          )}

          {/* Center button: Animated crossfade between Mic and Send */}
          <div className="relative flex flex-col items-center">
            {/* Mic button - fades out when text is entered */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                hasText
                  ? 'opacity-0 scale-75 pointer-events-none absolute'
                  : 'opacity-100 scale-100'
              }`}
            >
              <MicRecorderWithWaveform
                micReady={micReady}
                onRecorded={handleRecorded}
                onRecordingStateChange={handleRecordingStateChange}
                canvasRef={canvasRef}
                preloadedAudioContext={audioContext}
                preloadedStream={preloadedStream}
                size="large"
              />
            </div>

            {/* Send button - fades in when text is entered */}
            <div
              className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
                hasText
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75 pointer-events-none absolute'
              }`}
            >
              <button
                onClick={onSend}
                disabled={disabled || transcribing}
                className="h-28 w-28 rounded-full bg-[#bc4d30] flex items-center justify-center shadow-lg disabled:opacity-50 transition-transform duration-150 active:scale-95"
              >
                <ArrowUp className="h-12 w-12 text-white" />
              </button>
              {/* Spacer to match MicRecorderWithWaveform timer slot */}
              <span className="mt-2 h-4" />
            </div>
          </div>

          {/* End button - circular icon (right side) */}
          {onEndConversation ? (
            <button
              onClick={onEndConversation}
              className="flex flex-col items-center gap-1"
            >
              <div className="h-14 w-14 rounded-full bg-gray-700 dark:bg-gray-700 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Afslut</span>
            </button>
          ) : (
            <div className="w-14" /> // Spacer to maintain layout
          )}
        </div>
      )
    }

    // Original mobile layout with text input
    return (
      <div
        className="bg-white dark:bg-gray-800 py-3 flex flex-col items-center"
        style={{
          '--input-scale': textSize / 100
        } as React.CSSProperties}
      >
        {/* Text input + send button */}
        <div className="w-full flex items-center gap-2 px-3 mb-3">
          <div className="relative flex-1">
            <div className="h-[50px] w-full">
              <textarea
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentInputLanguage === 'A'
                  ? `${t('typeMessage')} (${languageAName})...`
                  : `Skriv besked (Dansk)...`
                }
                lang={currentInputLanguage === 'A'
                  ? getLanguageTag(languageACode || 'en')
                  : getLanguageTag(languageBCode || 'da-DK')
                }
                dir={currentInputLanguage === 'A' && isRTLLanguage(languageACode || '') ? 'rtl' : 'ltr'}
                className="w-full h-full rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#bc4d30]/50 disabled:opacity-60 dark:text-white text-sm"
                style={{
                  fontSize: 'calc(0.875rem * var(--input-scale))'
                }}
                disabled={transcribing}
              />
              {/* Waveform overlay when recording */}
              {isRecording && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl pointer-events-none">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={40}
                    className="max-w-[80%] h-8 rounded-full"
                  />
                </div>
              )}
              {transcribing && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl pointer-events-none">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#bc4d30]" />
                </div>
              )}
            </div>
          </div>

          {/* Send button */}
          {!isRecording && (
            <button
              type="button"
              onClick={onSend}
              disabled={
                transcribing || disabled || inputValue.trim().length === 0
              }
              className="flex items-center justify-center h-10 w-10 bg-[#bc4d30] text-white rounded-full shadow disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#bc4d30]/50"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Large Microphone Button - Google Translate style */}
        <div className="flex justify-center mb-3">
          <div className="transform scale-125">
            <MicRecorderWithWaveform
              micReady={micReady}
              onRecorded={handleRecorded}
              onRecordingStateChange={handleRecordingStateChange}
              canvasRef={canvasRef}
              preloadedAudioContext={audioContext}
              preloadedStream={preloadedStream}
            />
          </div>
        </div>

        {/* Action Buttons - End Conversation / New Conversation */}
        {(onEndConversation || onNewConversation) && (
          <div className="flex justify-center gap-6 pb-2">
            {onEndConversation && (
              <button
                onClick={onEndConversation}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>End</span>
              </button>
            )}
            {onNewConversation && (
              <button
                onClick={onNewConversation}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // Desktop version (original layout)
  return (
    <div
      className="border-t border-white dark:border-gray-600 bg-gray-50 dark:bg-gray-800 py-4 flex flex-col items-center"
      style={{
        '--input-scale': textSize / 100
      } as React.CSSProperties}
    >
      {/* text-area + send ------------------------------------------ */}
      <div className="w-full max-w-2xl flex items-center gap-3 px-2">
        <div className="relative flex-1">
          <div className="h-[60px] w-full">
            {isRecording ? (
              <div className="relative w-full h-full">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={60}
                  className="w-full h-full rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-inner"
                />
              </div>
            ) : (
              <textarea
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isDanishPanel ? 'Skriv din besked på dansk...' : t('typeMessage')}
                lang={isDanishPanel
                  ? getLanguageTag(languageBCode || 'da-DK')
                  : getLanguageTag(languageACode || 'en')
                }
                dir={!isDanishPanel && isRTLLanguage(languageACode || '') ? 'rtl' : 'ltr'}
                className="w-full h-full rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-[#bc4d30]/50 disabled:opacity-60 dark:text-white"
                style={{
                  fontSize: 'calc(1rem * var(--input-scale))'
                }}
                disabled={transcribing}
              />
            )}
            {transcribing && (
              <div className="absolute inset-0 flex items-center justify-end bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-full pointer-events-none">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#bc4d30] mr-2" />
              </div>
            )}
          </div>
        </div>

        {/* send arrow --------------------------------------------- */}
        {!isRecording && (
          <button
            type="button"
            onClick={onSend}
            disabled={
              transcribing || disabled || inputValue.trim().length === 0
            }
            className="flex items-center justify-center h-11 w-11 bg-[#bc4d30] dark:bg-black text-white rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#bc4d30]/50"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* mic button ------------------------------------------------ */}
      <div className="mt-4 mb-6 md:mb-0">
        <MicRecorderWithWaveform
          micReady={micReady}
          onRecorded={handleRecorded}
          onRecordingStateChange={handleRecordingStateChange}
          canvasRef={canvasRef}
          preloadedAudioContext={audioContext}
          preloadedStream={preloadedStream}
        />
      </div>
    </div>
  )
}

export default InputControls
