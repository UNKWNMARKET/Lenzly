import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'wouter'
import { Heart, MessageCircle, Send, Bookmark, MapPin, MoreVertical, Trash2, Archive, Flag, Download, Link, Share2, X, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import SharePostSheet from './SharePostSheet'
import ReportSheet from './ReportSheet'
import StoryViewer, { type SpotStory } from './StoryViewer'
import { img } from '@/lib/image'
import { haptics } from '@/lib/haptics'
import ZoomableImage from './ZoomableImage'

export type FeedPost = {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  location_name: string | null
  tags: string[]
  likes_count: number
  comments_count: number
  category: string
  created_at: string
  archived?: boolean
  profile: { id: string; username: string | null; name: string | null; avatar_url: string | null; is_pro: boolean } | null
}

type Comment = {
  id: string
  text: string
  created_at: string
  user_id: string
  profiles: { username: string | null; name: string | null; avatar_url: string | null } | null
}

type CommentLikeAnim = { id: string; key: number }

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function FeedPostCard({
  post, currentUserId, hasStory, onDeleted,
}: {
  post: FeedPost
  currentUserId: string | null
  hasStory?: boolean
  onDeleted?: (id: string) => void
}) {
  const [, navigate] = useLocation()
  const goToProfile = () => {
    if (post.user_id === currentUserId) navigate('/profile')
    else navigate(`/photographer/${post.user_id}`)
  }
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [saved, setSaved] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [heartAnim, setHeartAnim] = useState(false)
  const [doubleTapHeart, setDoubleTapHeart] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [profileStories, setProfileStories] = useState<SpotStory[] | null>(null)
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('viewed_spots') ?? '[]')) } catch { return new Set() }
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const lastTapRef = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [longPressOpen, setLongPressOpen] = useState(false)
  const [commentLikes, setCommentLikes] = useState<Set<string>>(new Set())
  const [commentLikeAnims, setCommentLikeAnims] = useState<CommentLikeAnim[]>([])

  const isOwner = currentUserId === post.user_id
  const profile = post.profile

  // Load the viewer's like/save state for this post
  useEffect(() => {
    if (!currentUserId) return
    let active = true
    ;(async () => {
      const [{ data: likeData }, { data: saveData }] = await Promise.all([
        supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle(),
        supabase.from('saved_posts').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle(),
      ])
      if (!active) return
      setLiked(!!likeData)
      setSaved(!!saveData)
    })()
    return () => { active = false }
  }, [post.id, currentUserId])

  const triggerLike = useCallback(async (forceOn = false) => {
    if (!currentUserId) { toast.error('Sign in to like posts'); return }
    const next = forceOn ? true : !liked
    if (forceOn && liked) return
    setLiked(next)
    setLikesCount(c => next ? c + 1 : Math.max(0, c - 1))
    setHeartAnim(true)
    setTimeout(() => setHeartAnim(false), 450)
    haptics.light()
    if (next) {
      const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setLiked(!next); setLikesCount(c => next ? c - 1 : c + 1); toast.error('Could not like post'); return }
      // Notify post owner (not self-likes)
      if (post.user_id !== currentUserId) {
        supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: currentUserId,
          type: 'like',
          post_id: post.id,
          read: false,
        })
      }
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
    }
  }, [currentUserId, liked, post.id, post.user_id])

  const toggleLike = () => triggerLike()

  const handleImageTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      // double-tap
      triggerLike(true)
      setDoubleTapHeart(true)
      setTimeout(() => setDoubleTapHeart(false), 900)
    }
    lastTapRef.current = now
  }

  const toggleSave = async () => {
    if (!currentUserId) { toast.error('Sign in to save posts'); return }
    const next = !saved
    setSaved(next)
    haptics.medium()
    if (next) {
      const { error } = await supabase.from('saved_posts').insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setSaved(!next); toast.error('Could not save post'); return }
      toast.success('Saved')
    } else {
      await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      toast.success('Removed from saved')
    }
  }

  const openComments = async () => {
    setShowComments(true)
    // Fetch comments then profiles separately — avoids FK embed errors
    const { data: rows } = await supabase
      .from('comments')
      .select('id, text, created_at, user_id')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (!rows || rows.length === 0) {
      setComments([])
      setTimeout(() => inputRef.current?.focus(), 100)
      return
    }

    const userIds = [...new Set(rows.map(r => r.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url')
      .in('id', userIds)

    const profMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
    setComments(rows.map(r => ({ ...r, profiles: profMap[r.user_id] ?? null })) as unknown as Comment[])

    // Load which comments the current user has liked
    if (currentUserId && rows.length > 0) {
      const commentIds = rows.map(r => r.id)
      const { data: myLikes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', currentUserId)
        .in('comment_id', commentIds)
      if (myLikes) setCommentLikes(new Set(myLikes.map(l => l.comment_id)))
    }

    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const toggleCommentLike = async (commentId: string) => {
    if (!currentUserId) { toast.error('Sign in to like comments'); return }
    const isLiked = commentLikes.has(commentId)
    setCommentLikes(prev => {
      const next = new Set(prev)
      isLiked ? next.delete(commentId) : next.add(commentId)
      return next
    })
    haptics.light()
    if (!isLiked) {
      const key = Date.now()
      setCommentLikeAnims(prev => [...prev, { id: commentId, key }])
      setTimeout(() => setCommentLikeAnims(prev => prev.filter(a => a.key !== key)), 900)
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: currentUserId }).maybeSingle()
    } else {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUserId)
    }
  }

  const submitComment = async () => {
    if (!currentUserId) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setSubmitting(true)
    const text = commentText.trim()
    setCommentText('')

    // Insert comment (no join — avoids embed errors)
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: currentUserId, text })
      .select('id, text, created_at, user_id')
      .single()

    if (error) {
      toast.error('Could not post comment')
      setCommentText(text) // restore on failure
      setSubmitting(false)
      return
    }

    // Fetch the commenter's profile separately so we can show name/avatar
    const { data: prof } = await supabase
      .from('profiles')
      .select('username, name, avatar_url')
      .eq('id', currentUserId)
      .maybeSingle()

    // Notify post owner (not self-comments)
    if (post.user_id !== currentUserId) {
      supabase.from('notifications').insert({
        user_id: post.user_id,
        actor_id: currentUserId,
        type: 'comment',
        post_id: post.id,
        read: false,
      })
    }
    // comments_count on posts is maintained by the on_comment_insert DB
    // trigger — we only insert the comment and optimistically bump local state.
    setComments(prev => [...prev, { ...data, profiles: prof ?? null } as unknown as Comment])
    setCommentsCount(c => c + 1)
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!currentUserId) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('user_id', currentUserId)
    if (error) { toast.error('Could not delete'); return }
    toast.success('Post deleted')
    onDeleted?.(post.id)
  }

  const handleArchive = async () => {
    if (!currentUserId) return
    const { error } = await supabase.from('posts').update({ archived: true }).eq('id', post.id).eq('user_id', currentUserId)
    if (error) { toast.error('Could not archive'); return }
    toast.success('Post archived')
    onDeleted?.(post.id)
  }

  const handleLongPressStart = (e: React.TouchEvent) => {
    longPressTimer.current = setTimeout(() => {
      haptics.medium?.()
      setLongPressOpen(true)
    }, 500)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }

  const handleCopyLink = () => {
    const url = `https://lenzly.app/post/${post.id}`
    navigator.clipboard?.writeText(url).then(() => toast.success('Link copied'))
      .catch(() => toast.success(url))
    setLongPressOpen(false)
  }

  const handleSaveImage = async () => {
    try {
      const a = document.createElement('a')
      a.href = post.image_url
      a.download = `lenzly-${post.id}.jpg`
      a.target = '_blank'
      a.click()
      toast.success('Saving image…')
    } catch {
      toast.error('Could not save image')
    }
    setLongPressOpen(false)
  }

  const handleAvatarClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasStory) { goToProfile(); return }
    haptics.light()
    if (profileStories) { setStoryViewerOpen(true); return }
    const { data } = await supabase
      .from('spot_stories')
      .select('*, profiles:profiles(username, avatar_url)')
      .eq('user_id', post.user_id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
    if (data && data.length > 0) {
      setProfileStories(data as SpotStory[])
      setStoryViewerOpen(true)
    }
  }

  const markViewed = (id: string) => {
    setViewedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem('viewed_spots', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const storyUnseen = hasStory && profileStories
    ? profileStories.some(s => !viewedIds.has(s.id))
    : hasStory

  return (
    <article className="mx-3 my-3 bg-lenz-card rounded-3xl overflow-hidden border border-lenz-border/60 shadow-xl shadow-black/30" onClick={() => menuOpen && setMenuOpen(false)}>
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={handleAvatarClick}
          className={`shrink-0 rounded-full transition-transform active:scale-90 ${hasStory ? (storyUnseen ? 'p-[2.5px] bg-gradient-to-tr from-gold via-yellow-300 to-amber-200 shadow-[0_0_10px_2px_rgba(201,168,76,0.4)]' : 'p-[2.5px] bg-white/20') : ''}`}
        >
          <div className={`w-10 h-10 rounded-full overflow-hidden bg-lenz-bg shrink-0 ${hasStory ? 'border-2 border-lenz-bg' : 'border-2 border-lenz-border'}`}>
            {profile?.avatar_url
              ? <img src={img.avatar(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-sm">{(profile?.name || '?')[0].toUpperCase()}</div>
            }
          </div>
        </button>
        <button className="flex-1 min-w-0 text-left" onClick={e => { e.stopPropagation(); goToProfile() }}>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white truncate">{profile?.username || profile?.name || 'Photographer'}</p>
            {profile?.is_pro && <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
          </div>
          {post.location_name && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-gold shrink-0" />
              <p className="text-[11px] text-white/40 truncate">{post.location_name}</p>
            </div>
          )}
        </button>
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <MoreVertical size={17} className="text-white/50" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 w-44 bg-[#161616] border border-lenz-border rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-30">
              {isOwner ? (
                <>
                  <button onClick={e => { e.stopPropagation(); setMenuOpen(false); handleArchive() }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white/80 hover:bg-white/5 border-b border-lenz-border/50">
                    <Archive size={15} className="text-white/50" /> Archive
                  </button>
                  <button onClick={e => { e.stopPropagation(); setMenuOpen(false); handleDelete() }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/10">
                    <Trash2 size={15} className="text-red-400" /> Delete
                  </button>
                </>
              ) : (
                <button onClick={e => { e.stopPropagation(); setMenuOpen(false); setReportOpen(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/10">
                  <Flag size={15} className="text-red-400" /> Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image — double-tap to like, long-press for options */}
      <div
        className="mx-3 rounded-2xl overflow-hidden aspect-square bg-lenz-bg relative"
        onClick={handleImageTap}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchMove={handleLongPressEnd}
      >
        <ZoomableImage
          src={img.feed(post.image_url)}
          alt={post.caption ?? ''}
          className="w-full h-full"
        />
        {/* Double-tap heart burst */}
        {doubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart size={80} className="text-white fill-white drop-shadow-lg heart-burst" />
          </div>
        )}
      </div>

      {/* Long-press action sheet */}
      {longPressOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setLongPressOpen(false)}
        >
          <div
            className="w-full max-w-[430px] md:max-w-[600px] mx-auto pb-8 safe-bottom px-3"
            onClick={e => e.stopPropagation()}
          >
            {/* Post preview */}
            <div className="flex items-center gap-3 bg-lenz-card border border-lenz-border rounded-2xl px-4 py-3 mb-2">
              <img src={img.thumb(post.image_url)} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{profile?.username ?? 'Photographer'}</p>
                {post.caption && <p className="text-xs text-white/40 truncate">{post.caption}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-lenz-card border border-lenz-border rounded-2xl overflow-hidden mb-2">
              <button
                onClick={() => { toggleLike(); setLongPressOpen(false) }}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-lenz-border/50 active:bg-white/5"
              >
                <Heart size={20} className={liked ? 'text-red-500 fill-red-500' : 'text-white/70'} />
                <span className="text-sm font-medium text-white">{liked ? 'Unlike' : 'Like'}</span>
              </button>
              <button
                onClick={() => { toggleSave(); setLongPressOpen(false) }}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-lenz-border/50 active:bg-white/5"
              >
                <Bookmark size={20} className={saved ? 'text-gold fill-gold' : 'text-white/70'} />
                <span className="text-sm font-medium text-white">{saved ? 'Unsave' : 'Save'}</span>
              </button>
              <button
                onClick={() => { setShareOpen(true); setLongPressOpen(false) }}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-lenz-border/50 active:bg-white/5"
              >
                <Share2 size={20} className="text-white/70" />
                <span className="text-sm font-medium text-white">Share</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-lenz-border/50 active:bg-white/5"
              >
                <Link size={20} className="text-white/70" />
                <span className="text-sm font-medium text-white">Copy Link</span>
              </button>
              <button
                onClick={handleSaveImage}
                className={`w-full flex items-center gap-4 px-5 py-4 active:bg-white/5 ${isOwner ? 'border-b border-lenz-border/50' : ''}`}
              >
                <Download size={20} className="text-white/70" />
                <span className="text-sm font-medium text-white">Save Photo</span>
              </button>
              {isOwner ? (
                <>
                  <button
                    onClick={() => { handleArchive(); setLongPressOpen(false) }}
                    className="w-full flex items-center gap-4 px-5 py-4 border-b border-lenz-border/50 active:bg-white/5"
                  >
                    <Archive size={20} className="text-white/70" />
                    <span className="text-sm font-medium text-white">Archive</span>
                  </button>
                  <button
                    onClick={() => { handleDelete(); setLongPressOpen(false) }}
                    className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/5"
                  >
                    <Trash2 size={20} className="text-red-400" />
                    <span className="text-sm font-medium text-red-400">Delete</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setReportOpen(true); setLongPressOpen(false) }}
                  className="w-full flex items-center gap-4 px-5 py-4 active:bg-white/5"
                >
                  <Flag size={20} className="text-red-400" />
                  <span className="text-sm font-medium text-red-400">Report</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setLongPressOpen(false)}
              className="w-full py-4 bg-lenz-card border border-lenz-border rounded-2xl text-sm font-semibold text-white/60 active:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-5">
          <button onClick={toggleLike} className="flex items-center gap-1.5 group">
            <Heart size={24} className={`transition-colors duration-200 ${heartAnim ? 'heart-burst' : ''} ${liked ? 'text-red-500 fill-red-500' : 'text-white/70 group-hover:text-white'}`} />
            {likesCount > 0 && <span className="text-sm font-semibold text-white/80">{likesCount}</span>}
          </button>
          <button onClick={openComments} className="flex items-center gap-1.5 group active:scale-90 transition-transform">
            <MessageCircle size={23} className="text-white/70 group-hover:text-white transition-colors" />
            {commentsCount > 0 && <span className="text-sm font-semibold text-white/80">{commentsCount}</span>}
          </button>
          <button onClick={() => setShareOpen(true)} className="group active:scale-90 transition-transform">
            <Send size={22} className="text-white/70 group-hover:text-white transition-colors -rotate-12" />
          </button>
        </div>
        <button onClick={toggleSave} className="group active:scale-90 transition-transform">
          <Bookmark size={23} className={`transition-all duration-200 ${saved ? 'text-gold fill-gold' : 'text-white/70 group-hover:text-white'}`} />
        </button>
      </div>

      {/* Likes count */}
      {likesCount > 0 && (
        <p className="px-4 pt-2 text-sm font-bold text-white">{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</p>
      )}

      {/* Caption */}
      {post.caption && (
        <p className="px-4 pt-1.5 text-sm text-white leading-relaxed">
          <span className="font-bold">{profile?.username || profile?.name}</span>{' '}
          <span className="text-white/75">{post.caption}</span>
        </p>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <p className="px-4 pt-1 text-sm text-gold/60">{post.tags.join(' ')}</p>
      )}

      {/* View comments toggle */}
      {commentsCount > 0 && !showComments && (
        <button onClick={openComments} className="px-4 pt-1.5 text-sm text-white/30 active:text-white/60 transition-colors">
          View {commentsCount === 1 ? '1 comment' : `all ${commentsCount} comments`}
        </button>
      )}

      <p className="px-4 pt-1.5 pb-4 text-[10px] text-white/20 uppercase tracking-wider">{timeAgo(post.created_at)}</p>

      {/* Inline comments */}
      {showComments && (
        <div className="px-4 pb-4 -mt-1 space-y-3 border-t border-lenz-border/30 pt-3">
          {comments.length === 0 && (
            <p className="text-center text-xs text-white/25 py-2">No comments yet. Be the first!</p>
          )}
          {comments.map(c => {
            const isCommentLiked = commentLikes.has(c.id)
            const anim = commentLikeAnims.find(a => a.id === c.id)
            return (
              <div key={c.id} className="flex items-start gap-2.5">
                <button
                  className="w-7 h-7 rounded-full bg-lenz-bg border border-lenz-border overflow-hidden shrink-0 mt-0.5 active:opacity-70 transition-opacity"
                  onClick={() => c.user_id === currentUserId ? navigate('/profile') : navigate(`/photographer/${c.user_id}`)}
                >
                  {c.profiles?.avatar_url
                    ? <img src={img.avatar(c.profiles.avatar_url)} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/40 font-bold">{(c.profiles?.name || '?')[0].toUpperCase()}</div>}
                </button>
                <div className="flex-1 min-w-0 bg-white/4 rounded-2xl px-3 py-2">
                  <p className="text-sm text-white leading-relaxed">
                    <button
                      className="font-bold hover:text-gold transition-colors"
                      onClick={() => c.user_id === currentUserId ? navigate('/profile') : navigate(`/photographer/${c.user_id}`)}
                    >{c.profiles?.username || c.profiles?.name || 'User'}</button>{' '}
                    <span className="text-white/75">{c.text}</span>
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5">{timeAgo(c.created_at)}</p>
                </div>
                {/* Camera like button */}
                <div className="relative flex-shrink-0 self-center">
                  {anim && (
                    <div key={anim.key} className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none camera-float">
                      <Camera size={16} className="text-gold fill-gold drop-shadow-[0_0_6px_rgba(201,168,76,0.8)]" />
                    </div>
                  )}
                  <button
                    onClick={() => toggleCommentLike(c.id)}
                    className="p-1 active:scale-75 transition-transform"
                  >
                    <Camera
                      size={14}
                      className={`transition-all duration-200 ${isCommentLiked ? 'text-gold fill-gold' : 'text-white/25 hover:text-white/50'}`}
                    />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Comment input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Add a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              className="flex-1 bg-lenz-card border border-lenz-border rounded-full px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40"
            />
            {commentText.trim() && (
              <button onClick={submitComment} disabled={submitting} className="text-gold text-sm font-bold disabled:opacity-50 shrink-0">
                Post
              </button>
            )}
          </div>
        </div>
      )}
      {shareOpen && (
        <SharePostSheet
          postId={post.id}
          imageUrl={post.image_url}
          caption={post.caption}
          postAuthorId={post.user_id}
          locationName={post.location_name}
          onClose={() => setShareOpen(false)}
        />
      )}
      {reportOpen && (
        <ReportSheet targetType="post" targetId={post.id} onClose={() => setReportOpen(false)} />
      )}
      {storyViewerOpen && profileStories && profileStories.length > 0 && (
        <StoryViewer
          stories={profileStories}
          startIndex={0}
          userId={currentUserId ?? ''}
          onClose={() => setStoryViewerOpen(false)}
          onDelete={id => setProfileStories(prev => prev ? prev.filter(s => s.id !== id) : prev)}
          onViewed={markViewed}
        />
      )}
    </article>
  )
}
