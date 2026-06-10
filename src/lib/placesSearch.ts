// Worldwide place / POI search for location tagging — restaurants, hotels,
// landmarks, businesses, addresses. Uses Photon (photon.komoot.io), a free,
// CORS-enabled geocoder built on OpenStreetMap data. No API key, no billing.

export type PlaceResult = {
  name: string
  city: string | null
  state: string | null   // 2-letter abbreviation when in the US
  category: string | null
  display: string
}

// Full US state name → USPS abbreviation, so tagged places stay searchable
// in the same "City, ST" format the rest of the app uses.
const US_STATE_ABBR: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK',
  oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
}

// OSM values that are really just cities/regions — skip them here because the
// app already has a dedicated US-cities list for those.
const SKIP_PLACE_VALUES = new Set(['city', 'town', 'village', 'hamlet', 'state', 'country', 'county'])

// Make a human label out of an OSM category, e.g. "fast_food" → "Fast food"
function prettyCategory(osmValue?: string, osmKey?: string): string | null {
  const v = osmValue || osmKey
  if (!v) return null
  return v.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const q = query.trim()
  if (q.length < 2) return []
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10&lang=en`
    const res = await fetch(url, { signal })
    if (!res.ok) return []
    const json = await res.json()
    const features: any[] = json.features ?? []

    const out: PlaceResult[] = []
    for (const f of features) {
      const p = f.properties ?? {}
      if (!p.name) continue
      if (p.osm_key === 'place' && SKIP_PLACE_VALUES.has(p.osm_value)) continue

      const city: string | null = p.city ?? p.district ?? p.county ?? null
      const rawState: string | null = p.state ?? null
      const state = rawState
        ? (US_STATE_ABBR[rawState.toLowerCase()] ?? rawState)
        : null

      const locParts = [city, state].filter(Boolean).join(', ')
      out.push({
        name: p.name,
        city,
        state,
        category: prettyCategory(p.osm_value, p.osm_key),
        display: locParts ? `${p.name} — ${locParts}` : p.name,
      })
    }
    return out
  } catch {
    return [] // network/abort — silently fall back to spots + cities
  }
}
