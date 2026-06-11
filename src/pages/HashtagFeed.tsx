import { useState, useEffect } from 'react'
import { useLocation, useParams } from 'wouter'
import { ArrowLeft, Hash, Image } from 'lucide-react'
import { supabase, Post } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import FeedPostCard from '@/components/FeedPostCard'
import type { FeedPost } from '@/components/FeedPostCard'

function toFeedPost(p: Post, profile: any): FeedPost {
  return {
    id: p.id,
    user_id: p.user_id,
    image_url: p.image_url,
    caption: p.caption,
    location_name: p.location_name,
    tags: p.tags ?? [],
    likes_count: p.likes_count,
    comments_count: p.comments_count,
    category: p.category,
    created_at: p.created_at,
    profile: profile ?? null,
  }
}

export default function HashtagFeed() {
  const { tag } = useParams<{ tag: string }>()
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const cleanTag = `#${tag?.replace(/^#/, '').toLowerCase()}`

  useEffect(() => {
    if (!tag) return
    setLoading(true)
    const rawTag = tag.replace(/^#/, '').toLowerCase()

    supabase
      .from('posts')
      .select('*')
      .contains('tags', [`#${rawTag}`])
      .order('created_at', { ascending: false })
      .limit(60)
      .then(async ({ data }) => {
        const list = (data as Post[]) ?? []
        if (!list.length) { setPosts([]); setLoading(false); return }

        const ids = [...new Set(list.map(p => p.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url, is_pro')
          .in('id', ids)
        const pm: Record<string, any> = {}
        for (const p of profiles ?? []) pm[p.id] = p

        setPosts(list.map(p => toFeedPost(p, pm[p.user_id])))
        setLoading(false)
      })
  }, [tag, user])

  return (
    <div className="min-h-screen bg-lenz-bg overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
      <header className="sticky top-0 z-20 glass border-b border-white/5 safe-top">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => navigate('/')} className="text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center">
              <Hash size={15} className="text-gold" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-[16px] leading-tight">{cleanTag}</h1>
              {!loading && <p className="text-[11px] text-white/35">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>}
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-3 gap-0.5 p-0.5 mt-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Image size={28} className="text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-white/40 text-sm font-medium">No posts yet</p>
            <p className="text-white/20 text-xs mt-1">Be the first to post with {cleanTag}</p>
          </div>
        </div>
      ) : (
        <div className="pb-28">
          {posts.map(post => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUserId={user?.id ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
