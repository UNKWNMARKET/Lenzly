import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Post } from '../../lib/supabase'

const CATS = ['All', 'Portrait', 'Landscape', 'Street', 'Wedding', 'Commercial', 'Fashion', 'Travel', 'Nature']

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([])
  const [cat, setCat] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('posts')
      .select('id, user_id, image_url, caption, likes_count, category, created_at')
      .order('created_at', { ascending: false }).limit(48)
    if (cat !== 'All') q = q.eq('category', cat)
    // posts.user_id references auth.users (not profiles), so fetch profiles
    // separately and merge them client-side.
    q.then(async ({ data }) => {
      const postsData = (data ?? []) as any[]
      const userIds = [...new Set(postsData.map(p => p.user_id))]
      const { data: profilesData } = await supabase.from('profiles')
        .select('id, username, name, avatar_url, is_pro').in('id', userIds)
      const map: Record<string, any> = {}
      for (const pr of profilesData ?? []) map[pr.id] = pr
      setPosts(postsData.map(p => ({ ...p, profiles: map[p.user_id] ?? null })) as unknown as Post[])
      setLoading(false)
    })
  }, [cat])

  return (
    <div className="max-w-5xl mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center">
        <h1 className="text-lg font-bold text-white">Explore</h1>
      </header>
      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${cat === c ? 'bg-gold text-lenz-bg' : 'bg-lenz-card border border-lenz-border text-white/45 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="grid grid-cols-3 gap-1.5">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square rounded-lg bg-lenz-card animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5">
            {posts.map(p => (
              <Link key={p.id} to={`/app/post/${p.id}`} className="aspect-square rounded-lg overflow-hidden bg-lenz-card group relative">
                <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
