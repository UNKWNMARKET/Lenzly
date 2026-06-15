import { useState, useEffect, useRef, useCallback } from 'react'
import Spinner from '@/components/Spinner'
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { Search, SlidersHorizontal, List, Map as MapIcon, X, Star, MapPin } from 'lucide-react'
import VerifiedBadge from '@/components/VerifiedBadge'
import PhotographerCard from '@/components/PhotographerCard'
import { photographers, specialtyFilters } from '@/data/mockData'
import { useRealPhotographers } from '@/hooks/useRealPhotographers'
import { useBlockedUsers } from '@/hooks/useBlockedUsers'
import { useLocation } from 'wouter'

import { cn, formatCount } from '@/lib/utils'

// Lazy-load the map to avoid SSR issues
let MapContainer: any, TileLayer: any, Marker: any, Popup: any, L: any

// Geocode cache: location string → {lat, lng} or null (if not found)
const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const key = location.trim().toLowerCase()
  if (geocodeCache.has(key)) return geocodeCache.get(key)!
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=us`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    const result = data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null
    geocodeCache.set(key, result)
    return result
  } catch {
    return null
  }
}

async function loadLeaflet() {
  const [leafletModule, reactLeafletModule] = await Promise.all([
    import('leaflet'),
    import('react-leaflet'),
  ])
  L = leafletModule.default
  ;({ MapContainer, TileLayer, Marker, Popup } = reactLeafletModule)
}

function PhotographerMapPin({ photographer: p }: { photographer: (typeof photographers)[0] }) {
  const [, navigate] = useLocation()
  const icon = L?.divIcon({
    html: `
      <div style="
        width:44px;height:44px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);border:2px solid #C9A84C;
        background:#111;display:flex;align-items:center;
        justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,0.6);
        overflow:hidden;
      ">
        <img src="${p.avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;transform:rotate(45deg);" />
      </div>
    `,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  })

  if (!MapContainer) return null

  return (
    <Marker position={[p.lat, p.lng]} icon={icon}>
      <Popup>
        <div className="p-1 min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <img src={p.avatar} className="w-9 h-9 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-white text-sm">{p.name}</p>
              <p className="text-xs text-white/40">{p.specialty[0]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <Star size={11} className="text-gold fill-gold" />
            <span className="text-xs text-white">{p.rating}</span>
            <span className="text-xs text-white/30 ml-1">{p.priceRange.split('–')[0]}</span>
          </div>
          <button
            className="w-full btn-primary text-xs py-1.5"
            onClick={() => navigate(`/photographer/${p.id}`)}
          >
            View Profile
          </button>
        </div>
      </Popup>
    </Marker>
  )
}

interface Filters {
  specialty: string
  secondShooter: boolean
  availableOnly: boolean
  verifiedOnly: boolean
}

export default function FindPhotographer() {
  const [location] = useLocation()
  const [view, setView] = useState<'list' | 'map'>('list')

  // Read specialty from URL query param (e.g. /find?specialty=Portrait)
  const urlSpecialty = (() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const s = params.get('specialty')
      return s && specialtyFilters.includes(s) ? s : 'All'
    } catch { return 'All' }
  })()

  const [filters, setFilters] = useState<Filters>({
    specialty: urlSpecialty,
    secondShooter: false,
    availableOnly: false,
    verifiedOnly: false,
  })
  const [showFilters, setShowFilters] = useState(false)
  const [query, setQuery] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const mapLoadedRef = useRef(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Prevent map touch events from bubbling up and triggering page swipe.
  // Must depend on `view` so it re-runs once the map div is actually in the DOM.
  useEffect(() => {
    if (view !== 'map') return
    const el = mapContainerRef.current
    if (!el) return
    const stop = (e: TouchEvent) => e.stopPropagation()
    el.addEventListener('touchstart', stop, { passive: true })
    el.addEventListener('touchmove', stop, { passive: true })
    el.addEventListener('touchend', stop, { passive: true })
    return () => {
      el.removeEventListener('touchstart', stop)
      el.removeEventListener('touchmove', stop)
      el.removeEventListener('touchend', stop)
    }
  }, [view])
  // Geocoded coords for photographers whose profile only has a text location
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { lat: number; lng: number }>>({})

  useEffect(() => {
    if (view === 'map' && !mapLoadedRef.current) {
      mapLoadedRef.current = true
      loadLeaflet().then(() => setMapReady(true))
    }
  }, [view])

  // Only real signed-up users — no fabricated sample photographers
  const [refreshKey, setRefreshKey] = useState(0)
  const { photographers: realPhotographers } = useRealPhotographers({ refreshKey })
  const { blockedIds } = useBlockedUsers()
  const allPhotographers = realPhotographers.filter(p => !blockedIds.has(String(p.id)))

  // When map opens, geocode any photographer that has a location string but no real lat/lng
  useEffect(() => {
    if (view !== 'map') return
    const toGeocode = allPhotographers.filter(p =>
      p.show_location !== false &&
      p.location && p.location.trim() && (!p.lat || !p.lng || (p.lat === 0 && p.lng === 0))
    )
    if (toGeocode.length === 0) return
    // Stagger requests to respect Nominatim's 1 req/sec limit
    toGeocode.forEach((p, i) => {
      setTimeout(async () => {
        const coords = await geocodeLocation(p.location)
        if (coords) {
          setGeocodedCoords(prev => ({ ...prev, [String(p.id)]: coords }))
        }
      }, i * 1100)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, allPhotographers.length])

  const handleRefresh = useCallback(async () => {
    setRefreshKey(k => k + 1)
    await new Promise(r => setTimeout(r, 600))
  }, [])
  const ptr = usePullToRefresh({ onRefresh: handleRefresh })

  const filtered = allPhotographers
    .filter(p => {
      if (filters.specialty !== 'All' && !p.specialty.includes(filters.specialty)) return false
      if (filters.secondShooter && !p.secondShooter) return false
      if (filters.availableOnly && !p.available) return false
      if (filters.verifiedOnly && !p.verified) return false
      if (query && !p.name.toLowerCase().includes(query.toLowerCase()) &&
          !p.city.toLowerCase().includes(query.toLowerCase()) &&
          !p.specialty.join(' ').toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
    // Pro and verified surface first, then sort by followers + posts activity
    .sort((a, b) => {
      if (a.pro !== b.pro) return a.pro ? -1 : 1
      if (a.verified !== b.verified) return a.verified ? -1 : 1
      // Activity score: followers weighted higher than post count
      const scoreA = (a.followers ?? 0) * 3 + (a.posts ?? 0)
      const scoreB = (b.followers ?? 0) * 3 + (b.posts ?? 0)
      return scoreB - scoreA
    })

  return (
    <PullToRefreshWrapper {...ptr} className="h-full bg-lenz-bg">
    <div className="min-h-full pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 pt-4 pb-3 safe-top">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold tracking-[0.12em] gold-text">FIND A PHOTOGRAPHER</h1>
          {/* View toggle */}
          <div className="flex items-center bg-lenz-card border border-lenz-border rounded-full p-0.5 gap-0.5">
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                view === 'list' ? 'bg-gold text-lenz-bg' : 'text-white/40 hover:text-white/60'
              )}
            >
              <List size={13} />
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                view === 'map' ? 'bg-gold text-lenz-bg' : 'text-white/40 hover:text-white/60'
              )}
            >
              <MapIcon size={13} />
              Map
            </button>
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, city, specialty..."
              className="w-full bg-lenz-card border border-lenz-border rounded-full pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border text-xs font-medium transition-all',
              showFilters
                ? 'bg-gold/10 border-gold/40 text-gold'
                : 'bg-lenz-card border-lenz-border text-white/50 hover:border-white/20'
            )}
          >
            <SlidersHorizontal size={14} />
            Filter
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-lenz-card border border-lenz-border rounded-2xl space-y-4 animate-slide-up">
            {/* Specialty */}
            <div>
              <p className="text-[11px] font-semibold text-white/40 tracking-wider uppercase mb-2">Specialty</p>
              <div className="flex flex-wrap gap-1.5">
                {specialtyFilters.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilters(prev => ({ ...prev, specialty: f }))}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-all',
                      filters.specialty === f
                        ? 'bg-gold text-lenz-bg'
                        : 'bg-lenz-muted border border-lenz-border text-white/50 hover:border-white/20'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5">
              {[
                { key: 'secondShooter', label: 'Second Shooter Available', sublabel: 'For wedding photographers' },
                { key: 'availableOnly', label: 'Available Now', sublabel: 'Green status indicator' },
                { key: 'verifiedOnly', label: 'Verified Only', sublabel: 'Identity confirmed' },
              ].map(({ key, label, sublabel }) => (
                <button
                  key={key}
                  onClick={() => setFilters(prev => ({ ...prev, [key]: !prev[key as keyof Filters] }))}
                  className="flex items-center justify-between w-full"
                >
                  <div>
                    <p className="text-sm text-white text-left">{label}</p>
                    <p className="text-[11px] text-white/30 text-left">{sublabel}</p>
                  </div>
                  <div className={cn(
                    'w-10 h-5.5 rounded-full border transition-all relative',
                    filters[key as keyof Filters]
                      ? 'bg-gold border-gold'
                      : 'bg-lenz-muted border-lenz-border'
                  )}
                  style={{ height: '22px' }}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                      filters[key as keyof Filters] ? 'translate-x-5' : 'translate-x-0.5'
                    )} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Results count */}
      <div className="px-4 py-2.5">
        <p className="text-xs text-white/30">
          <span className="text-white/60 font-semibold">{filtered.length}</span> photographers found
          {filters.specialty !== 'All' && <span className="text-gold ml-1">· {filters.specialty}</span>}
          {filters.secondShooter && <span className="text-gold ml-1">· 2nd Shooter</span>}
        </p>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="px-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/20 text-sm">No photographers match your filters.</p>
              <button onClick={() => setFilters({ specialty: 'All', secondShooter: false, availableOnly: false, verifiedOnly: false })}
                className="mt-3 text-gold text-xs font-medium">
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map(p => <PhotographerCard key={p.id} photographer={p} />)
          )}
        </div>
      )}

      {/* Map View */}
      {view === 'map' && (
        <div className="px-4">
          {/* Geocoding progress hint */}
          {(() => {
            const needsGeocode = filtered.filter(p => p.location && (!p.lat || !p.lng || (p.lat === 0 && p.lng === 0)))
            const resolved = needsGeocode.filter(p => geocodedCoords[String(p.id)])
            return needsGeocode.length > 0 && resolved.length < needsGeocode.length ? (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse shrink-0" />
                <p className="text-[11px] text-white/30">Placing {resolved.length}/{needsGeocode.length} photographers on map…</p>
              </div>
            ) : null
          })()}

          <div ref={mapContainerRef} data-map-container className="rounded-2xl overflow-hidden border border-lenz-border" style={{ height: '380px' }}>
            {mapReady && MapContainer ? (
              <MapContainer
                center={[39.5, -98.35]}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {filtered.map(p => {
                  // Respect the user's "Show My Location Publicly" setting
                  if (p.show_location === false) return null
                  const gc = geocodedCoords[String(p.id)]
                  const lat = (p.lat && p.lng && !(p.lat === 0 && p.lng === 0)) ? p.lat : gc?.lat
                  const lng = (p.lat && p.lng && !(p.lat === 0 && p.lng === 0)) ? p.lng : gc?.lng
                  if (!lat || !lng) return null
                  return <PhotographerMapPin key={p.id} photographer={{ ...p, lat, lng }} />
                })}
              </MapContainer>
            ) : (
              <div className="w-full h-full bg-lenz-card flex items-center justify-center">
                <div className="text-center">
                  <Spinner size="lg" className="mx-auto mb-2" />
                  <p className="text-xs text-white/30">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Photographer chips below map */}
          <div className="mt-3 space-y-3">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 card">
                <div className={p.verified ? 'story-ring' : 'story-ring-seen'}>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-lenz-card">
                    <img src={p.avatar} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                    {p.verified && <VerifiedBadge size={11} />}
                    {p.pro && (
                      <span className="text-[8px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <MapPin size={9} className="text-white/30" />
                      <span className="text-[11px] text-white/30">{p.city}</span>
                    </div>
                    <span className="text-white/15">·</span>
                    <span className="text-[11px] text-white/30">{p.specialty[0]}</span>
                    {p.secondShooter && (
                      <>
                        <span className="text-white/15">·</span>
                        <span className="text-[11px] text-gold">2nd Shooter</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star size={11} className="text-gold fill-gold" />
                  <span className="text-xs text-white/60">{p.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PullToRefreshWrapper>
  )
}
