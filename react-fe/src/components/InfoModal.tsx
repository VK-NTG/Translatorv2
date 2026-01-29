import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { X, MessageSquare, Globe, Volume2 } from 'lucide-react'

interface InfoModalProps {
  isOpen: boolean
  onAccept: () => void
  onReject: () => void
  selectedLanguage: {
    code: string
    english_name: string
    native_name: string
  }
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onAccept, onReject, selectedLanguage }) => {
  const { t, isRTL } = useLanguage()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`relative w-full max-w-md rounded-lg bg-white dark:bg-gray-900 p-6 shadow-lg ${isRTL ? 'text-right' : 'text-left'}`}>
        {/* Close button */}
        <button
          onClick={onReject}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white pr-8">
          {t('welcomeTitle')}
        </h2>

        {/* Language info */}
        <div className="mb-4 p-3 bg-[#bc4d30]/10 rounded-lg">
          <div className="flex items-center gap-2 text-[#bc4d30] dark:text-[#bc4d30] font-medium">
            <Globe size={16} />
            <span>
              {selectedLanguage.english_name} ({selectedLanguage.native_name}) - Dansk
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          {t('welcomeMessage')}
        </p>

        {/* How it works */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
            {t('howItWorks')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MessageSquare size={16} className="mt-0.5 text-[#bc4d30]" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('step1')}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Globe size={16} className="mt-0.5 text-[#bc4d30]" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('step2')}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Volume2 size={16} className="mt-0.5 text-[#bc4d30]" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('step3')}
              </span>
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={onAccept}
          className="w-full bg-[#bc4d30] text-white px-4 py-3 rounded-lg hover:bg-[#a03d28] transition-colors font-medium"
        >
          {t('startTranslating')}
        </button>
      </div>
    </div>
  )
}

export default InfoModal