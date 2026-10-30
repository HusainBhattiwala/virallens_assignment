import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export type Theme = "dark" | "light" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = "theme"
const DEFAULT_THEME: Theme = "system"
const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)"
const THEMES: readonly Theme[] = ["dark", "light", "system"]
const DISABLE_TRANSITIONS_CSS =
  "*,*::before,*::after{transition:none!important}"

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const isTheme = (value: string | null): value is Theme =>
  THEMES.some((theme) => theme === value)

const readStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

const storeTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    return
  }
}

const resolveTheme = (theme: Theme): "dark" | "light" => {
  if (theme !== "system") return theme
  return window.matchMedia(COLOR_SCHEME_QUERY).matches ? "dark" : "light"
}

const applyTheme = (theme: Theme): void => {
  const style = document.createElement("style")
  style.textContent = DISABLE_TRANSITIONS_CSS
  document.head.appendChild(style)

  document.documentElement.classList.remove("light", "dark")
  document.documentElement.classList.add(resolveTheme(theme))

  window.getComputedStyle(document.body)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      style.remove()
    })
  })
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  const setTheme = useCallback((nextTheme: Theme) => {
    storeTheme(nextTheme)
    setThemeState(nextTheme)
  }, [])

  useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return undefined

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY)
    const handleChange = () => {
      applyTheme("system")
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY)
        setThemeState(isTheme(event.newValue) ? event.newValue : DEFAULT_THEME)
    }
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
