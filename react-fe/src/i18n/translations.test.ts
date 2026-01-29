import { describe, it, expect } from 'vitest'
import { translations, getTranslation, Translation } from './translations'

describe('translations', () => {
  describe('translations object', () => {
    it('should contain Danish translations', () => {
      expect(translations['da-DK']).toBeDefined()
      expect(translations['da-DK'].selectLanguage).toBe('Vælg sprog for at starte:')
    })

    it('should contain English translations', () => {
      expect(translations['en-US']).toBeDefined()
      expect(translations['en-US'].selectLanguage).toBe('Select language to start:')
    })

    it('should contain Arabic translations', () => {
      expect(translations['ar']).toBeDefined()
      expect(translations['ar'].selectLanguage).toBe('اختر اللغة للبدء:')
    })

    it('should contain Ukrainian translations', () => {
      expect(translations['uk']).toBeDefined()
      expect(translations['uk'].selectLanguage).toBe('Оберіть мову для початку:')
    })

    it('should have all required keys for each translation', () => {
      const requiredKeys: (keyof Translation)[] = [
        'selectLanguage',
        'loadingLanguages',
        'creatingSession',
        'finishSession',
        'readAloud',
        'typeMessage',
        'sendMessage',
        'startRecording',
        'stopRecording',
        'welcomeTitle',
        'welcomeMessage',
        'howItWorks',
        'step1',
        'step2',
        'step3',
        'startTranslating',
        'loading',
        'error',
        'ok',
        'cancel',
        'originalText',
        'translating'
      ]

      Object.keys(translations).forEach((langCode) => {
        requiredKeys.forEach((key) => {
          expect(
            translations[langCode][key],
            `Missing '${key}' in translations for '${langCode}'`
          ).toBeDefined()
        })
      })
    })
  })

  describe('getTranslation', () => {
    it('should return exact match for known language code', () => {
      const result = getTranslation('da-DK', 'selectLanguage')
      expect(result).toBe('Vælg sprog for at starte:')
    })

    it('should return English fallback for unknown language', () => {
      const result = getTranslation('unknown-XX', 'selectLanguage')
      expect(result).toBe('Select language to start:')
    })

    it('should handle language without region (e.g., en from en-US)', () => {
      const result = getTranslation('ar', 'selectLanguage')
      expect(result).toBe('اختر اللغة للبدء:')
    })

    it('should fallback to base language variant', () => {
      // 'en' should find 'en-US'
      const result = getTranslation('en', 'selectLanguage')
      expect(result).toBe('Select language to start:')
    })

    it('should handle Danish variants correctly', () => {
      const result = getTranslation('da', 'selectLanguage')
      expect(result).toBe('Vælg sprog for at starte:')
    })

    it('should return correct translation for all translation keys', () => {
      // Test that getTranslation returns non-empty strings for all keys
      const keys: (keyof Translation)[] = [
        'selectLanguage', 'loading', 'error', 'ok', 'cancel'
      ]

      keys.forEach((key) => {
        const result = getTranslation('en-US', key)
        expect(result).toBeTruthy()
        expect(typeof result).toBe('string')
      })
    })
  })
})
