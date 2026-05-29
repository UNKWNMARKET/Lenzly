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

export default function Explore() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [activeState, setActiveState] = useState('All')
  const [activeFlCity, setActiveFlCity] = useState('All')
  const [activeEngState, setActiveEngState] = useState('All')
  const [activeCarState, setActiveCarState] = useState('All')
  const { spots: liveSpots, loading: liveSpotsLoading, refresh: refreshLiveSpots } = useLiveSpots(50)
  const ptr = usePullToRefresh({ onRefresh: refreshLiveSpots })
  const locQuery = useLocationSearch(query)

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

  const showArchitecture = activeFilter === 'All' || activeFilter === 'Architecture'
  const showFeed = activeFilter === 'All' || !['Architecture', 'Florida', 'Engagement', 'Car'].includes(activeFilter)
  const showFlorida = activeFilter === 'All' || activeFilter === 'Florida'
  const showEngagement = activeFilter === 'All' || activeFilter === 'Engagement'
  const showCar = activeFilter === 'All' || activeFilter === 'Car'

  return (
    <PullToRefreshWrapper {...ptr} className="h-[100dvh] bg-lenz-bg">
    <div className="min-h-full pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 pt-4 pb-3 safe-top">
        <h1 className="text-xl font-bold tracking-[0.12em] gold-text mb-3">EXPLORE</h1>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search 'Miami FL', 'New York', 'Chicago IL'..."
            className="w-full bg-lenz-card border border-lenz-border rounded-full pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X size={14} className="text-white/30 hover:text-white/60" />
            </button>
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

        {/* ── Community Discovered (live from DB) ── */}
        {activeFilter === 'All' && (liveSpots.length > 0 || liveSpotsLoading) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-gold" />
                <h2 className="text-sm font-bold text-white tracking-wide">Community Discovered</h2>
                {!liveSpotsLoading && (
                  <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                    {filteredLiveSpots.length} spots
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
            ) : filteredLiveSpots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/20 text-sm">No community spots found for this location.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredLiveSpots.map(spot => (
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
                    {/* Category badge */}
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

        {/* ── AI Photo Spots ── */}
        {activeFilter === 'All' && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-gold fill-gold" />
                <h2 className="text-sm font-bold text-white tracking-wide">AI-Discovered Spots</h2>
              </div>
              <button className="text-[11px] text-gold font-medium">View All</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {photoSpots.filter(s => s.aiDiscovered).map(spot => (
                <LocationSpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          </section>
        )}

        {/* ── Architecture Photography — All 50 States ── */}
        {showArchitecture && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gold" />
                <h2 className="text-sm font-bold text-white tracking-wide">Architecture</h2>
                <span className="text-[10px] text-white/30">All 50 States</span>
              </div>
              <span className="text-[11px] text-white/30">{filteredArchSpots.length} spots</span>
            </div>

            {/* State filter strip */}
            <div
              className="flex gap-2 overflow-x-auto no-scrollbar py-3"
              style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
            >
              {US_STATES.map(st => (
                <button
                  key={st}
                  onClick={() => setActiveState(st)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-200',
                    activeState === st
                      ? 'bg-gold text-lenz-bg'
                      : 'bg-lenz-card border border-lenz-border text-white/40 hover:border-white/20'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredArchSpots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/20 text-sm">No architecture spots match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredArchSpots.map(spot => (
                  <LocationSpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Trending Photos ── */}
        {showFeed && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-white/40" />
              <h2 className="text-sm font-bold text-white tracking-wide">Trending Photos</h2>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/30 text-sm">No results for "{query}"</p>
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
            )}
          </section>
        )}

        {/* ── Florida Cities ── */}
        {showFlorida && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-gold" />
                <h2 className="text-sm font-bold text-white tracking-wide">Florida</h2>
                <span className="text-[10px] text-white/30">Buildings & Locations</span>
              </div>
              <span className="text-[11px] text-white/30">{filteredFlSpots.length} spots</span>
            </div>

            {/* City filter strip */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
              {FL_CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveFlCity(c)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 whitespace-nowrap',
                    activeFlCity === c
                      ? 'bg-gold text-lenz-bg'
                      : 'bg-lenz-card border border-lenz-border text-white/40 hover:border-white/20'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            {filteredFlSpots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/20 text-sm">No spots match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredFlSpots.map(spot => (
                  <LocationSpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Engagement Photography — All 50 States ── */}
        {showEngagement && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Heart size={14} className="text-gold fill-gold/30" />
                <h2 className="text-sm font-bold text-white tracking-wide">Engagement</h2>
                <span className="text-[10px] text-white/30">All 50 States</span>
              </div>
              <span className="text-[11px] text-white/30">{filteredEngSpots.length} spots</span>
            </div>

            {/* State filter strip */}
            <div
              className="flex gap-2 overflow-x-auto no-scrollbar py-3"
              style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
            >
              {US_STATES.map(st => (
                <button
                  key={st}
                  onClick={() => setActiveEngState(st)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-200',
                    activeEngState === st
                      ? 'bg-gold text-lenz-bg'
                      : 'bg-lenz-card border border-lenz-border text-white/40 hover:border-white/20'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredEngSpots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/20 text-sm">No engagement spots match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredEngSpots.map(spot => (
                  <LocationSpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Car Photography — All 50 States ── */}
        {showCar && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Car size={14} className="text-gold" />
                <h2 className="text-sm font-bold text-white tracking-wide">Car Photography</h2>
                <span className="text-[10px] text-white/30">All 50 States</span>
              </div>
              <span className="text-[11px] text-white/30">{filteredCarSpots.length} spots</span>
            </div>

            {/* State filter strip */}
            <div
              className="flex gap-2 overflow-x-auto no-scrollbar py-3"
              style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
            >
              {US_STATES.map(st => (
                <button
                  key={st}
                  onClick={() => setActiveCarState(st)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all duration-200',
                    activeCarState === st
                      ? 'bg-gold text-lenz-bg'
                      : 'bg-lenz-card border border-lenz-border text-white/40 hover:border-white/20'
                  )}
                >
                  {st}
                </button>
              ))}
            </div>

            {filteredCarSpots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/20 text-sm">No car photography spots match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredCarSpots.map(spot => (
                  <LocationSpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Business Banner */}
        <div className="-mx-4">
          <BusinessBanner />
        </div>

        {/* ── All Photo Spots ── */}
        {activeFilter === 'All' && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-white/40" />
              <h2 className="text-sm font-bold text-white tracking-wide">All Photo Spots</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {photoSpots.map(spot => (
                <LocationSpotCard key={spot.id} spot={spot} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    </PullToRefreshWrapper>
  )
}
