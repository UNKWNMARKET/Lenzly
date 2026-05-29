import { useState, useMemo } from 'react'
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { Search, Zap, MapPin, TrendingUp, Building2, Sun, Heart, Car, Users, Sparkles, X } from 'lucide-react'
import LocationSpotCard from '@/components/LocationSpotCard'
import BusinessBanner from '@/components/BusinessBanner'
import { photoSpots, posts, specialtyFilters } from '@/data/mockData'
import { architectureSpots } from '@/data/architectureData'
import { floridaSpots } from '@/data/floridaData'
import { floridaSpots200 } from '@/data/floridaSpots200'

const allFloridaSpots = [...floridaSpots, ...floridaSpots200]
import { engagementSpotData, carSpotData } from '@/data/allSpotsData'
import { useLiveSpots } from '@/hooks/useLiveSpots'
import { useLocationSearch, spotMatchesLocation } from '@/hooks/useLocationSearch'
import { searchUSCities } from '@/data/usCities'
import { cn } from '@/lib/utils'

const FL_CITIES = ['All', 'Miami', 'Miami Beach', 'Tampa', 'Orlando', 'Jacksonville', 'St. Augustine', 'Key West', 'Sarasota', 'Fort Lauderdale', 'Naples', 'Gainesville', 'Pensacola', 'Daytona Beach']

const US_STATES = [
  'All','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const allFilters = [...specialtyFilters, 'Architecture', 'Florida', 'Engagement', 'Car']

// Build a deduped list of all searchable "City, ST" locations from every data source
const LOCATION_INDEX: { label: string; city: string; state: string }[] = (() => {
  const seen = new Set<string>()
  const out: { label: string; city: string; state: string }[] = []
  const add = (city?: string, state?: string) => {
    if (!city || !state) return
    const label = `${city}, ${state}`
    if (seen.has(label)) return
    seen.add(label)
    out.push({ label, city, state })
  }
  architectureSpots.forEach(s => add(s.city, s.state))
  allFloridaSpots.forEach(s => add(s.city, 'FL'))
  engagementSpotData.forEach(s => add(s.city, s.state))
  carSpotData.forEach(s => add(s.city, s.state))
  return out.sort((a, b) => a.label.localeCompare(b.label))
})()

// Horizontal preview row used in the "All" overview — keeps each category to a
// single tidy swipeable strip with a "See all" jump instead of a giant grid.
function PreviewRow({
  icon: Icon, title, subtitle, spots, onSeeAll,
}: {
  icon: typeof Building2
  title: string
  subtitle?: string
  spots: { id: string | number }[]
  onSeeAll: () => void
}) {
  if (spots.length === 0) return null
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} className="text-gold shrink-0" />
          <h2 className="text-sm font-bold text-white tracking-wide truncate">{title}</h2>
          {subtitle && <span className="text-[10px] text-white/30 shrink-0">{subtitle}</span>}
        </div>
        <button onClick={onSeeAll} className="text-[11px] text-gold font-medium shrink-0 ml-2">
          See all →
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {spots.slice(0, 8).map(spot => (
          <div key={spot.id} className="w-40 shrink-0">
            <LocationSpotCard spot={spot as any} />
          </div>
        ))}
      </div>
    </section>
  )
}

// Focused single-category view: header + one filter strip + full grid.
function FocusedSection({
  icon: Icon, title, subtitle, count, filters, active, onFilter, spots, empty,
}: {
  icon: typeof Building2
  title: string
  subtitle?: string
  count: number
  filters: string[]
  active: string
  onFilter: (v: string) => void
  spots: { id: string | number }[]
  empty: string
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} className="text-gold shrink-0" />
          <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
          {subtitle && <span className="text-[10px] text-white/30 shrink-0">{subtitle}</span>}
        </div>
        <span className="text-[11px] text-white/30 shrink-0">{count} spots</span>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-200 whitespace-nowrap',
              active === f
                ? 'bg-gold text-lenz-bg'
                : 'bg-lenz-card border border-lenz-border text-white/40 hover:border-white/20'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {spots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/20 text-sm">{empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {spots.map(spot => (
            <LocationSpotCard key={spot.id} spot={spot as any} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function Explore() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeState, setActiveState] = useState('All')
  const [activeFlCity, setActiveFlCity] = useState('All')
  const [activeEngState, setActiveEngState] = useState('All')
  const [activeCarState, setActiveCarState] = useState('All')
  const { spots: liveSpots, loading: liveSpotsLoading, refresh: refreshLiveSpots } = useLiveSpots(50)
  const ptr = usePullToRefresh({ onRefresh: refreshLiveSpots })
  const locQuery = useLocationSearch(query)

  // Live location suggestions as the user types — every US city + spot locations
  const locationSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const seen = new Set<string>()
    const out: { label: string; city: string; state: string }[] = []

    // Spot-data locations first (these have actual content)
    for (const l of LOCATION_INDEX) {
      if (l.label.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)) {
        if (!seen.has(l.label)) { seen.add(l.label); out.push(l) }
      }
    }
    // Then the full US cities database
    for (const c of searchUSCities(query, 10)) {
      const label = `${c.city}, ${c.state}`
      if (!seen.has(label)) { seen.add(label); out.push({ label, city: c.city, state: c.state }) }
    }
    return out.slice(0, 8)
  }, [query])

  const filteredLiveSpots = useMemo(() =>
    liveSpots.filter(s => {
      if (!locQuery.isLocationSearch) {
        return !query || s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.category.toLowerCase().includes(query.toLowerCase())
      }
      return spotMatchesLocation(
        { name: s.name, city: (s as any).city, state: (s as any).state, location: (s as any).location_name },
        locQuery
      )
    }), [liveSpots, locQuery, query])

  const filteredPosts = useMemo(() => posts.filter(p => {
    const matchesFilter = activeFilter === 'All' || activeFilter === 'Architecture'
      ? activeFilter !== 'Architecture'
      : p.category === activeFilter
    if (!query) return matchesFilter
    if (locQuery.isLocationSearch) {
      return matchesFilter && spotMatchesLocation({ location: p.location }, locQuery)
    }
    const matchesQuery =
      p.caption.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase()) ||
      p.photographer.name.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  }), [activeFilter, query, locQuery])

  const filteredArchSpots = useMemo(() => {
    return architectureSpots.filter(s => {
      const stateOk = activeState === 'All' || s.state === activeState
      if (!query) return stateOk
      if (locQuery.isLocationSearch) {
        return stateOk && spotMatchesLocation({ city: s.city, state: s.state, name: s.name }, locQuery)
      }
      return stateOk && (
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.city + ' ' + s.state).toLowerCase().includes(query.toLowerCase()) ||
        (s.architectureStyle ?? '').toLowerCase().includes(query.toLowerCase())
      )
    })
  }, [activeState, query, locQuery])

  const filteredFlSpots = useMemo(() =>
    allFloridaSpots.filter(s => {
      const cityOk = activeFlCity === 'All' || s.city === activeFlCity
      if (!query) return cityOk
      if (locQuery.isLocationSearch) {
        return cityOk && spotMatchesLocation({ city: s.city, state: 'FL', name: s.name }, locQuery)
      }
      return cityOk && (
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.city.toLowerCase().includes(query.toLowerCase()) ||
        (s.architectureStyle ?? '').toLowerCase().includes(query.toLowerCase())
      )
    }), [activeFlCity, query, locQuery])

  const filteredEngSpots = useMemo(() =>
    engagementSpotData.filter(s => {
      const stateOk = activeEngState === 'All' || s.state === activeEngState
      if (!query) return stateOk
      if (locQuery.isLocationSearch) {
        return stateOk && spotMatchesLocation({ city: s.city, state: s.state, name: s.name }, locQuery)
      }
      return stateOk && (
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.city + ' ' + s.state).toLowerCase().includes(query.toLowerCase())
      )
    }), [activeEngState, query, locQuery])

  const filteredCarSpots = useMemo(() =>
    carSpotData.filter(s => {
      const stateOk = activeCarState === 'All' || s.state === activeCarState
      if (!query) return stateOk
      if (locQuery.isLocationSearch) {
        return stateOk && spotMatchesLocation({ city: s.city, state: s.state, name: s.name }, locQuery)
      }
      return stateOk && (
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.city + ' ' + s.state).toLowerCase().includes(query.toLowerCase())
      )
    }), [activeCarState, query, locQuery])

  // Generic photoSpots filter used by "AI-Discovered" and "All Photo Spots"
  const matchPhotoSpot = (s: typeof photoSpots[number]) => {
    if (!query) return true
    if (locQuery.isLocationSearch) {
      return spotMatchesLocation({ city: s.city, state: s.state, name: s.name }, locQuery)
    }
    return (
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.city.toLowerCase().includes(query.toLowerCase()) ||
      (s.state ?? '').toLowerCase().includes(query.toLowerCase())
    )
  }
  const filteredAiSpots = useMemo(() => photoSpots.filter(s => s.aiDiscovered && matchPhotoSpot(s)), [query, locQuery])
  const filteredAllSpots = useMemo(() => photoSpots.filter(matchPhotoSpot), [query, locQuery])

  const isAll = activeFilter === 'All'

  return (
    <PullToRefreshWrapper {...ptr} className="h-[100dvh] bg-lenz-bg">
    <div className="min-h-full pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 pt-4 pb-3 safe-top">
        <h1 className="text-xl font-bold tracking-[0.12em] gold-text mb-3">EXPLORE</h1>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 z-10" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true) }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search 'Miami FL', 'New York', 'Chicago IL'..."
            className="w-full bg-lenz-card border border-lenz-border rounded-full pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors"
          />
          {query && (
            <button onClick={() => { setQuery(''); setShowSuggestions(false) }} className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">
              <X size={14} className="text-white/30 hover:text-white/60" />
            </button>
          )}

          {/* Clickable location suggestions */}
          {showSuggestions && locationSuggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-lenz-card border border-lenz-border rounded-2xl overflow-hidden shadow-xl shadow-black/50 max-h-72 overflow-y-auto">
              {locationSuggestions.map(s => (
                <button
                  key={s.label}
                  onClick={() => { setQuery(s.label); setShowSuggestions(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-lenz-border/40 last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                    <MapPin size={13} className="text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white">{s.city}</p>
                    <p className="text-[10px] text-white/40">{s.state}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Location detection pill */}
        {locQuery.isLocationSearch && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 rounded-full px-3 py-1">
              <MapPin size={11} className="text-gold" />
              <span className="text-[11px] text-gold font-medium">
                Showing results for: {locQuery.city ? `${locQuery.city}${locQuery.state ? `, ${locQuery.state}` : ''}` : locQuery.state}
              </span>
            </div>
          </div>
        )}

        {/* Category filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {allFilters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200',
                activeFilter === f
                  ? 'bg-gold text-lenz-bg'
                  : 'bg-lenz-card border border-lenz-border text-white/50 hover:border-white/20'
              )}
            >
              {f === 'Architecture' && <Building2 size={11} />}
              {f === 'Florida' && <Sun size={11} />}
              {f === 'Engagement' && <Heart size={11} />}
              {f === 'Car' && <Car size={11} />}
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-8">

        {/* ═══════════════ "ALL" OVERVIEW — clean, swipeable previews ═══════════════ */}
        {isAll ? (
          <>
            {/* Community Discovered (live from DB) — the hero, full grid */}
            {(filteredLiveSpots.length > 0 || liveSpotsLoading) && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-gold" />
                    <h2 className="text-sm font-bold text-white tracking-wide">Community Discovered</h2>
                    {!liveSpotsLoading && (
                      <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                        {filteredLiveSpots.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/30">Live</span>
                  </div>
                </div>

                {liveSpotsLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-[4/3] rounded-xl bg-lenz-card animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredLiveSpots.slice(0, 6).map(spot => (
                      <div
                        key={spot.id}
                        className="relative overflow-hidden rounded-xl aspect-[4/3] bg-lenz-card cursor-pointer group"
                      >
                        {spot.cover_image_url ? (
                          <img
                            src={spot.cover_image_url}
                            alt={spot.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin size={24} className="text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <p className="text-xs font-semibold text-white truncate leading-tight">{spot.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1">
                              <Users size={9} className="text-white/50" />
                              <span className="text-[10px] text-white/50">{spot.photo_count} photos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap size={9} className="text-gold fill-gold" />
                              <span className="text-[10px] text-gold font-bold">{spot.ai_score}</span>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="text-[9px] font-medium bg-black/50 backdrop-blur-sm text-white/70 px-1.5 py-0.5 rounded-full">
                            {spot.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Category preview rows — one tidy swipeable strip each */}
            <PreviewRow icon={Zap}       title="AI-Discovered Spots"            spots={filteredAiSpots}   onSeeAll={() => window.scrollTo({ top: 0 })} />
            <PreviewRow icon={Building2}  title="Architecture" subtitle="50 States" spots={filteredArchSpots} onSeeAll={() => setActiveFilter('Architecture')} />
            <PreviewRow icon={Sun}        title="Florida"      subtitle="Buildings & Locations" spots={filteredFlSpots} onSeeAll={() => setActiveFilter('Florida')} />
            <PreviewRow icon={Heart}      title="Engagement"   subtitle="50 States" spots={filteredEngSpots}  onSeeAll={() => setActiveFilter('Engagement')} />
            <PreviewRow icon={Car}        title="Car Photography" subtitle="50 States" spots={filteredCarSpots} onSeeAll={() => setActiveFilter('Car')} />

            {/* Trending photos mosaic */}
            {filteredPosts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-white/40" />
                  <h2 className="text-sm font-bold text-white tracking-wide">Trending Photos</h2>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {filteredPosts.map((post, i) => (
                    <div
                      key={post.id}
                      className={cn(
                        'relative overflow-hidden cursor-pointer group bg-lenz-card',
                        i % 5 === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'
                      )}
                    >
                      <img
                        src={post.image}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                        <p className="text-xs font-semibold text-white truncate">{post.photographer.username}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={9} className="text-gold" />
                          <p className="text-[10px] text-white/60 truncate">{post.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Business Banner */}
            <div className="-mx-4">
              <BusinessBanner />
            </div>
          </>
        ) : (
          /* ═══════════════ FOCUSED CATEGORY — full grid + that filter strip ═══════════════ */
          <>
            {activeFilter === 'Architecture' && (
              <FocusedSection
                icon={Building2} title="Architecture" subtitle="All 50 States"
                count={filteredArchSpots.length}
                filters={US_STATES} active={activeState} onFilter={setActiveState}
                spots={filteredArchSpots} empty="No architecture spots match your search."
              />
            )}
            {activeFilter === 'Florida' && (
              <FocusedSection
                icon={Sun} title="Florida" subtitle="Buildings & Locations"
                count={filteredFlSpots.length}
                filters={FL_CITIES} active={activeFlCity} onFilter={setActiveFlCity}
                spots={filteredFlSpots} empty="No spots match your search."
              />
            )}
            {activeFilter === 'Engagement' && (
              <FocusedSection
                icon={Heart} title="Engagement" subtitle="All 50 States"
                count={filteredEngSpots.length}
                filters={US_STATES} active={activeEngState} onFilter={setActiveEngState}
                spots={filteredEngSpots} empty="No engagement spots match your search."
              />
            )}
            {activeFilter === 'Car' && (
              <FocusedSection
                icon={Car} title="Car Photography" subtitle="All 50 States"
                count={filteredCarSpots.length}
                filters={US_STATES} active={activeCarState} onFilter={setActiveCarState}
                spots={filteredCarSpots} empty="No car photography spots match your search."
              />
            )}
            {/* Specialty filters (Portrait, Street, etc.) fall back to the trending feed */}
            {!['Architecture', 'Florida', 'Engagement', 'Car'].includes(activeFilter) && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-white/40" />
                  <h2 className="text-sm font-bold text-white tracking-wide">{activeFilter}</h2>
                </div>
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/30 text-sm">No results for "{activeFilter}"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1">
                    {filteredPosts.map((post, i) => (
                      <div
                        key={post.id}
                        className={cn(
                          'relative overflow-hidden cursor-pointer group bg-lenz-card',
                          i % 5 === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'
                        )}
                      >
                        <img src={post.image} alt="" loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                          <p className="text-xs font-semibold text-white truncate">{post.photographer.username}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={9} className="text-gold" />
                            <p className="text-[10px] text-white/60 truncate">{post.location}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
    </PullToRefreshWrapper>
  )
}
