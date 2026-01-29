export const getAdminSecret = (): string | null =>
    localStorage.getItem('adminSecret');

export const setAdminSecret = (s: string | null) => {
    if (!s || !s.trim()) {
        localStorage.removeItem('adminSecret');
    } else {
        localStorage.setItem('adminSecret', s.trim());
    }
};
