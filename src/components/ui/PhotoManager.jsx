import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Star, Trash2, UploadCloud } from 'lucide-react'
import { readImageFile } from '../../utils/image'

export default function PhotoManager({ photos, onChange, onError, max = 6, hint }) {
  const MAX_PHOTOS = max
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, MAX_PHOTOS - photos.length)
    if (!files.length) {
      if (photos.length >= MAX_PHOTOS) onError?.(MAX_PHOTOS === 1 ? 'Remove the current photo first.' : `You can add up to ${MAX_PHOTOS} photos.`)
      return
    }
    setBusy(true)
    const added = []
    for (const file of files) {
      try {
        added.push(await readImageFile(file))
      } catch (err) {
        onError?.(err.message)
      }
    }
    setBusy(false)
    if (added.length) onChange([...photos, ...added])
  }

  const remove = (index) => onChange(photos.filter((_, i) => i !== index))
  const makeCover = (index) => onChange([photos[index], ...photos.filter((_, i) => i !== index)])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className="photo-manager">
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((src, i) => (
            <div key={`${i}-${src.slice(-24)}`} className={`photo-tile ${i === 0 && MAX_PHOTOS > 1 ? 'is-cover' : ''}`}>
              <img src={src} alt={`Vehicle photo ${i + 1}`} />
              {i === 0 && MAX_PHOTOS > 1 && <span className="photo-cover-tag">Cover</span>}
              <div className="photo-actions">
                {i !== 0 && (
                  <button type="button" className="btn-icon" onClick={() => makeCover(i)} aria-label="Set as cover photo" title="Set as cover photo">
                    <Star size={14} />
                  </button>
                )}
                <button type="button" className="btn-icon" onClick={() => remove(i)} aria-label="Remove photo" title="Remove photo">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button type="button" className="photo-tile photo-add" onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 size={20} className="spin" /> : <ImagePlus size={20} />}
              <span>Add photo</span>
            </button>
          )}
        </div>
      )}

      {photos.length === 0 && (
        <div
          className={`dropzone ${dragging ? 'is-dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        >
          {busy ? <Loader2 size={28} className="spin" /> : <UploadCloud size={28} />}
          <strong>{busy ? 'Processing...' : `Click to upload or drag ${MAX_PHOTOS === 1 ? 'a photo' : 'photos'} here`}</strong>
          <span>{hint || `JPG, PNG or WEBP. Up to ${MAX_PHOTOS} photos. The first photo is the cover shown on the website.`}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        hidden
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
