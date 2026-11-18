export const PREFIX = 'ksr:'

export const loadState = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const saveState = (key, value) => {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // ignore write errors (private mode, quota)
  }
}

export const clearState = (key) => {
  window.localStorage.removeItem(PREFIX + key)
}
