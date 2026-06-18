import { useState, useEffect } from 'react'
import { resolveWikimediaPhoto } from '@/lib/wikimediaPhotos'
import { optimizedImage } from '@/lib/image'

type Props = {
  /** Landmark / spot name used to look up an accurate photo */
  name: string
  /** Fallback image (existing stock) shown until/unless a real photo resolves */
  fallback: string
  alt?: string
  className?: string
  /** Target display width for CDN resizing (defaults to a card-sized 800px) */
  width?: number
}

// Shows an accurate Wikimedia Commons photo for a named landmark when one
// exists, otherwise the provided fallback. Resolves lazily and caches globally.
export default function SmartSpotImage({ name, fallback, alt, className, width = 800 }: Props) {
  const [src, setSrc] = useState(fallback)

  useEffect(() => {
    let active = true
    setSrc(fallback)
    resolveWikimediaPhoto(name).then(url => {
      if (active && url) setSrc(url)
    })
    return () => { active = false }
  }, [name, fallback])

  // Keep the raw src in state (so the onError fallback comparison still works),
  // but route the displayed image through the CDN for resize + WebP + caching.
  return (
    <img
      src={optimizedImage(src, { width })}
      alt={alt ?? name}
      loading="lazy"
      className={className}
      onError={() => { if (src !== fallback) setSrc(fallback) }}
    />
  )
}
