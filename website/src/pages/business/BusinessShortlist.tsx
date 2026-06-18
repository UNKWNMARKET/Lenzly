import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, MapPin, ArrowRight, X } from 'lucide-react'
import { supabase, type Profile } from '../../lib/supabase'
import { useShortlist } from '../../hooks/useBusiness'
import { formatCount } from '../../lib/utils'

export default function BusinessShortlist() {
  const { ids, toggle } = useShortlist()
  const [photographers, setPhotographers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ids.length) { setPhotographers([]); setLoading(false); return }
    supabase.from('profiles').select('*').in('id', ids).then(({ data }) => { setPhotographers((data ?? []) as Profile[]); setLoading(false) })
  }, [ids])

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6"><p className="section-label mb-2">Shortlist</p><h1 className="text-3xl font-serif text-white mb-2">Your shortlist.</h1><p className="text-sm text-white/40">{ids.length} photographer{ids.length !== 1 ? 's' : ''} saved for review.</p></div>
      {loading ? <p className="text-white/30 text-sm py-10 text-center">Loading…</p> :
        photographers.length === 0 ? (
          <div className="text-center py-24"><Bookmark size={32} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm mb-5">No photographers shortlisted yet</p><Link to="/business/discover" className="btn-gold inline-flex">Discover photographers</Link></div>
        ) : (
          <div className="space-y-3">
            {photographers.map(p => (
              <div key={p.id} className="card-premium card-glow p-4 flex items-center gap-4">
                <Link to={`/business/photographer/${p.id}`} className="w-16 h-16 rounded-xl overflow-hidden bg-lenz-card2 shrink-0">
                  {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gold/40 font-bold text-lg">{p.name?.[0]}</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><h3 className="text-sm font-bold text-white truncate">{p.name}</h3>{p.is_pro && <span className="text-[8px] font-black text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full">PRO</span>}</div>
                  <p className="text-xs text-white/35 mb-1">@{p.username}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(p.specialty ?? []).slice(0, 2).map(s => <span key={s} className="text-[10px] text-gold/70 bg-gold/8 px-2 py-0.5 rounded-full">{s}</span>)}
                    {p.location && <span className="flex items-center gap-0.5 text-[10px] text-white/30"><MapPin size={9} />{p.location}</span>}
                    <span className="text-[10px] text-white/30">{formatCount(p.followers_count ?? 0)} followers</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link to={`/business/photographer/${p.id}`} className="text-xs font-semibold text-gold flex items-center gap-1 hover:gap-1.5 transition-all">Hire <ArrowRight size={12} /></Link>
                  <button onClick={() => toggle(p.id)} className="text-xs text-white/30 hover:text-red-400 flex items-center gap-1"><X size={12} /> Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
