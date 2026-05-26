import { useState } from 'react'
import { MapPin, Star, Eye, Search } from 'lucide-react'
import { photoSpots } from '@/data/mockData'
import { architectureSpots } from '@/data/architectureData'

type Tab = 'featured' | 'architecture'

export default function AdminSpots() {
  const [tab, setTab] = useState<Tab>('featured')
  const [q, setQ] = useState('')

  const featuredFiltered = photoSpots.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.city.toLowerCase().includes(q.toLowerCase())
  )
  const archFiltered = architectureSpots.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.city.toLowerCase().includes(q.toLowerCase()) ||
    (s.state ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const spots = tab === 'featured' ? featuredFiltered : archFiltered

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Photo Spots</h1>
        <p className="text-xs text-white/40 mt-0.5">
          {photoSpots.length} featured · {architectureSpots.length} architecture
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search spots…"
          className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['featured', 'architecture'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              tab === t
                ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {t} ({t === 'featured' ? photoSpots.length : architectureSpots.length})
          </button>
        ))}
      </div>

      {spots.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No spots found</div>
      ) : (
        <div className="space-y-2">
          {spots.map(s => (
            <div key={s.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-3">
              <img
                src={s.image}
                alt={s.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                <p className="text-xs text-white/40 truncate flex items-center gap-1">
                  <MapPin size={10} /> {s.city}
                  {s.state ? `, ${s.state}` : ''}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-[#C9A84C] flex items-center gap-0.5">
                    <Star size={9} fill="currentColor" /> {s.rating}
                  </span>
                  <span className="text-[10px] text-white/30 flex items-center gap-0.5">
                    <Eye size={9} /> {s.photoCount?.toLocaleString()} photos
                  </span>
                  {s.aiDiscovered && (
                    <span className="text-[10px] bg-[#C9A84C]/10 text-[#C9A84C] px-1.5 py-0.5 rounded">
                      AI
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/30">{s.bestTime}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
