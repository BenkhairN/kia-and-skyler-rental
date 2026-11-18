import { useState } from 'react'
import { CarFront } from 'lucide-react'

export default function CarImage({ src, alt, label = 'Photo coming soon', className = '', iconSize = 40 }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className={`media ${className}`}>
      {showImage ? (
        <img src={src} alt={alt || ''} onError={() => setFailed(true)} loading="lazy" />
      ) : (
        <div className="placeholder" aria-label={alt || label}>
          <CarFront size={iconSize} strokeWidth={1.4} />
          <span>{label}</span>
        </div>
      )}
    </div>
  )
}
