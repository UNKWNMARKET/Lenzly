import { useEffect, useState } from 'react'
import { Search, Heart, MessageCircle, Trash2, RefreshCw, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AdminPost {
  id: string
  image_url: string
  caption: string | null
  location_name: string | null
  likes_count: number
  comments_count: number
  created_at: string
  archived?: boolean
  profiles?: { name: string | null; username: string | null; avatar_url: string | null } | null
}

export default function AdminPosts() {
  const [q, setQ] = useState('')
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('id, image_url, caption, location_name, likes_count, comments_count, created_at, archived, profiles(name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(150)
    if (error) toast.error('Could not load posts')
    else setPosts((data as unknown as AdminPost[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function removePost(id: string) {
    if (!confirm('Permanently delete this post? This cannot be undone.')) return
    const prev = posts
    setPosts(p => p.filter(x => x.id !== id))
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) {
      setPosts(prev)
      toast.error('Delete blocked — run admin_moderation.sql to enable')
    } else {
      toast.success('Post deleted')
    }
  }

  const term = q.trim().toLowerCase()
  const filtered = !term ? posts : posts.filter(p =>
    (p.profiles?.name ?? '').toLowerCase().includes(term) ||
    (p.profiles?.username ?? '').toLowerCase().includes(term) ||
    (p.caption ?? '').toLowerCase().includes(term) ||
    (p.location_name ?? '').toLowerCase().includes(term)
  )

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Posts</h1>
          <p className="text-xs text-white/40 mt-0.5">{posts.length} posts</p>
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
          placeholder="Search posts…"
          className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/30 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No posts found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
              <div className="flex gap-3 p-4">
                <img src={p.image_url} alt="" loading="lazy" className="w-20 h-20 rounded-xl object-cover shrink-0 bg-white/5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {p.profiles?.avatar_url
                      ? <img src={p.profiles.avatar_url} alt="" loading="lazy" className="w-5 h-5 rounded-full object-cover" />
                      : <span className="w-5 h-5 rounded-full bg-white/10" />}
                    <p className="text-xs font-semibold text-white truncate">{p.profiles?.name ?? p.profiles?.username ?? 'Unknown'}</p>
                    {p.archived && (
                      <span className="text-[10px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded ml-auto">Archived</span>
                    )}
                  </div>
                  {p.caption && <p className="text-xs text-white/50 mt-1 line-clamp-2">{p.caption}</p>}
                  {p.location_name && (
                    <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1"><MapPin size={9} /> {p.location_name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <Heart size={9} /> {(p.likes_count ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <MessageCircle size={9} /> {(p.comments_count ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/25">{new Date(p.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => removePost(p.id)}
                      className="ml-auto p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-950/20 transition-all active:scale-90"
                      title="Delete post"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
