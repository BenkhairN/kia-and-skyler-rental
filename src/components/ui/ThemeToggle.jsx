import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      className={`btn-icon theme-toggle ${showLabel ? 'theme-toggle-labeled' : ''} ${className}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span key={theme} className="theme-toggle-icon">
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </span>
      {showLabel && <span key={`${theme}-label`} className="theme-toggle-label">{isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}
