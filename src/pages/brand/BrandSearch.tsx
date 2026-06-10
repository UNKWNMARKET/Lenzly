import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Search, MapPin, Bookmark, BookmarkCheck, SlidersHorizontal, X, ChevronRight } from 'lucide-react'
import { useBrandAuth } from '@/contexts/BrandAuthContext'
import { toast } from 'sonner'

interface Photographer {
  id: string
  name: string
  username: string
  avatar_url: string | null
  bio: string | null
  specialty: string[]
  location: string | null
  price_range: string | null
  available: boolean
  followers_count: number
  posts_count: number
}

const SPECIALTIES = ['Portrait', 'Wedding', 'Commercial', 'Editorial', 'Fashion', 'Landscape', 'Sports', 'Product', 'Event', 'Street']

export default function BrandSearch() {
  const { api } = useBrandAuth()
  const [, navigate] = useLocation()
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [location, setLocation] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [loading, setLoading] = useState(false)
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Load current shortlist
  useEffect(() => {
    api('/shortlist').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setShortlisted(new Set(data.map((p: any) => p.id)))
    }).catch(() => {})
  }, [])

  const search = useCallback(async (q: string, spec: string, loc: string, avail: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      if (spec) params.set('specialty', spec)
      if (loc) params.set('location', loc)
      if (avail) params.set('available', 'true')
      const res = await api(`/photographers?${params}`)
      const data = await res.json()
      setPhotographers(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load photographers')
    }
    setLoading(false)
  }, [api])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query, specialty, location, availableOnly), 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, specialty, location, availableOnly, search])

  async function toggleShortlist(id: string) {
    const isIn = shortlisted.has(id)
    const next = new Set(shortlisted)
    if (isIn) {
      next.delete(id)
      await api(`/shortlist/${id}`, { method: 'DELETE' })
      toast.success('Removed from shortlist')
    } else {
      next.add(id)
      await api(`/shortlist/${id}`, { method: 'POST' })
      toast.success('Added to shortlist')
    }
    setShortlisted(next)
  }

  const activeFilters = [specialty, location, availableOnly ? 'Available only' : ''].filter(Boolean)

  return (
    <div className="min-h-screen bg-[#060606]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#060606]/95 backdrop-blur border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate('/brand-portal')} className="text-white/40 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-base font-bold text-white tracking-wide">Discover Photographers</h1>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Name, specialty, style…"
                className="w-full bg-[#141414] border border-[#222] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                showFilters || activeFilters.length > 0
                  ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]'
                  : 'bg-[#141414] border-[#222] text-white/50'
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#C9A84C] text-[#060606] text-[9px] font-bold flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-3 bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-4 space-y-4">
              <div>
                <p className="text-[10px] text-white/30 tracking-widest uppercase mb-2">Specialty</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map(s => (
                    <button
                      key={s}
                      onClick={() => setSpecialty(specialty === s ? '' : s)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        specialty === s
                          ? 'bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]'
                          : 'bg-[#141414] border-[#222] text-white/50 hover:border-[#C9A84C]/20'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-white/30 tracking-widest uppercase mb-2">Location</p>
                <div className="relative">
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City or state…"
                    className="w-full bg-[#141414] border border-[#222] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-white">Available for hire</span>
                <div
                  onClick={() => setAvailableOnly(v => !v)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${availableOnly ? 'bg-[#C9A84C]' : 'bg-white/15'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${availableOnly ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>
              {activeFilters.length > 0 && (
                <button
                  onClick={() => { setSpecialty(''); setLocation(''); setAvailableOnly(false) }}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300"
                >
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-[#C9A84C]/25 border-t-[#C9A84C] animate-spin" />
          </div>
        ) : photographers.length === 0 ? (
          <div className="text-center py-20">
            <Search size={32} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No photographers found</p>
            <p className="text-white/20 text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/30">{photographers.length} photographer{photographers.length !== 1 ? 's' : ''} found</p>
            {photographers.map(p => (
              <div key={p.id} className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-4 hover:border-[#C9A84C]/15 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 overflow-hidden shrink-0">
                    {p.avatar_url
                      ? <img src={p.avatar_url} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">{p.name?.[0] ?? '?'}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                      <span className="text-[9px] font-bold text-[#060606] bg-[#C9A84C] px-1.5 py-0.5 rounded-full">PRO</span>
                      {p.available && (
                        <span className="text-[9px] font-bold text-green-400 bg-green-950/30 border border-green-500/20 px-1.5 py-0.5 rounded-full">Available</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">@{p.username}</p>
                    {p.specialty?.length > 0 && (
                      <p className="text-xs text-[#C9A84C]/60 mt-1">{p.specialty.slice(0, 3).join(' · ')}</p>
                    )}
                    {p.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={10} className="text-white/25" />
                        <span className="text-xs text-white/35">{p.location}</span>
                      </div>
                    )}
                    {p.bio && <p className="text-xs text-white/40 mt-2 line-clamp-2">{p.bio}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[11px] text-white/30">{p.followers_count?.toLocaleString() ?? 0} followers</span>
                      <span className="text-[11px] text-white/30">{p.posts_count ?? 0} posts</span>
                      {p.price_range && <span className="text-[11px] text-[#C9A84C]/60">{p.price_range}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleShortlist(p.id)}
                      className={`p-2 rounded-xl transition-colors ${shortlisted.has(p.id) ? 'text-[#C9A84C] bg-[#C9A84C]/10' : 'text-white/25 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5'}`}
                    >
                      {shortlisted.has(p.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                    <button
                      onClick={() => navigate(`/brand-portal/hire/${p.id}`)}
                      className="text-[11px] font-bold text-[#060606] bg-[#C9A84C] px-3 py-1.5 rounded-lg hover:bg-[#C9A84C]/90 transition-colors whitespace-nowrap"
                    >
                      Hire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
