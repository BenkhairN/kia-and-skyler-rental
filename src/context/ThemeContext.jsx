import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { loadState, saveState } from '../utils/storage'

const ThemeContext = createContext(null)

const getInitialTheme = () => {
  const saved = loadState('theme', null)
  return saved === 'light' || saved === 'dark' ? saved : 'dark'
}

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme
}

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    saveState('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(
    (event) => {
      const next = theme === 'dark' ? 'light' : 'dark'
      const root = document.documentElement

      const switchTheme = () => {
        applyTheme(next)
        setTheme(next)
      }

      // Fallback: cross-fade every color for browsers without the View Transitions API
      if (!document.startViewTransition || prefersReducedMotion()) {
        root.classList.add('theme-switching')
        switchTheme()
        window.setTimeout(() => root.classList.remove('theme-switching'), 500)
        return
      }

      // Circular reveal that grows from the toggle button
      const x = event?.clientX ?? window.innerWidth / 2
      const y = event?.clientY ?? window.innerHeight / 2
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

      const transition = document.startViewTransition(() => flushSync(switchTheme))
      transition.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
    },
    [theme],
  )

  const value = useMemo(() => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
