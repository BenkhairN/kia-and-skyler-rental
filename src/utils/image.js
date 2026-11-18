const MAX_FILE_MB = 15

export const readImageFile = (file, { maxSize = 1280, quality = 0.82 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG or WEBP).'))
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      reject(new Error(`Image is larger than ${MAX_FILE_MB} MB.`))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That image could not be opened.'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })

const STORAGE_BUDGET = 4.5 * 1024 * 1024

export const storageUsage = () => {
  let total = 0
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      total += key.length + (window.localStorage.getItem(key) || '').length
    }
  } catch {
    return 0
  }
  return total
}

export const fitsInStorage = (currentJSON, nextJSON) =>
  storageUsage() - currentJSON.length + nextJSON.length < STORAGE_BUDGET

export const formatBytes = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`)
