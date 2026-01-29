import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  type ReactNode,
} from 'react'
import { API_KEY } from '../config'

interface AuthThemeContextType {
  token: string | null
  theme: 'light' | 'dark' | null
}

type ParentMsg =
  | { type: 'set-token'; value: string }
  | { type: 'set-dark-mode'; value: boolean }

type IframeMsg = { type: 'init' }

const AuthThemeContext = createContext<AuthThemeContextType>({
  token: null,
  theme: null,
})

export const useAuthTheme = () => useContext(AuthThemeContext)

export const AuthThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ParentMsg>) => {
      const { type, value } = event.data || {}

      if (type === 'set-token' && typeof value === 'string') {
        console.log('[auth] Received JWT token (not used):', value)
        setToken(value) // Token stored but we actually don't use it in the current implementation
      }

      if (type === 'set-dark-mode' && typeof value === 'boolean') {
        const mode = value ? 'dark' : 'light'
        setTheme(mode)
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(mode)
      }
    }

    /* 1️⃣ start listening before announcing readiness */
    window.addEventListener('message', handleMessage)

    /* 2️⃣ tell parent we’re ready */
    const initMsg: IframeMsg = { type: 'init' }
    window.parent.postMessage(
      initMsg,
      '*',
    )

    /* Fallback to API_KEY from config when no parent token is received */
    const devTokenTimeout = setTimeout(() => {
      if (!token) {
        console.log('[auth] No auth token received from parent, using API_KEY from config.')
        setToken(`dev-bearer-${API_KEY}`)
      }
    }, 1000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(devTokenTimeout)
    }
  }, []) // run once

  return (
    <AuthThemeContext.Provider
      value={{
        token, // Re-enabled token support for local development
        theme,
      }}
    >
      {children}
    </AuthThemeContext.Provider>
  )
}
