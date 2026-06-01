import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader, Utensils, Building2, Landmark } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { searchUSCities } from '@/data/usCities'
import { searchPlaces } from '@/lib/placesSearch'

export type LocationSuggestion = {
  name: string
  city: string | null
  state: string | null
  display: string
  source: 'spot' | 'city' | 'place'
  category?: string | null
}

function placeIcon(category?: string | null) {
  const c = (category ?? '').toLowerCase()
  if (/(restaurant|food|cafe|bar|pub|fast)/.test(c)) return Utensils
  if (/(hotel|motel|hostel|guest|lodging)/.test(c)) return Building2
  if (/(monument|attraction|museum|landmark|memorial|park|viewpoint)/.test(c)) return Landmark
  return MapPin
}

type Props = {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: LocationSuggestion) => void
  placeholder?: string
  dropUp?: boolean
}

export default function LocationAutocomplete({ value, onChange, onSelect, placeholder, dropUp }: Props) {
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
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }

    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const { data: spots } = await supabase
        .from('photo_spots')
        .select('name, city, state')
        .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
        .limit(4)

      const spotSuggestions: LocationSuggestion[] = (spots ?? []).map(s => ({
        name: s.name, city: s.city, state: s.state,
        display: s.city ? `${s.name} — ${s.city}${s.state ? `, ${s.state}` : ''}` : s.name,
        source: 'spot' as const,
      }))

      const places = await searchPlaces(q, controller.signal)
      const placeSuggestions: LocationSuggestion[] = places.map(p => ({
        name: p.name, city: p.city, state: p.state, display: p.display,
        source: 'place' as const, category: p.category,
      }))

      const citySuggestions: LocationSuggestion[] = searchUSCities(q, 5).map(c => ({
        name: c.city, city: c.city, state: c.state,
        display: `${c.city}, ${c.state}`, source: 'city' as const,
      }))

      const seen = new Set<string>()
      const merged = [...spotSuggestions, ...placeSuggestions, ...citySuggestions].filter(s => {
        if (seen.has(s.display)) return false
        seen.add(s.display)
        return true
      }).slice(0, 12)

      setSuggestions(merged)
      setOpen(merged.length > 0)
      setLoading(false)
    }, 280)

    return () => { clearTimeout(timer); controller.abort() }
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handlePick = (s: LocationSuggestion) => {
    skipNextSearch.current = true
    const newValue = (s.source === 'spot' || s.source === 'place') && s.city
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
        <div className={`absolute left-0 right-0 bg-lenz-card border border-lenz-border rounded-xl overflow-hidden shadow-xl shadow-black/40 max-h-64 overflow-y-auto ${dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}`}
          style={{ zIndex: 9999 }}
        >
          {suggestions.map((s, i) => {
            const Icon = s.source === 'place' ? placeIcon(s.category) : MapPin
            const accent = s.source === 'spot' || s.source === 'place'
            const label = s.source === 'spot' ? 'Community spot'
              : s.source === 'place' ? (s.category || 'Place')
              : 'City'
            return (
              <button
                key={`${s.display}-${i}`}
                type="button"
                onClick={() => handlePick(s)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-lenz-border/50 last:border-0"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${accent ? 'bg-gold/15' : 'bg-white/5'}`}>
                  <Icon size={13} className={accent ? 'text-gold' : 'text-white/40'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{s.display}</p>
                  <p className="text-[10px] text-white/30 capitalize">{label}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
