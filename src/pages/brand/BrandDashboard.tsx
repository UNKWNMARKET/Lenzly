import { useState } from 'react'
import { Building2, LogOut, Camera, MapPin, Star, CheckCircle, Search, Filter, ChevronRight } from 'lucide-react'
import { useLocation } from 'wouter'
import { useBrandAuth } from '@/contexts/BrandAuthContext'
import { photographers } from '@/data/mockData'

const SPECIALTIES = ['All', 'Editorial', 'Commercial', 'Fashion', 'Events', 'Product', 'Campaign']

export default function BrandDashboard() {
  const { brand, logout } = useBrandAuth()
  const [, navigate] = useLocation()
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('All')

  if (!brand) {
    navigate('/brand/login')
    return null
  }

  const filtered = photographers
    .filter(p => p.pro)
    .filter(p => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase())
      const matchesSpecialty = specialty === 'All' || p.specialty.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
      return matchesSearch && matchesSpecialty
    })

  function handleLogout() {
    logout()
    navigate('/brand/login')
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-xl border-b border-[#1a1a1a] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#A88A35] flex items-center justify-center">
              <Building2 size={18} className="text-[#080808]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{brand.company}</p>
              <p className="text-[10px] text-white/30 mt-0.5 leading-none">Brand Portal</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#C9A84C]/10 to-transparent border border-[#C9A84C]/15 p-5">
          <p className="text-[10px] font-bold text-[#C9A84C]/60 tracking-widest uppercase mb-1">Welcome back</p>
          <h2 className="text-xl font-bold text-white">{brand.company}</h2>
          <p className="text-xs text-white/40 mt-1">
            Browse and connect with our verified photographer talent network.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pro Photographers', value: photographers.filter(p => p.pro).length },
            { label: 'Avg. Rating', value: '4.8★' },
            { label: 'Avg. Response', value: '< 2h' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-[#C9A84C]">{value}</p>
              <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Search & filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              type="text"
              placeholder="Search by name or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {SPECIALTIES.map(s => (
              <button
                key={s}
                onClick={() => setSpecialty(s)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  specialty === s
                    ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25'
                    : 'text-white/40 bg-[#111] border border-[#1e1e1e] hover:text-white/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Photographer list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-white/50 tracking-wider uppercase">
              {filtered.length} Photographers
            </p>
            <button className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60">
              <Filter size={11} />
              Filter
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">No photographers found</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(p => (
                <div key={p.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 hover:border-[#C9A84C]/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#C9A84C]/30 shrink-0">
                      <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{p.name}</span>
                        <CheckCircle size={13} className="text-[#C9A84C]" />
                        <span className="text-[9px] font-bold text-[#080808] bg-[#C9A84C] px-1.5 py-0.5 rounded-full">PRO</span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5">{p.specialty.join(' · ')}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-0.5">
                          <Star size={10} className="text-[#C9A84C] fill-[#C9A84C]" />
                          <span className="text-xs text-white/60">{p.rating}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Camera size={10} className="text-white/30" />
                          <span className="text-xs text-white/40">{p.hired} hired</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <MapPin size={10} className="text-white/30" />
                          <span className="text-xs text-white/40">{p.city}</span>
                        </div>
                      </div>
                    </div>
                    <button className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] text-xs font-semibold hover:bg-[#C9A84C]/20 transition-all">
                      Hire
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1 mt-3">
                    {p.photos.slice(0, 4).map((photo, i) => (
                      <div key={i} className="aspect-square rounded-md overflow-hidden bg-[#1a1a1a]">
                        <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
