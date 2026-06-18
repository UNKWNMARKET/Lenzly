import { useEffect, useState } from 'react'
import { Search, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AdminProfile {
  id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  location: string | null
  specialty: string[] | null
  is_pro: boolean | null
  available: boolean | null
  followers_count: number | null
}

export default function AdminPhotographers() {
  const [q, setQ] = useState('')
  const [people, setPeople] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, location, specialty, is_pro, available, followers_count')
      .order('followers_count', { ascending: false, nullsFirst: false })
      .limit(200)
    if (error) toast.error('Could not load photographers')
    else setPeople((data as AdminProfile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const term = q.trim().toLowerCase()
  const filtered = !term ? people : people.filter(p =>
    (p.name ?? '').toLowerCase().includes(term) ||
    (p.username ?? '').toLowerCase().includes(term) ||
    (p.location ?? '').toLowerCase().includes(term) ||
    (p.specialty ?? []).some(s => s.toLowerCase().includes(term))
  )

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Photographers</h1>
          <p className="text-xs text-white/40 mt-0.5">{people.length} registered</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all active:scale-90">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
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

      {loading ? (
        <div className="text-center py-12 text-white/30 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No photographers found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-3">
              {p.avatar_url
                ? <img src={p.avatar_url} alt={p.name ?? ''} loading="lazy" className="w-12 h-12 rounded-full object-cover shrink-0 bg-white/5" />
                : <span className="w-12 h-12 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-white/40 text-sm font-bold uppercase">{(p.name ?? p.username ?? '?')[0]}</span>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-white truncate">{p.name ?? 'Unnamed'}</p>
                  {p.is_pro && (
                    <>
                      <CheckCircle size={12} className="text-[#C9A84C] shrink-0" fill="currentColor" />
                      <span className="text-[10px] bg-[#C9A84C]/15 text-[#C9A84C] px-1.5 py-0.5 rounded font-medium">PRO</span>
                    </>
                  )}
                </div>
                {p.username && <p className="text-xs text-white/40 truncate">@{p.username}</p>}
                {p.location && <p className="text-xs text-white/40 truncate">{p.location}</p>}
                {p.specialty && p.specialty.length > 0 && (
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {p.specialty.slice(0, 3).map(s => (
                      <span key={s} className="text-[10px] bg-white/5 text-white/50 px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-[10px] text-white/30">{(p.followers_count ?? 0).toLocaleString()} followers</p>
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
