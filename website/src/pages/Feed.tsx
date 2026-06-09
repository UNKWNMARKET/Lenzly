import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MapPin, Download, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Post {
  id: string; image_url: string; caption: string | null; location_name: string | null
  likes_count: number; category: string; created_at: string; user_id: string
  profiles?: { id: string; name: string; username: string; avatar_url: string | null; is_pro: boolean }
}

const CATEGORIES = ['All', 'Landscape', 'Portrait', 'Street', 'Wedding', 'Commercial', 'Fashion']
const PAGE_SIZE = 12

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (cat: string, pg: number) => {
    setLoading(true)
    let q = supabase
      .from('posts')
      .select('id, image_url, caption, location_name, likes_count, category, created_at, user_id')
      .order('created_at', { ascending: false })
      .range(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE - 1)
    if (cat !== 'All') q = q.eq('category', cat)
    const { data } = await q
    // posts.user_id references auth.users (not profiles), so we fetch profiles
    // in a second query and merge them client-side.
    const postsData = (data ?? []) as any[]
    const userIds = [...new Set(postsData.map(p => p.user_id))]
    const { data: profilesData } = await supabase.from('profiles')
      .select('id, name, username, avatar_url, is_pro').in('id', userIds)
    const map: Record<string, any> = {}
    for (const pr of profilesData ?? []) map[pr.id] = pr
    const rows = postsData.map(p => ({ ...p, profiles: map[p.user_id] ?? null })) as unknown as Post[]
    if (pg === 0) setPosts(rows)
    else setPosts(prev => [...prev, ...rows])
    setHasMore(rows.length === PAGE_SIZE)
    setLoading(false)
  }, [])

  useEffect(() => { setPage(0); load(category, 0) }, [category])

  function loadMore() { const next = page + 1; setPage(next); load(category, next) }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-14">
          <p className="section-label mb-4">Community</p>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-3">Photography Feed</h1>
          <p className="text-sm text-white/35 max-w-sm mx-auto">Real work from real photographers on Lenzly</p>
        </motion.div>

        {/* Category filter */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex gap-2 overflow-x-auto pb-2 mb-10 justify-center flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                category === c
                  ? 'bg-[#ecc85c] text-[#0b0b0d] shadow-lg shadow-[#ecc85c]/20'
                  : 'bg-[#141417] border border-[#26262b] text-white/40 hover:border-[#ecc85c]/25 hover:text-white/70'
              }`}>
              {c}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        {loading && page === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-[#141417] animate-pulse border border-[#26262b]" style={{ animationDelay: `${i * 0.05}s` }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <Search size={32} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/25 text-sm">No posts found in this category</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-3"
              >
                {posts.filter(p => p.image_url && !brokenImgs.has(p.id)).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i < 12 ? i * 0.04 : 0 }}
                  >
                    <Link to={`/post/${p.id}`} className="group relative aspect-square rounded-2xl overflow-hidden bg-[#141417] block border border-[#26262b]">
                      <img src={p.image_url} alt="" onError={() => setBrokenImgs(prev => new Set(prev).add(p.id))} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {p.profiles?.avatar_url
                              ? <img src={p.profiles.avatar_url} className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0" />
                              : <div className="w-7 h-7 rounded-full bg-[#ecc85c]/20 border border-[#ecc85c]/30 flex items-center justify-center text-[10px] font-bold text-[#ecc85c] shrink-0">{p.profiles?.name?.[0]}</div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white font-semibold truncate">{p.profiles?.name}</p>
                            </div>
                            {p.profiles?.is_pro && <span className="text-[8px] font-black text-[#0b0b0d] bg-[#ecc85c] px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Heart size={11} className="text-white/50 fill-white/20" />
                              <span className="text-[10px] text-white/50">{p.likes_count?.toLocaleString()}</span>
                            </div>
                            {p.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin size={10} className="text-[#ecc85c]/60" />
                                <span className="text-[10px] text-white/45 truncate max-w-[90px]">{p.location_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
            {hasMore && (
              <div className="text-center mt-14">
                <button onClick={loadMore} disabled={loading} className="btn-outline text-sm px-10 py-3.5 disabled:opacity-40">
                  {loading ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="mt-24 text-center card-premium p-12">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ecc85c]/20 to-transparent" />
          <p className="section-label mb-4">Want to post your work?</p>
          <h3 className="text-2xl font-serif text-white mb-3">Join the community</h3>
          <p className="text-sm text-white/35 mb-8 max-w-sm mx-auto leading-relaxed">Download Lenzly free to share your photography, discover locations, and connect with clients.</p>
          <a href="https://apps.apple.com" className="btn-gold">
            <Download size={15} /> Download on the App Store
          </a>
        </motion.div>
      </div>
    </div>
  )
}
