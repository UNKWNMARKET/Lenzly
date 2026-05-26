import { useState } from 'react'
import { Search, Zap, MapPin, TrendingUp } from 'lucide-react'
import LocationSpotCard from '@/components/LocationSpotCard'
import BusinessBanner from '@/components/BusinessBanner'
import { photoSpots, posts, specialtyFilters } from '@/data/mockData'
import { cn } from '@/lib/utils'

export default function Explore() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')

  const filteredPosts = posts.filter(p => {
    const matchesFilter = activeFilter === 'All' || p.category === activeFilter
    const matchesQuery = !query || p.caption.toLowerCase().includes(query.toLowerCase()) ||
      p.location.toLowerCase().includes(query.toLowerCase()) ||
      p.photographer.name.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })

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
            placeholder="Search locations, photographers, styles..."
            className="w-full bg-lenz-card border border-lenz-border rounded-full pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {specialtyFilters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200',
                activeFilter === f
                  ? 'bg-gold text-lenz-bg'
                  : 'bg-lenz-card border border-lenz-border text-white/50 hover:border-white/20'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* AI Photo Spots Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-gold fill-gold" />
              <h2 className="text-sm font-bold text-white tracking-wide">AI-Discovered Spots</h2>
            </div>
            <button className="text-[11px] text-gold font-medium">View All</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {photoSpots.filter(s => s.aiDiscovered).slice(0, 4).map(spot => (
              <LocationSpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        </section>

        {/* Trending section */}
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

        {/* Business Banner */}
        <div className="-mx-4">
          <BusinessBanner />
        </div>

        {/* All Photo Spots */}
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
      </div>
    </div>
  )
}
