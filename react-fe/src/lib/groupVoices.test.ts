import { describe, it, expect } from 'vitest'
import { groupVoicesByLang, LanguageInfo } from './groupVoices'
import { VoiceInfo } from './fetchVoices'

describe('groupVoicesByLang', () => {
  const mockVoices: VoiceInfo[] = [
    {
      short_name: 'da-DK-ChristelNeural',
      display_name: 'Christel',
      locale: 'da-DK',
      locale_english_name: 'Danish (Denmark)',
      locale_native_name: 'dansk (Danmark)',
      gender: 'Female',
      voice_type: 'Neural',
    },
    {
      short_name: 'da-DK-JeppeNeural',
      display_name: 'Jeppe',
      locale: 'da-DK',
      locale_english_name: 'Danish (Denmark)',
      locale_native_name: 'dansk (Danmark)',
      gender: 'Male',
      voice_type: 'Neural',
    },
    {
      short_name: 'ar-SA-ZariyahNeural',
      display_name: 'Zariyah',
      locale: 'ar-SA',
      locale_english_name: 'Arabic (Saudi Arabia)',
      locale_native_name: 'العربية (المملكة العربية السعودية)',
      gender: 'Female',
      voice_type: 'Neural',
    },
    {
      short_name: 'en-US-JennyNeural',
      display_name: 'Jenny',
      locale: 'en-US',
      locale_english_name: 'English (United States)',
      locale_native_name: 'English (United States)',
      gender: 'Female',
      voice_type: 'Neural',
    },
  ]

  it('should group voices by locale', () => {
    const result = groupVoicesByLang(mockVoices)

    expect(result).toHaveLength(3) // da-DK, ar-SA, en-US

    const danishGroup = result.find((g) => g.code === 'da-DK')
    expect(danishGroup).toBeDefined()
    expect(danishGroup!.voices).toHaveLength(2)
  })

  it('should include locale information in each group', () => {
    const result = groupVoicesByLang(mockVoices)

    const danishGroup = result.find((g) => g.code === 'da-DK')
    expect(danishGroup!.english).toBe('Danish (Denmark)')
    expect(danishGroup!.native).toBe('dansk (Danmark)')
  })

  it('should sort groups alphabetically by English name', () => {
    const result = groupVoicesByLang(mockVoices)

    // Arabic comes before Danish, Danish before English
    expect(result[0].english).toBe('Arabic (Saudi Arabia)')
    expect(result[1].english).toBe('Danish (Denmark)')
    expect(result[2].english).toBe('English (United States)')
  })

  it('should return empty array for empty input', () => {
    const result = groupVoicesByLang([])
    expect(result).toEqual([])
  })

  it('should handle single voice', () => {
    const singleVoice = [mockVoices[0]]
    const result = groupVoicesByLang(singleVoice)

    expect(result).toHaveLength(1)
    expect(result[0].voices).toHaveLength(1)
    expect(result[0].code).toBe('da-DK')
  })

  it('should preserve voice details in groups', () => {
    const result = groupVoicesByLang(mockVoices)

    const arabicGroup = result.find((g) => g.code === 'ar-SA')
    const voice = arabicGroup!.voices[0]

    expect(voice.short_name).toBe('ar-SA-ZariyahNeural')
    expect(voice.display_name).toBe('Zariyah')
    expect(voice.gender).toBe('Female')
  })
})
