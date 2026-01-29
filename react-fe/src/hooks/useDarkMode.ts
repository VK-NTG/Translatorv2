import { useEffect } from 'react'

export function useDarkMode() {
  useEffect(() => {
    const isDark = localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.documentElement.classList.toggle('dark', isDark)
  }, [])
}
