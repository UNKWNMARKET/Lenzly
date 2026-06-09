import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, MapPin, Bookmark, BookmarkCheck, ArrowRight, X, CheckCircle, Users } from 'lucide-react'
import { supabase, type Profile } from '../../lib/supabase'
import { useShortlist } from '../../hooks/useBusiness'
import { formatCount } from '../../lib/utils'

const SPECIALTIES = ['Portrait', 'Wedding', 'Landscape', 'Street', 'Commercial', 'Fashion', 'Travel', 'Nature', 'Event', 'Editorial', 'Product', 'Architecture']

export default function BusinessDiscover() {
  const { has, toggle } = useShortlist()
  const [photographers, setPhotographers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specs, setSpecs] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('profiles')
      .select('id, username, name, avatar_url, cover_url, bio, specialty, location, is_pro, available, second_shooter, price_range, followers_count, following_count, posts_count, created_at, website')
      .eq('is_pro', true).order('followers_count', { ascending: false }).limit(40)
    if (availableOnly) q = q.eq('available', true)
    if (location) q = q.ilike('location', `%${location}%`)
    if (search) q = q.or(`name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`)
    const { data } = await q
    let res = (data ?? []) as Profile[]
    if (specs.length) res = res.filter(p => specs.some(s => (p.specialty ?? []).includes(s)))
    setPhotographers(res); setLoading(false)
  }, [search, specs, location, availableOnly])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const toggleSpec = (s: string) => setSpecs(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  const activeFilters = specs.length + (location ? 1 : 0) + (availableOnly ? 1 : 0)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <p className="section-label mb-2">Discover</p>
        <h1 className="text-3xl font-serif text-white mb-2">Find your photographer.</h1>
        <p className="text-sm text-white/40">Browse {photographers.length} verified professionals from the Lenzly community.</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, style, or keyword…"
            className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40" />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showFilters || activeFilters ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-lenz-card border-lenz-border text-white/50 hover:text-white'}`}>
          <SlidersHorizontal size={15} /> Filters {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-gold text-lenz-bg text-[10px] font-black flex items-center justify-center">{activeFilters}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="card p-5 mb-6">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-3">Specialty</p>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALTIES.map(s => (
                  <button key={s} onClick={() => toggleSpec(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${specs.includes(s) ? 'bg-gold/15 border-gold/40 text-gold' : 'border-lenz-border text-white/40 hover:text-white/70'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-3">Location & Options</p>
              <div className="relative mb-3">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Any city…" className="w-full bg-lenz-bg border border-lenz-border rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-gold/40" />
              </div>
              <button onClick={() => setAvailableOnly(v => !v)} className={`flex items-center gap-2 text-sm transition-colors ${availableOnly ? 'text-white' : 'text-white/40'}`}>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${availableOnly ? 'bg-gold border-gold' : 'border-white/20'}`}>{availableOnly && <CheckCircle size={10} className="text-lenz-bg" />}</div>
                Available for hire only
              </button>
            </div>
          </div>
          {activeFilters > 0 && <button onClick={() => { setSpecs([]); setLocation(''); setAvailableOnly(false) }} className="mt-4 text-xs text-white/30 hover:text-white/60 flex items-center gap-1"><X size={12} /> Clear filters</button>}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}</div>
      ) : photographers.length === 0 ? (
        <div className="py-20 text-center"><Users size={28} className="text-white/15 mx-auto mb-3" /><p className="text-white/30 text-sm">No photographers match your filters</p></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photographers.map(p => (
            <div key={p.id} className="card-premium card-glow overflow-hidden group">
              <div className="relative h-24 bg-gradient-to-br from-lenz-card2 to-lenz-bg">
                {p.cover_url && <img src={p.cover_url} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <button onClick={() => toggle(p.id)} className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${has(p.id) ? 'bg-gold text-lenz-bg' : 'bg-black/40 text-white/60 border border-white/10 hover:text-white'}`}>
                  {has(p.id) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                </button>
                {p.available && <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-green-950/70 border border-green-500/20 rounded-full px-2 py-0.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-[9px] font-semibold text-green-400">Available</span></div>}
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3 -mt-8 mb-3 relative">
                  <div className="w-13 h-13 w-[52px] h-[52px] rounded-xl border-2 border-lenz-bg overflow-hidden bg-lenz-card2 shrink-0">
                    {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gold/40 font-bold">{p.name?.[0]}</div>}
                  </div>
                  <div className="pt-8 min-w-0">
                    <div className="flex items-center gap-1"><h3 className="text-sm font-bold text-white truncate">{p.name}</h3>{p.is_pro && <span className="text-[7px] font-black text-lenz-bg bg-gold px-1 py-0.5 rounded-full shrink-0">PRO</span>}</div>
                    <p className="text-xs text-white/35 truncate">@{p.username}</p>
                  </div>
                </div>
                {p.bio && <p className="text-xs text-white/40 leading-relaxed mb-3 line-clamp-2">{p.bio}</p>}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(p.specialty ?? []).slice(0, 2).map(s => <span key={s} className="text-[10px] text-gold/70 bg-gold/8 border border-gold/12 px-2 py-0.5 rounded-full">{s}</span>)}
                  {p.location && <span className="flex items-center gap-0.5 text-[10px] text-white/30"><MapPin size={9} />{p.location}</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5 mb-3">
                  <span className="text-xs text-white/40">{formatCount(p.followers_count ?? 0)} followers</span>
                  {p.price_range && <span className="text-xs font-semibold text-gold">{p.price_range}</span>}
                </div>
                <Link to={`/business/photographer/${p.id}`} className="w-full py-2.5 rounded-xl bg-gold/10 border border-gold/15 text-gold text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-gold/18 transition-all">
                  View & Hire <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
