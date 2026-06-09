import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Bell, MessageCircle, Search } from 'lucide-react'
import { supabase, type Post } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PostCard from '../../components/app/PostCard'

const PAGE = 8

export default function Feed() {
  const { user } = useAuth()
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
    <div className="max-w-[600px] mx-auto">
      {/* header */}
      <header className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="text-lg font-black tracking-[0.2em] gold-text md:hidden">LENZLY</span>
          <div className="hidden md:flex gap-1">
            {(['foryou', 'following'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === t ? 'bg-gold/12 text-gold' : 'text-white/40 hover:text-white'}`}>
                {t === 'foryou' ? 'For You' : 'Following'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Link to="/app/search" className="md:hidden p-2 text-white/60"><Search size={21} /></Link>
            <Link to="/app/notifications" className="p-2 text-white/60 hover:text-white"><Bell size={21} /></Link>
            <Link to="/app/messages" className="p-2 text-white/60 hover:text-white"><MessageCircle size={21} /></Link>
          </div>
        </div>
        {/* mobile tabs */}
        <div className="md:hidden flex border-t border-white/5">
          {(['foryou', 'following'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${tab === t ? 'text-gold border-gold' : 'text-white/40 border-transparent'}`}>
              {t === 'foryou' ? 'For You' : 'Following'}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 py-4 space-y-4">
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
