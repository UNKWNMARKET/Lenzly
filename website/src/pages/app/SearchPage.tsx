import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, X } from 'lucide-react'
import { supabase, type Profile } from '../../lib/supabase'
import { formatCount } from '../../lib/utils'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (q.trim().length < 1) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles')
        .select('id, username, name, avatar_url, location, is_pro, followers_count')
        .or(`username.ilike.%${q}%,name.ilike.%${q}%`).limit(30)
      setResults((data ?? []) as Profile[]); setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center gap-3">
        <div className="flex-1 relative">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search photographers…"
            className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40" />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"><X size={15} /></button>}
        </div>
      </header>
      <div className="px-3 py-3">
        {loading && <p className="text-center text-white/30 text-sm py-8">Searching…</p>}
        {!loading && q && results.length === 0 && <p className="text-center text-white/30 text-sm py-8">No photographers found</p>}
        <div className="space-y-1">
          {results.map(p => (
            <Link key={p.id} to={`/app/u/${p.username}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-lenz-card2 border border-white/10 shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-gold/50 font-bold">{p.name?.[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                  {p.is_pro && <span className="text-[8px] font-black text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full">PRO</span>}
                </div>
                <p className="text-xs text-white/40">@{p.username}{p.location ? ` · ${p.location}` : ''}</p>
              </div>
              <span className="text-xs text-white/30">{formatCount(p.followers_count ?? 0)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
