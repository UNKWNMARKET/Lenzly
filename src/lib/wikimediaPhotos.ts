// Wikimedia Commons photo resolver.
//
// Wikimedia images are public-domain or Creative Commons licensed — legal to
// reuse commercially (including caching/storing) as long as attribution is
// preserved. We fetch the lead image for a landmark by its name via the public
// MediaWiki API (no key required, CORS-enabled).
//
// Results are cached in Supabase `place_photos` so each landmark is only
// looked up once and shared by all users. This is permitted under the
// CC/PD licenses (unlike Google Places, which forbids caching).

import { supabase } from './supabase'

const memCache = new Map<string, string | null>()

function keyFor(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Resolve a real photo URL for a named landmark from Wikimedia Commons.
 * Returns null if nothing suitable was found.
 */
export async function resolveWikimediaPhoto(name: string): Promise<string | null> {
  const key = keyFor(name)
  if (memCache.has(key)) return memCache.get(key) ?? null

  // Shared Supabase cache first
  try {
    const { data } = await supabase
      .from('place_photos')
      .select('photo_url')
      .eq('place_key', key)
      .maybeSingle()
    if (data) {
      memCache.set(key, data.photo_url)
      return data.photo_url
    }
  } catch {
    // table may not exist yet
  }

  // Live Wikimedia lookup
  const url = await fetchWikimedia(name)
  memCache.set(key, url)
  // Persist to shared cache (fire and forget)
  void supabase.from('place_photos').upsert(
    { place_key: key, name, photo_url: url },
    { onConflict: 'place_key' },
  )
  return url
}

async function fetchWikimedia(name: string): Promise<string | null> {
  try {
    // Use the page-images API to get the lead thumbnail for the best matching page
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: '800',
      generator: 'search',
      gsrsearch: name,
      gsrlimit: '1',
      gsrnamespace: '0',
      origin: '*',
    })
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`)
    if (!res.ok) return null
    const json = await res.json()
    const pages = json?.query?.pages
    if (!pages) return null
    const first: any = Object.values(pages)[0]
    return first?.thumbnail?.source ?? null
  } catch {
    return null
  }
}
