import { API_URL, API_KEY } from '../config';

export interface VoiceInfo {
    short_name: string;
    locale: string;
    local_name: string;
    locale_english_name: string;
    locale_native_name: string;
    gender: 'Male' | 'Female';
    voice_type: string;
    name: string;
}


export async function fetchVoices(
    customFetch?: typeof window.fetch,
): Promise<VoiceInfo[]> {
    const fetcher = customFetch ?? window.fetch;

    const res = await fetcher(`${API_URL}/sessions/available-voices`, {
        headers:
            customFetch === undefined ? { 'x-api-key': API_KEY } : undefined,
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
