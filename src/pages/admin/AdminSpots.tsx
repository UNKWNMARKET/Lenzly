import { useEffect, useState } from 'react'
import { MapPin, Search, RefreshCw, Trash2, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AdminSpot {
  id: string
  image_url: string
  caption: string | null
  location_name: string
  expires_at: string
  created_at: string
  profiles?: { name: string | null; username: string | null } | null
}

function timeLeft(expires: string): string {
  const ms = new Date(expires).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3_600_000)
  if (h >= 1) return `${h}h left`
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`
}

export default function AdminSpots() {
  const [q, setQ] = useState('')
  const [spots, setSpots] = useState<AdminSpot[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('spot_stories')
      .select('id, image_url, caption, location_name, expires_at, created_at, profiles(name, username)')
      .order('created_at', { ascending: false })
      .limit(150)
    if (error) toast.error('Could not load spots')
    else setSpots((data as unknown as AdminSpot[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function removeSpot(id: string) {
    if (!confirm('Delete this spot story?')) return
    const prev = spots
    setSpots(s => s.filter(x => x.id !== id))
    const { error } = await supabase.from('spot_stories').delete().eq('id', id)
    if (error) {
      setSpots(prev)
      toast.error('Delete blocked — run admin_moderation.sql to enable')
    } else {
      toast.success('Spot deleted')
    }
  }

  const term = q.trim().toLowerCase()
  const filtered = !term ? spots : spots.filter(s =>
    s.location_name.toLowerCase().includes(term) ||
    (s.caption ?? '').toLowerCase().includes(term) ||
    (s.profiles?.name ?? '').toLowerCase().includes(term)
  )

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Photo Spots</h1>
          <p className="text-xs text-white/40 mt-0.5">{spots.length} active spot stories</p>
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
          placeholder="Search spots…"
          className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/30 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No active spots</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 flex items-center gap-3">
              <img src={s.image_url} alt={s.location_name} loading="lazy" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-white/5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{s.location_name}</p>
                <p className="text-xs text-white/40 truncate">
                  by {s.profiles?.name ?? s.profiles?.username ?? 'Unknown'}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-white/30 flex items-center gap-0.5">
                    <MapPin size={9} /> {new Date(s.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] text-[#C9A84C] flex items-center gap-0.5">
                    <Clock size={9} /> {timeLeft(s.expires_at)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeSpot(s.id)}
                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-950/20 transition-all active:scale-90 shrink-0"
                title="Delete spot"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
