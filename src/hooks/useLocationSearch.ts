import { useMemo } from 'react'

export type LocationQuery = {
  raw: string
  city: string | null
  state: string | null
  isLocationSearch: boolean
}

const STATE_MAP: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
  // abbrevs
  'al':'AL','ak':'AK','az':'AZ','ar':'AR','ca':'CA','co':'CO','ct':'CT','de':'DE',
  'fl':'FL','ga':'GA','hi':'HI','id':'ID','il':'IL','in':'IN','ia':'IA','ks':'KS',
  'ky':'KY','la':'LA','me':'ME','md':'MD','ma':'MA','mi':'MI','mn':'MN','ms':'MS',
  'mo':'MO','mt':'MT','ne':'NE','nv':'NV','nh':'NH','nj':'NJ','nm':'NM','ny':'NY',
  'nc':'NC','nd':'ND','oh':'OH','ok':'OK','or':'OR','pa':'PA','ri':'RI','sc':'SC',
  'sd':'SD','tn':'TN','tx':'TX','ut':'UT','vt':'VT','va':'VA','wa':'WA','wv':'WV',
  'wi':'WI','wy':'WY',
}

export function parseLocationQuery(query: string): LocationQuery {
  const q = query.trim()
  if (!q) return { raw: q, city: null, state: null, isLocationSearch: false }

  const lower = q.toLowerCase()

  // Try to detect "City, State" or "City State" patterns
  // e.g. "Miami Florida", "Miami, FL", "miami fl", "new york ny"
  let city: string | null = null
  let state: string | null = null

  // Check all known state names/abbrevs (longest first to avoid partial matches)
  const stateKeys = Object.keys(STATE_MAP).sort((a, b) => b.length - a.length)
  for (const key of stateKeys) {
    // Match "city state" or "city, state" at end of string
    const pattern = new RegExp(`^(.+?),?\\s+${key.replace(/\s/g, '\\s')}$`, 'i')
    const match = lower.match(pattern)
    if (match) {
      city = match[1].trim()
      state = STATE_MAP[key]
      break
    }
    // Or just state alone
    if (lower === key) {
      city = null
      state = STATE_MAP[key]
      break
    }
  }

  const isLocationSearch = !!(city || state)

  return { raw: q, city, state, isLocationSearch }
}

export function spotMatchesLocation(
  spot: { city?: string; state?: string; name?: string; location?: string },
  loc: LocationQuery
): boolean {
  if (!loc.isLocationSearch) return true

  const spotCity = (spot.city ?? '').toLowerCase()
  const spotState = (spot.state ?? '').toLowerCase()
  const spotName = (spot.name ?? '').toLowerCase()
  const spotLocation = (spot.location ?? '').toLowerCase()

  const stateMatch = loc.state
    ? spotState === loc.state.toLowerCase() ||
      spotLocation.includes(loc.state.toLowerCase()) ||
      spotName.includes(loc.state.toLowerCase())
    : true

  const cityMatch = loc.city
    ? spotCity.includes(loc.city.toLowerCase()) ||
      spotLocation.includes(loc.city.toLowerCase()) ||
      spotName.includes(loc.city.toLowerCase())
    : true

  return stateMatch && cityMatch
}

export function useLocationSearch(query: string) {
  return useMemo(() => parseLocationQuery(query), [query])
}
