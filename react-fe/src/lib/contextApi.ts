import { API_URL } from '../config'

export interface SystemSettings {
  base_system_prompt: string
  context_enhancement_enabled: boolean
  translation_temperature: number
  translation_prompt_mode: string
  translation_prompt_custom: string
  translation_prompt_additions: string
  recap_prompt_mode: string
  recap_prompt_custom: string
  recap_prompt_additions: string
  include_conversation_history: boolean
  include_language_pair_info: boolean
  include_language_context: boolean
  include_word_dictionary: boolean
  recap_include_conversation_history: boolean
  recap_include_language_pair_info: boolean
  recap_include_language_context: boolean
  recap_include_word_dictionary: boolean
}

export interface LanguageContext {
  id: number
  language_code: string
  language_name: string
  formality_level: string
  formality_notes: string
  cultural_notes: string
  system_prompt: string
}

export interface WordDefinition {
  id: number
  word: string
  language_code: string
  context_type: string
  definition: string
  usage_examples?: string
  translation_hints?: string
  synonyms?: string
  avoid_translations?: string
  preferred_translations?: Record<string, string>
  priority: number
}

/**
 * System Settings API
 */
export const fetchSystemSettings = async (adminFetch: typeof fetch): Promise<SystemSettings> => {
  const response = await adminFetch(`${API_URL}/context/system-settings`)
  if (!response.ok) {
    throw new Error(`Failed to fetch system settings: ${response.status}`)
  }
  return response.json()
}

export const updateSystemSettings = async (
  adminFetch: typeof fetch,
  settings: Partial<SystemSettings>
): Promise<SystemSettings> => {
  const response = await adminFetch(`${API_URL}/context/system-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  })
  if (!response.ok) {
    throw new Error(`Failed to update system settings: ${response.status}`)
  }
  return response.json()
}

/**
 * Language Context API
 */
export const fetchLanguageContexts = async (adminFetch: typeof fetch): Promise<LanguageContext[]> => {
  const response = await adminFetch(`${API_URL}/context/language-contexts`)
  if (!response.ok) {
    throw new Error(`Failed to fetch language contexts: ${response.status}`)
  }
  return response.json()
}

export const fetchLanguageContext = async (
  adminFetch: typeof fetch,
  languageCode: string
): Promise<LanguageContext> => {
  const response = await adminFetch(`${API_URL}/context/language-contexts/${languageCode}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch language context: ${response.status}`)
  }
  return response.json()
}

export const updateLanguageContext = async (
  adminFetch: typeof fetch,
  languageCode: string,
  context: Partial<LanguageContext>
): Promise<LanguageContext> => {
  console.log('API call:', `${API_URL}/context/language-contexts/${languageCode}`, context)

  const response = await adminFetch(`${API_URL}/context/language-contexts/${languageCode}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(context),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('API Error Response:', response.status, errorText)
    throw new Error(`Failed to update language context: ${response.status} - ${errorText}`)
  }
  return response.json()
}

export const createLanguageContext = async (
  adminFetch: typeof fetch,
  context: Omit<LanguageContext, 'id'>
): Promise<LanguageContext> => {
  console.log('Creating language context:', context)

  const response = await adminFetch(`${API_URL}/context/language-contexts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(context),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Create API Error Response:', response.status, errorText)
    throw new Error(`Failed to create language context: ${response.status} - ${errorText}`)
  }
  return response.json()
}

/**
 * Word Definitions API
 */
export const fetchWordDefinitions = async (
  adminFetch: typeof fetch,
  params?: { language?: string; context_type?: string; search?: string }
): Promise<WordDefinition[]> => {
  const searchParams = new URLSearchParams()
  if (params?.language) searchParams.set('language', params.language)
  if (params?.context_type) searchParams.set('context_type', params.context_type)
  if (params?.search) searchParams.set('search', params.search)

  const url = `${API_URL}/context/word-definitions${searchParams.toString() ? `?${searchParams}` : ''}`
  const response = await adminFetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch word definitions: ${response.status}`)
  }
  return response.json()
}

export const fetchWordDefinition = async (
  adminFetch: typeof fetch,
  definitionId: number
): Promise<WordDefinition> => {
  const response = await adminFetch(`${API_URL}/context/word-definitions/${definitionId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch word definition: ${response.status}`)
  }
  return response.json()
}

export const createWordDefinition = async (
  adminFetch: typeof fetch,
  definition: Omit<WordDefinition, 'id'>
): Promise<WordDefinition> => {
  const response = await adminFetch(`${API_URL}/context/word-definitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(definition),
  })
  if (!response.ok) {
    throw new Error(`Failed to create word definition: ${response.status}`)
  }
  return response.json()
}

export const updateWordDefinition = async (
  adminFetch: typeof fetch,
  definitionId: number,
  definition: Partial<WordDefinition>
): Promise<WordDefinition> => {
  const response = await adminFetch(`${API_URL}/context/word-definitions/${definitionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(definition),
  })
  if (!response.ok) {
    throw new Error(`Failed to update word definition: ${response.status}`)
  }
  return response.json()
}

export const deleteWordDefinition = async (
  adminFetch: typeof fetch,
  definitionId: number
): Promise<void> => {
  const response = await adminFetch(`${API_URL}/context/word-definitions/${definitionId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete word definition: ${response.status}`)
  }
}