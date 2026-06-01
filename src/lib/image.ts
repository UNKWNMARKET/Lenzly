// On-the-fly image optimization via wsrv.nl — a free image CDN/proxy that
// resizes, converts to WebP, and edge-caches. We use this instead of Supabase
// image transformations (which need a paid plan) so it works on the free tier.
//
// Usage: optimizedImage(url, { width: 400 })  → a smaller, WebP, cached URL.
// Falls back to the original URL for data URIs, blobs, or empty values.

type Opts = {
  width?: number
  height?: number
  quality?: number // 1–100, default 80
  fit?: 'cover' | 'contain' | 'inside'
}

const PROXY = 'https://wsrv.nl/'

export function optimizedImage(url: string | null | undefined, opts: Opts = {}): string {
  if (!url) return ''
  // Don't proxy local previews, data URIs, blobs, or already-proxied URLs
  if (!/^https?:\/\//i.test(url)) return url
  if (url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.includes('wsrv.nl')) return url

  const { width, height, quality = 80, fit = 'cover' } = opts
  const params = new URLSearchParams()
  params.set('url', url)
  if (width) params.set('w', String(Math.round(width)))
  if (height) params.set('h', String(Math.round(height)))
  params.set('fit', fit)
  params.set('output', 'webp')
  params.set('q', String(quality))
  // Serve a default image instead of an error if the source 404s
  params.set('default', url)
  return `${PROXY}?${params.toString()}`
}

// Convenience presets for the common surfaces, sized for a 3x retina display.
export const img = {
  avatar: (url?: string | null) => optimizedImage(url, { width: 120, height: 120 }),
  thumb:  (url?: string | null) => optimizedImage(url, { width: 400, height: 400 }),
  feed:   (url?: string | null) => optimizedImage(url, { width: 1080 }),
  hero:   (url?: string | null) => optimizedImage(url, { width: 1280 }),
}
