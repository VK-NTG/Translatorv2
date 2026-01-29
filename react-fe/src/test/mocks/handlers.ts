import { http, HttpResponse } from 'msw'

const API_BASE = '/api/v1'

export const handlers = [
  // Health check
  http.get(`${API_BASE}/misc/health`, () => {
    return HttpResponse.json({
      status: 'ok',
      message: 'KK AI Translator',
      version: '0.7.6-test',
      provider: 'Azure Translator + OpenAI',
      auth: 'API Key + JWT Bearer',
    })
  }),

  // Ping
  http.get(`${API_BASE}/misc/ping`, () => {
    return HttpResponse.json({ message: 'pong' })
  }),

  // Start session
  http.post(`${API_BASE}/sessions/start-session`, () => {
    return HttpResponse.json({
      session_id: 1,
      status: 'active',
    })
  }),

  // Select language
  http.post(`${API_BASE}/sessions/select-language`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      session_id: body.session_id,
      from_language: body.from_language,
      to_language: body.to_language,
      from_language_name: body.from_language_name,
      to_language_name: body.to_language_name,
    })
  }),

  // Translate
  http.post(`${API_BASE}/sessions/translate`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      original_text: body.text,
      translated_text: 'Mocked translation result',
      direction: body.direction,
    })
  }),

  // Transcribe
  http.post(`${API_BASE}/sessions/transcribe`, () => {
    return HttpResponse.json({
      transcribed_text: 'Mocked transcription result',
    })
  }),

  // Recap
  http.get(`${API_BASE}/sessions/recap`, ({ request }) => {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('session_id')
    return HttpResponse.json({
      session_id: sessionId,
      recap: 'Mocked conversation recap',
      translations: [],
    })
  }),

  // Finish session
  http.post(`${API_BASE}/sessions/finish-session`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      session_id: body.session_id,
      status: 'completed',
    })
  }),

  // System settings
  http.get(`${API_BASE}/context/system-settings`, () => {
    return HttpResponse.json({
      context_enhancement_enabled: true,
      translation_prompt_mode: 'default',
      translation_prompt_custom: '',
      translation_prompt_additions: '',
    })
  }),

  // Language contexts
  http.get(`${API_BASE}/context/language-contexts`, () => {
    return HttpResponse.json([
      {
        id: 1,
        language_code: 'ar',
        language_name: 'Arabic',
        formality_notes: 'Use formal Arabic',
        cultural_notes: 'Cultural context notes',
        is_active: true,
      },
    ])
  }),

  // Word definitions
  http.get(`${API_BASE}/context/word-definitions`, () => {
    return HttpResponse.json([
      {
        id: 1,
        word: 'kommune',
        language_code: 'da',
        definition: 'Municipality',
        translation_hints: 'Context-dependent',
        priority: 10,
        is_active: true,
      },
    ])
  }),

  // Voices
  http.get(`${API_BASE}/misc/voices`, () => {
    return HttpResponse.json([
      {
        short_name: 'da-DK-ChristelNeural',
        locale: 'da-DK',
        gender: 'Female',
        display_name: 'Christel',
      },
      {
        short_name: 'ar-SA-ZariyahNeural',
        locale: 'ar-SA',
        gender: 'Female',
        display_name: 'Zariyah',
      },
    ])
  }),

  // Supported languages
  http.get(`${API_BASE}/misc/supported-languages`, () => {
    return HttpResponse.json([
      { code: 'da', name: 'Danish' },
      { code: 'ar', name: 'Arabic' },
      { code: 'en', name: 'English' },
      { code: 'uk', name: 'Ukrainian' },
    ])
  }),
]
