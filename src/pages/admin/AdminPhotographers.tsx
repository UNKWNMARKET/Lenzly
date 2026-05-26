import { useState } from 'react'
import { Search, Star, CheckCircle } from 'lucide-react'
import { photographers } from '@/data/mockData'

export default function AdminPhotographers() {
  const [q, setQ] = useState('')

  const filtered = photographers.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.location.toLowerCase().includes(q.toLowerCase()) ||
    p.specialty.some(s => s.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Photographers</h1>
        <p className="text-xs text-white/40 mt-0.5">{photographers.length} registered</p>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search photographers…"
          className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No photographers found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-3">
              <img
                src={p.avatar}
                alt={p.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  {p.verified && <CheckCircle size={12} className="text-[#C9A84C] shrink-0" fill="currentColor" />}
                  {p.pro && (
                    <span className="text-[10px] bg-[#C9A84C]/15 text-[#C9A84C] px-1.5 py-0.5 rounded font-medium">PRO</span>
                  )}
                </div>
                <p className="text-xs text-white/40 truncate">{p.location}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {p.specialty.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] bg-white/5 text-white/50 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-xs text-[#C9A84C] flex items-center gap-0.5 justify-end">
                  <Star size={10} fill="currentColor" /> {p.rating}
                </p>
                <p className="text-[10px] text-white/30">{p.followers.toLocaleString()} followers</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.available ? 'bg-green-950/40 text-green-400/80' : 'bg-white/5 text-white/30'}`}>
                  {p.available ? 'Available' : 'Unavailable'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
