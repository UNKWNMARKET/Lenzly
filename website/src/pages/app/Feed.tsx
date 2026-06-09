import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, MessageCircle, Search, Clock } from 'lucide-react'
import { supabase, type Post } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PostCard from '../../components/app/PostCard'

const PAGE = 8

export default function Feed() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou')
  const [posts, setPosts] = useState<Post[]>([])
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const sentinel = useRef<HTMLDivElement>(null)

  const load = useCallback(async (pg: number, t: string) => {
    setLoading(true)
    let followingIds: string[] = []
    if (t === 'following' && user) {
      const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
      followingIds = (f ?? []).map(x => x.following_id)
      if (followingIds.length === 0) { setPosts([]); setHasMore(false); setLoading(false); return }
    }
    let q = supabase.from('posts')
      .select('id, user_id, image_url, caption, location_name, likes_count, comments_count, category, created_at, profiles:user_id(id, username, name, avatar_url, is_pro)')
      .order('created_at', { ascending: false })
      .range(pg * PAGE, (pg + 1) * PAGE - 1)
    if (t === 'following') q = q.in('user_id', followingIds)
    const { data } = await q
    const rows = (data ?? []) as unknown as Post[]
    setPosts(prev => pg === 0 ? rows : [...prev, ...rows])
    setHasMore(rows.length === PAGE)
    setLoading(false)
  }, [user])

  useEffect(() => { setPage(0); load(0, tab) }, [tab, load])

  // load liked/saved sets
  useEffect(() => {
    if (!user) return
    supabase.from('post_likes').select('post_id').eq('user_id', user.id).then(({ data }) => setLiked(new Set((data ?? []).map(x => x.post_id))))
    supabase.from('saved_posts').select('post_id').eq('user_id', user.id).then(({ data }) => setSaved(new Set((data ?? []).map(x => x.post_id))))
  }, [user])

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hasMore && !loading) {
        const next = page + 1; setPage(next); load(next, tab)
      }
    }, { rootMargin: '400px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [page, hasMore, loading, tab, load])

  return (
    <div className="max-w-[640px] mx-auto">
      {/* mobile header */}
      <header className="md:hidden sticky top-0 z-30 glass border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="text-lg font-black tracking-[0.2em] gold-text">LENZLY</span>
          <div className="flex items-center gap-1">
            <Link to="/app/search" className="p-2 text-white/60"><Search size={21} /></Link>
            <Link to="/app/notifications" className="p-2 text-white/60 hover:text-white"><Bell size={21} /></Link>
            <Link to="/app/messages" className="p-2 text-white/60 hover:text-white"><MessageCircle size={21} /></Link>
          </div>
        </div>
        <div className="flex border-t border-white/5">
          {(['foryou', 'following'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${tab === t ? 'text-gold border-gold' : 'text-white/40 border-transparent'}`}>
              {t === 'foryou' ? 'For You' : 'Following'}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 md:px-0 py-5 md:py-8 space-y-5">
        {/* Live feed dashboard hero (desktop) */}
        <div className="hidden md:block card p-6">
          {profile && (
            <p className="text-[11px] font-bold tracking-[0.28em] uppercase text-white/35 mb-2">
              Welcome back, {profile.name?.split(' ')[0]}
            </p>
          )}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="section-label mb-2">Live Feed</p>
              <h1 className="text-3xl font-serif text-white leading-tight">Newest photo posts appear first.</h1>
              <p className="text-sm text-white/45 mt-3 leading-relaxed max-w-md">
                Lenzly checks for fresh uploads continuously and moves the newest GPS-tagged photos to the top.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link to="/app/notifications"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-white/70 hover:text-white hover:border-gold/30 transition-all">
                <Bell size={16} /> Activity
              </Link>
              <Link to="/app/messages"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-sm font-medium text-white/70 hover:text-white hover:border-gold/30 transition-all">
                <Clock size={16} /> Messages
              </Link>
            </div>
          </div>
          {/* tabs */}
          <div className="inline-flex items-center gap-1 mt-6 bg-white/[0.04] border border-white/[0.06] rounded-full p-1">
            {(['foryou', 'following'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${tab === t ? 'bg-gold text-[#181203]' : 'text-white/45 hover:text-white'}`}>
                {t === 'foryou' ? 'For You' : 'Following'}
              </button>
            ))}
          </div>
        </div>

        {loading && posts.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-[480px] animate-pulse" />)
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/30 text-sm">{tab === 'following' ? 'Follow photographers to see their posts here' : 'No posts yet'}</p>
            {tab === 'following' && <Link to="/app/search" className="btn-gold mt-5 inline-flex">Find photographers</Link>}
          </div>
        ) : (
          posts.map(p => <PostCard key={p.id} post={p} liked={liked.has(p.id)} saved={saved.has(p.id)} />)
        )}
        <div ref={sentinel} className="h-10" />
        {loading && posts.length > 0 && <div className="flex justify-center py-4"><div className="w-6 h-6 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>}
      </div>
    </div>
  )
}
