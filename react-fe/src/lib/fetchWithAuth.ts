import { useAuthTheme } from '../context/AuthThemeContext';

export const useFetchWithAuth = () => {
    const { token } = useAuthTheme();

    const fetchWithAuth = async (input: RequestInfo, init?: RequestInit) => {
        const headers = new Headers(init?.headers || {});

        if (token) {
            if (token.startsWith('dev-bearer-')) {
                // In dev mode, use x-api-key instead of Authorization
                const apiKey = token.replace('dev-bearer-', '');
                headers.set('x-api-key', apiKey);
            } else {
                // In production, real Authorization header
                headers.set('Authorization', `Bearer ${token}`);
            }
        } else {
            console.warn('[fetchWithAuth] No token available!');
        }

        const modifiedInit: RequestInit = {
            ...init,
            headers,
        };

        return fetch(input, modifiedInit);
    };

    return { fetchWithAuth };
};
