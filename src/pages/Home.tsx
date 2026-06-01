import { useEffect, useState, useCallback } from 'react'
import { Bell, MessageCircle } from 'lucide-react'
import { useLocation } from 'wouter'
import StoriesBar from '@/components/StoriesBar'
import PostCard from '@/components/PostCard'
import FeedPostCard, { type FeedPost } from '@/components/FeedPostCard'
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
  const [feedTab, setFeedTab] = useState<'foryou' | 'following'>('foryou')
  const [followingIds, setFollowingIds] = useState<string[]>([])

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data && data.length > 0) setRealPosts(data)
    setLoading(false)
  }, [])

  // Load who the current user follows
  useEffect(() => {
    if (!user) return
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .then(({ data }) => {
        if (data) setFollowingIds(data.map(f => f.following_id))
      })
  }, [user])

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
  const visiblePosts = feedTab === 'following'
    ? realPosts.filter(p => followingIds.includes(p.user_id))
    : realPosts
  const hasPosts = visiblePosts.length > 0

  return (
    <PullToRefreshWrapper {...ptr} className="h-[100dvh] bg-lenz-bg">
    <div className="min-h-full pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center justify-between safe-top">
        <div className="md:hidden">
          <h1 className="text-2xl font-bold tracking-[0.15em] gold-text">LENZLY</h1>
          <p className="text-[9px] text-white/20 tracking-[0.3em] uppercase mt-0.5">Photography Platform</p>
        </div>
        <div className="hidden md:block">
          <h1 className="text-lg font-bold tracking-wider text-white/70">Feed</h1>
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

      {/* Feed tabs: For You / Following */}
      <div className="flex border-b border-lenz-border">
        {(['foryou', 'following'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFeedTab(tab)}
            className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-colors relative ${
              feedTab === tab ? 'text-gold' : 'text-white/40'
            }`}
          >
            {tab === 'foryou' ? 'For You' : 'Following'}
            {feedTab === tab && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gold rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Business Banner */}
      <BusinessBanner />

      {/* Feed */}
      <div className="mt-1 md:grid md:grid-cols-2 md:gap-0">
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
          // Real posts from Supabase — full card with likes, comments, save, share
          visiblePosts.map(post => (
            <FeedPostCard
              key={post.id}
              post={toFeedPost(post)}
              currentUserId={user?.id ?? null}
              onDeleted={id => setRealPosts(prev => prev.filter(p => p.id !== id))}
            />
          ))
        ) : feedTab === 'following' ? (
          // Following tab with no followed posts yet
          <div className="text-center py-16 px-8">
            <p className="text-white/40 text-sm font-medium">No posts from people you follow yet</p>
            <p className="text-white/25 text-xs mt-2">Follow photographers to see their photos and locations here.</p>
            <button
              onClick={() => navigate('/find')}
              className="mt-4 text-gold text-xs font-semibold border border-gold/30 rounded-full px-4 py-2 hover:bg-gold/10 transition-colors"
            >
              Find photographers
            </button>
          </div>
        ) : (
          // Mock posts fallback (For You with no real posts)
          mockPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
    </PullToRefreshWrapper>
  )
}

// Map a Supabase Post (with joined `profiles`) onto the FeedPost shape that
// FeedPostCard expects (which uses singular `profile`).
function toFeedPost(post: Post): FeedPost {
  const p = (post as any).profiles
  return {
    id: post.id,
    user_id: post.user_id,
    image_url: post.image_url,
    caption: post.caption ?? null,
    location_name: post.location_name ?? null,
    tags: post.tags ?? [],
    likes_count: post.likes_count ?? 0,
    comments_count: post.comments_count ?? 0,
    category: (post as any).category ?? '',
    created_at: post.created_at,
    archived: (post as any).archived ?? false,
    profile: p
      ? { id: p.id, username: p.username ?? null, name: p.name ?? null, avatar_url: p.avatar_url ?? null, is_pro: p.is_pro ?? false }
      : null,
  }
}
