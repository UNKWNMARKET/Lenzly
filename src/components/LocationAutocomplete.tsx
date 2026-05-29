import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export type LocationSuggestion = {
  name: string
  city: string | null
  state: string | null
  display: string
  source: 'spot' | 'city'
}

// Common US cities for quick suggestions (city, state)
const POPULAR_CITIES: { city: string; state: string }[] = [
  { city: 'Miami', state: 'FL' }, { city: 'Miami Beach', state: 'FL' },
  { city: 'Orlando', state: 'FL' }, { city: 'Tampa', state: 'FL' },
  { city: 'Jacksonville', state: 'FL' }, { city: 'Key West', state: 'FL' },
  { city: 'Fort Lauderdale', state: 'FL' }, { city: 'St. Augustine', state: 'FL' },
  { city: 'New York', state: 'NY' }, { city: 'Brooklyn', state: 'NY' },
  { city: 'Los Angeles', state: 'CA' }, { city: 'San Francisco', state: 'CA' },
  { city: 'San Diego', state: 'CA' }, { city: 'Chicago', state: 'IL' },
  { city: 'Houston', state: 'TX' }, { city: 'Austin', state: 'TX' },
  { city: 'Dallas', state: 'TX' }, { city: 'Seattle', state: 'WA' },
  { city: 'Portland', state: 'OR' }, { city: 'Denver', state: 'CO' },
  { city: 'Las Vegas', state: 'NV' }, { city: 'Phoenix', state: 'AZ' },
  { city: 'Nashville', state: 'TN' }, { city: 'New Orleans', state: 'LA' },
  { city: 'Atlanta', state: 'GA' }, { city: 'Boston', state: 'MA' },
  { city: 'Washington', state: 'DC' }, { city: 'Philadelphia', state: 'PA' },
  { city: 'Charleston', state: 'SC' }, { city: 'Savannah', state: 'GA' },
]

type Props = {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: LocationSuggestion) => void
  placeholder?: string
}

export default function LocationAutocomplete({ value, onChange, onSelect, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const skipNextSearch = useRef(false)

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return
    }
    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      const lower = q.toLowerCase()

      // 1. Match existing community spots from DB
      const { data: spots } = await supabase
        .from('photo_spots')
        .select('name, city, state')
        .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
        .limit(5)

      const spotSuggestions: LocationSuggestion[] = (spots ?? []).map(s => ({
        name: s.name,
        city: s.city,
        state: s.state,
        display: s.city ? `${s.name} — ${s.city}${s.state ? `, ${s.state}` : ''}` : s.name,
        source: 'spot' as const,
      }))

      // 2. Match popular cities
      const citySuggestions: LocationSuggestion[] = POPULAR_CITIES
        .filter(c =>
          c.city.toLowerCase().includes(lower) ||
          `${c.city} ${c.state}`.toLowerCase().includes(lower) ||
          c.state.toLowerCase() === lower
        )
        .slice(0, 6)
        .map(c => ({
          name: c.city,
          city: c.city,
          state: c.state,
          display: `${c.city}, ${c.state}`,
          source: 'city' as const,
        }))

      // Merge, dedupe by display
      const seen = new Set<string>()
      const merged = [...spotSuggestions, ...citySuggestions].filter(s => {
        if (seen.has(s.display)) return false
        seen.add(s.display)
        return true
      })

      setSuggestions(merged)
      setOpen(merged.length > 0)
      setLoading(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [value])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handlePick = (s: LocationSuggestion) => {
    skipNextSearch.current = true
    // For spots, keep the full name + city/state; for cities, use "City, State"
    const newValue = s.source === 'spot' && s.city
      ? `${s.name}, ${s.city}${s.state ? ` ${s.state}` : ''}`
      : s.display
    onChange(newValue)
    onSelect?.(s)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={containerRef} className="relative">
      <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 z-10" />
      <input
        type="text"
        placeholder={placeholder ?? 'Location (e.g. Wynwood Walls, Miami FL)'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-10 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
      />
      {loading && (
        <Loader size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-lenz-card border border-lenz-border rounded-xl overflow-hidden shadow-xl shadow-black/40 max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={`${s.display}-${i}`}
              type="button"
              onClick={() => handlePick(s)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-lenz-border/50 last:border-0"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${s.source === 'spot' ? 'bg-gold/15' : 'bg-white/5'}`}>
                <MapPin size={13} className={s.source === 'spot' ? 'text-gold' : 'text-white/40'} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{s.display}</p>
                <p className="text-[10px] text-white/30">
                  {s.source === 'spot' ? 'Community spot' : 'City'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
