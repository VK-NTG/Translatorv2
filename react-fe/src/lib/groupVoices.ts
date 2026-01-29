import { VoiceInfo } from './fetchVoices';

export interface LanguageInfo {
    code: string;     // e.g. "fr-FR"
    english: string;  // "French (France)"
    native: string;   // "français (France)"
    voices: VoiceInfo[];
}

export function groupVoicesByLang(voices: VoiceInfo[]): LanguageInfo[] {
    const map = new Map<string, LanguageInfo>();

    voices.forEach((v) => {
        const code = v.locale; // keep full locale here
        const entry = map.get(code) ?? {
            code,
            english: v.locale_english_name,
            native: v.locale_native_name,
            voices: [],
        };
        entry.voices.push(v);
        map.set(code, entry);
    });

    return [...map.values()].sort((a, b) =>
        a.english.localeCompare(b.english),
    );
}
