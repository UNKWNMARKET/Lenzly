import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Post {
  id: string
  image_url: string
  caption: string | null
  location_name: string | null
  likes_count: number
  category: string
  created_at: string
  user_id: string
  profiles?: { id: string; name: string; username: string; avatar_url: string | null; is_pro: boolean }
}

const CATEGORIES = ['All', 'Landscape', 'Portrait', 'Street', 'Wedding', 'Commercial', 'Fashion']


export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 12

  const load = useCallback(async (cat: string, pg: number) => {
    setLoading(true)
    let q = supabase
      .from('posts')
      .select('id, image_url, caption, location_name, likes_count, category, created_at, user_id, profiles:user_id(id, name, username, avatar_url, is_pro)')
      .order('created_at', { ascending: false })
      .range(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE - 1)
    if (cat !== 'All') q = q.eq('category', cat)
    const { data } = await q
    const rows = (data ?? []) as unknown as Post[]
    if (pg === 0) setPosts(rows)
    else setPosts(prev => [...prev, ...rows])
    setHasMore(rows.length === PAGE_SIZE)
    setLoading(false)
  }, [])

  useEffect(() => {
    setPage(0)
    load(category, 0)
  }, [category])

  function loadMore() {
    const next = page + 1
    setPage(next)
    load(category, next)
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#C9A84C] tracking-[0.3em] uppercase mb-3">Community</p>
          <h1 className="text-4xl font-serif text-white mb-2">Photography Feed</h1>
          <p className="text-sm text-white/40">Real work from real photographers on Lenzly</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-center flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                category === c
                  ? 'bg-[#C9A84C] text-[#060606]'
                  : 'bg-[#0E0E0E] border border-[#1A1A1A] text-white/50 hover:border-[#C9A84C]/30 hover:text-white'
              }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading && page === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-[#0E0E0E] animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-white/30">No posts found</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {posts.map(p => (
                <Link key={p.id} to={`/post/${p.id}`} className="group relative aspect-square rounded-2xl overflow-hidden bg-[#0E0E0E]">
                  <img src={p.image_url} alt={p.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {p.profiles?.avatar_url && <img src={p.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover border border-white/20" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{p.profiles?.name}</p>
                        </div>
                        {p.profiles?.is_pro && <span className="text-[8px] font-bold text-[#060606] bg-[#C9A84C] px-1.5 py-0.5 rounded-full">PRO</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Heart size={11} className="text-white/60" />
                          <span className="text-[10px] text-white/60">{p.likes_count}</span>
                        </div>
                        {p.location_name && (
                          <div className="flex items-center gap-1">
                            <MapPin size={10} className="text-[#C9A84C]/70" />
                            <span className="text-[10px] text-white/50 truncate max-w-[80px]">{p.location_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-10">
                <button onClick={loadMore} disabled={loading}
                  className="btn-outline text-sm px-8 py-3 disabled:opacity-40">
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}

        {/* App CTA */}
        <div className="mt-20 text-center card p-10">
          <p className="text-xs font-semibold text-[#C9A84C] tracking-[0.3em] uppercase mb-3">Want to post your work?</p>
          <h3 className="text-2xl font-serif text-white mb-3">Join the community</h3>
          <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">Download Lenzly free to share your photography, discover locations, and connect with clients.</p>
          <a href="https://apps.apple.com" className="btn-gold">
            <Download size={15} />
            Download on the App Store
          </a>
        </div>
      </div>
    </div>
  )
}
