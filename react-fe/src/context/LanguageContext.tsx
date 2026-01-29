import React, { createContext, useContext, useState, ReactNode } from 'react'
import { getTranslation, Translation } from '../i18n/translations'

interface LanguageContextType {
  currentLanguage: string
  setCurrentLanguage: (lang: string) => void
  t: (key: keyof Translation) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Languages that use right-to-left text direction
// const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('da-DK')

  const t = (key: keyof Translation): string => {
    return getTranslation(currentLanguage, key)
  }

  // Disabled RTL for Danish municipality use - always use LTR layout
  const isRTL = false // RTL_LANGUAGES.includes(currentLanguage.split('-')[0])

  const value: LanguageContextType = {
    currentLanguage,
    setCurrentLanguage,
    t,
    isRTL
  }

  return (
    <LanguageContext.Provider value={value}>
      <div dir="ltr">
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}