import { useEffect, useState, useCallback } from 'react'
import { Bell, MessageCircle } from 'lucide-react'
import { useLocation } from 'wouter'
import StoriesBar from '@/components/StoriesBar'
import PostCard from '@/components/PostCard'
import BusinessBanner from '@/components/BusinessBanner'
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper'
import AppLogo from '@/components/AppLogo'
import { posts as mockPosts } from '@/data/mockData'
import { supabase, Post } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'

export default function Home() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [realPosts, setRealPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data && data.length > 0) setRealPosts(data)
    setLoading(false)
  }, [])

  const ptr = usePullToRefresh({ onRefresh: fetchPosts })

  useEffect(() => {
    fetchPosts()

    // Real-time subscription for new posts
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        setRealPosts(prev => [payload.new as Post, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Unread counts
  useEffect(() => {
    if (!user) return
    const fetchCounts = async () => {
      const { count: nc } = await supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('read', false)
      setUnreadNotifs(nc ?? 0)

      // Count conversations with messages newer than last_read_at
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)
      if (parts) {
        let unread = 0
        for (const p of parts) {
          const query = supabase.from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', p.conversation_id)
            .neq('sender_id', user.id)
          if (p.last_read_at) query.gt('sent_at', p.last_read_at)
          const { count } = await query
          if ((count ?? 0) > 0) unread++
        }
        setUnreadMsgs(unread)
      }
    }
    fetchCounts()

    const ch = supabase.channel('home_badges')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => setUnreadNotifs(n => n + 1))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchCounts())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user])

  // Use real posts if available, otherwise fall back to mock data
  const hasPosts = realPosts.length > 0

  return (
    <PullToRefreshWrapper {...ptr} className="h-[100dvh] bg-lenz-bg">
    <div className="min-h-full pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center justify-between safe-top">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.15em] gold-text">LENZLY</h1>
          <p className="text-[9px] text-white/20 tracking-[0.3em] uppercase mt-0.5">Photography Platform</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <Bell size={20} className="text-white/60" />
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full bg-gold border border-lenz-bg flex items-center justify-center text-[8px] font-bold text-lenz-bg px-0.5">
                {unreadNotifs > 9 ? '9+' : unreadNotifs}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/messages')} className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <MessageCircle size={20} className="text-white/60" />
            {unreadMsgs > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full bg-gold border border-lenz-bg flex items-center justify-center text-[8px] font-bold text-lenz-bg px-0.5">
                {unreadMsgs > 9 ? '9+' : unreadMsgs}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Stories / AI Spots */}
      <div className="border-b border-lenz-border">
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase">Photo Spots</span>
            <span className="text-[9px] bg-gold/10 text-gold border border-gold/20 px-1.5 py-0.5 rounded-full font-bold tracking-widest">AI POWERED</span>
          </div>
        </div>
        <StoriesBar />
      </div>

      {/* Business Banner */}
      <BusinessBanner />

      {/* Feed */}
      <div className="mt-1">
        {loading ? (
          // Skeleton loading
          [1, 2, 3].map(i => (
            <div key={i} className="p-4 border-b border-lenz-border animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-lenz-card" />
                <div className="space-y-1.5">
                  <div className="w-32 h-3 bg-lenz-card rounded" />
                  <div className="w-20 h-2 bg-lenz-card rounded" />
                </div>
              </div>
              <div className="aspect-square bg-lenz-card rounded-xl" />
            </div>
          ))
        ) : hasPosts ? (
          // Real posts from Supabase — render as simple cards
          realPosts.map(post => (
            <RealPostCard key={post.id} post={post} />
          ))
        ) : (
          // Mock posts fallback
          mockPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
    </PullToRefreshWrapper>
  )
}

function RealPostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes_count)

  const toggleLike = async () => {
    setLiked(!liked)
    setLikes(l => liked ? l - 1 : l + 1)
  }

  const profile = post.profiles
  const timeAgo = getTimeAgo(new Date(post.created_at))

  return (
    <div className="border-b border-lenz-border">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-lenz-card overflow-hidden border border-lenz-border">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-bold">
              {(profile?.name || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-white truncate">{profile?.name || 'Photographer'}</p>
            {profile?.is_pro && (
              <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>
            )}
          </div>
          {post.location_name && (
            <p className="text-xs text-white/40 truncate">📍 {post.location_name}</p>
          )}
        </div>
        <span className="text-xs text-white/25 shrink-0">{timeAgo}</span>
      </div>

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-lenz-card">
        <img src={post.image_url} alt={post.caption || ''} className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={toggleLike} className="flex items-center gap-1.5">
            <span className={`text-xl ${liked ? 'text-red-500' : 'text-white/50'}`}>{liked ? '❤️' : '🤍'}</span>
            <span className="text-sm text-white/50">{likes}</span>
          </button>
          <button className="flex items-center gap-1.5">
            <span className="text-xl text-white/50">💬</span>
            <span className="text-sm text-white/50">{post.comments_count}</span>
          </button>
        </div>
        {post.caption && (
          <p className="text-sm text-white/80 leading-relaxed">
            <span className="font-semibold text-white">{profile?.username || profile?.name}</span>{' '}
            {post.caption}
          </p>
        )}
        {post.tags && post.tags.length > 0 && (
          <p className="text-xs text-gold/60 mt-1">{post.tags.join(' ')}</p>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
