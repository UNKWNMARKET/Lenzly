import { useState, useEffect } from 'react'
import { resolveWikimediaPhoto } from '@/lib/wikimediaPhotos'

type Props = {
  /** Landmark / spot name used to look up an accurate photo */
  name: string
  /** Fallback image (existing stock) shown until/unless a real photo resolves */
  fallback: string
  alt?: string
  className?: string
}

// Shows an accurate Wikimedia Commons photo for a named landmark when one
// exists, otherwise the provided fallback. Resolves lazily and caches globally.
export default function SmartSpotImage({ name, fallback, alt, className }: Props) {
  const [src, setSrc] = useState(fallback)

  useEffect(() => {
    let active = true
    setSrc(fallback)
    resolveWikimediaPhoto(name).then(url => {
      if (active && url) setSrc(url)
    })
    return () => { active = false }
  }, [name, fallback])

  return (
    <img
      src={src}
      alt={alt ?? name}
      loading="lazy"
      className={className}
      onError={() => { if (src !== fallback) setSrc(fallback) }}
    />
  )
}
