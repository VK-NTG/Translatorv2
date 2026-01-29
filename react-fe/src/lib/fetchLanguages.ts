import { API_URL, API_KEY } from '../config';

export interface LangConfig {
    code: string;
    english_name: string;
    native_name: string;
    enabled: boolean;
    voice: string;
    locked?: boolean;
    models: {
        transcribeModel: string;
        translationModel: string;
        summaryModel: string;
    };
}

export async function fetchLanguages(
    customFetch?: typeof window.fetch,
): Promise<LangConfig[]> {
    const fetcher = customFetch ?? window.fetch;

    const res = await fetcher(`${API_URL}/sessions/languages`, {
        headers:
            customFetch === undefined ? { 'x-api-key': API_KEY } : undefined,
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export type ModelChoices = {
    transcribe: string[];
    translate: string[];
    summary: string[];
};

export async function fetchChoices(
    customFetch?: typeof window.fetch,
): Promise<ModelChoices> {
    const fetcher = customFetch ?? window.fetch;

    const res = await fetcher(`${API_URL}/sessions/choices`, {
        headers:
            customFetch === undefined ? { 'x-api-key': API_KEY } : undefined,
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
}
