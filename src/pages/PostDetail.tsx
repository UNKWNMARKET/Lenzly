import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useRoute } from 'wouter'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import FeedPostCard, { FeedPost } from '@/components/FeedPostCard'

export default function PostDetail() {
  const [, params] = useRoute('/post/:id')
  const [location, navigate] = useLocation()
  const { user } = useAuth()
  const goBack = () => window.history.length > 1 ? window.history.back() : navigate('/')
  const postId = params?.id

  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const targetRef = useRef<HTMLDivElement>(null)
  const scrolled = useRef(false)

  const load = useCallback(async () => {
    if (!postId) return

    // 1. Load the tapped post (no join — avoids embed errors)
    const { data: tapped } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle()

    if (!tapped) { setLoading(false); return }

    // 2. Load all of that user's posts so you can scroll through them like a feed
    const { data: ownerPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', tapped.user_id)
      .order('created_at', { ascending: false })

    const list = (ownerPosts && ownerPosts.length > 0 ? ownerPosts : [tapped])
      .filter(p => !p.archived)

    // 3. Load the author's profile once and attach to each
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url, is_pro')
      .eq('id', tapped.user_id)
      .maybeSingle()

    setPosts(list.map(p => ({ ...p, profile: prof ?? null })) as FeedPost[])
    setLoading(false)
  }, [postId])

  useEffect(() => { load() }, [load])

  // Scroll the tapped post into view once rendered
  useEffect(() => {
    if (!loading && !scrolled.current && targetRef.current) {
      scrolled.current = true
      targetRef.current.scrollIntoView({ block: 'start' })
    }
  }, [loading])

  if (loading) return (
    <div className="min-h-screen bg-lenz-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  )

  if (posts.length === 0) return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none">
    <div className="min-h-full bg-lenz-bg">
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={goBack} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-white/70" />
        </button>
        <span className="text-sm font-bold tracking-widest uppercase text-white">Photos</span>
      </header>
      <div className="flex items-center justify-center py-32">
        <p className="text-white/30 text-sm">Post not found</p>
      </div>
    </div>
    </div>
  )

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none">
    <div className="min-h-full bg-lenz-bg pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={goBack} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-white/70" />
        </button>
        <span className="text-sm font-bold tracking-widest uppercase text-white">Photos</span>
      </header>

      {/* Feed — every post is a full card with working buttons */}
      <div>
        {posts.map(post => (
          <div key={post.id} ref={post.id === postId ? targetRef : undefined} style={{ scrollMarginTop: 60 }}>
            <FeedPostCard
              post={post}
              currentUserId={user?.id ?? null}
              onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
            />
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}
