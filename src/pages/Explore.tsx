import { useState, useMemo } from 'react'
import { Search, Zap, MapPin, TrendingUp, Building2, ChevronRight } from 'lucide-react'
import LocationSpotCard from '@/components/LocationSpotCard'
import BusinessBanner from '@/components/BusinessBanner'
import { photoSpots, posts, specialtyFilters } from '@/data/mockData'
import { architectureSpots } from '@/data/architectureData'
import { cn } from '@/lib/utils'

const US_STATES = [
  'All','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const allFilters = [...specialtyFilters, 'Architecture']

export default function Explore() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [activeState, setActiveState] = useState('All')

  const filteredPosts = posts.filter(p => {
    const matchesFilter = activeFilter === 'All' || activeFilter === 'Architecture'
      ? activeFilter !== 'Architecture'
      : p.category === activeFilter
    const matchesQuery = !query ||
      p.caption.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase()) ||
      p.photographer.name.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })

  const filteredArchSpots = useMemo(() => {
    return architectureSpots.filter(s =>
      (activeState === 'All' || s.state === activeState) &&
      (!query || s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.city + ' ' + s.state).toLowerCase().includes(query.toLowerCase()) ||
        (s.architectureStyle ?? '').toLowerCase().includes(query.toLowerCase()))
    )
  }, [activeState, query])

  const showArchitecture = activeFilter === 'All' || activeFilter === 'Architecture'
  const showFeed = activeFilter !== 'Architecture'

  return (
    <div className="min-h-screen bg-lenz-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 pt-4 pb-3 safe-top">
        <h1 className="text-xl font-bold tracking-[0.12em] gold-text mb-3">EXPLORE</h1>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search locations, architecture, photographers..."
            className="w-full bg-lenz-card border border-lenz-border rounded-full pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

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
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-8">

        {/* ── AI Photo Spots ── */}
        {activeFilter !== 'Architecture' && (
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
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">
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

        {/* Business Banner */}
        <div className="-mx-4">
          <BusinessBanner />
        </div>

        {/* ── All Photo Spots ── */}
        {activeFilter !== 'Architecture' && (
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
  )
}
