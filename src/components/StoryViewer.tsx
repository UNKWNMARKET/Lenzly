import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, X, Trash2, Heart, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { img } from '@/lib/image'
import { haptics } from '@/lib/haptics'

export type SpotStory = {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  location_name: string
  expires_at: string
  created_at: string
  display_seconds?: number | null
  profiles?: { username: string; avatar_url: string | null; private_account?: boolean } | null
}

export const DELETED_SENTINEL = '2000-01-01T00:00:00.000Z'

function storyDuration(s: SpotStory) {
  return (s.display_seconds ?? 6) * 1000
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h`
}

export default function StoryViewer({
  stories,
  startIndex,
  userId,
  onClose,
  onDelete,
  onViewed,
}: {
  stories: SpotStory[]
  startIndex: number
  userId: string
  onClose: () => void
  onDelete: (id: string) => void
  onViewed: (id: string) => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [paused, setPaused] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [barKey, setBarKey] = useState(0)
  // Use JS viewport height to work around dvh not being supported in WKWebView
  const [vh, setVh] = useState(window.innerHeight)

  // Like state
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likeAnim, setLikeAnim] = useState(false)

  // Comment state
  const [commentText, setCommentText] = useState('')
  const [commentOpen, setCommentOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)

  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const story = stories[index]
  const isOwn = story?.user_id === userId

  // Keep vh in sync (orientation changes, keyboard)
  useEffect(() => {
    const update = () => setVh(window.innerHeight)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Hide bottom nav
  useEffect(() => {
    document.body.classList.add('story-open')
    return () => { document.body.classList.remove('story-open') }
  }, [])

  // Reset per-story state
  useEffect(() => {
    if (!story) return
    onViewed(story.id)
    setImgLoaded(false)
    setConfirmDelete(false)
    setCommentOpen(false)
    setCommentText('')
    setBarKey(k => k + 1)
  }, [index, story?.id])

  // Load like status
  useEffect(() => {
    if (!story || isOwn) return
    supabase
      .from('story_likes')
      .select('user_id', { count: 'exact' })
      .eq('story_id', story.id)
      .then(({ data, count }) => {
        setLikeCount(count ?? 0)
        setLiked((data ?? []).some((l: any) => l.user_id === userId))
      })
  }, [story?.id, userId, isOwn])

  // Pause while comment box is open
  useEffect(() => {
    if (commentOpen) {
      setPaused(true)
      setTimeout(() => commentInputRef.current?.focus(), 80)
    }
  }, [commentOpen])

  // Auto-advance
  const scheduleAdvance = useCallback(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current)
    autoTimer.current = setTimeout(() => {
      if (index < stories.length - 1) setIndex(i => i + 1)
      else onClose()
    }, storyDuration(story))
  }, [index, stories.length, onClose, story])

  useEffect(() => {
    if (!paused && imgLoaded) scheduleAdvance()
    else if (autoTimer.current) clearTimeout(autoTimer.current)
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current) }
  }, [paused, imgLoaded, scheduleAdvance])

  if (!story) return null

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    holdTimer.current = setTimeout(() => setPaused(true), 120)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    if (paused && !commentOpen) { setPaused(false); return }
    if (confirmDelete) { setConfirmDelete(false); return }

    // Swipe DOWN to close (matches Instagram/standard UX)
    if (dy > 80 && Math.abs(dx) < 50) { onClose(); return }

    if (Math.abs(dx) > 40 && Math.abs(dy) < 60) {
      if (dx < 0) {
        if (index < stories.length - 1) setIndex(i => i + 1); else onClose()
      } else {
        if (index > 0) setIndex(i => i - 1); else onClose()
      }
      return
    }

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const x = e.changedTouches[0].clientX
      if (x < window.innerWidth * 0.35) {
        if (index > 0) setIndex(i => i - 1); else onClose()
      } else {
        if (index < stories.length - 1) setIndex(i => i + 1); else onClose()
      }
    }
  }

  // Like / Unlike
  const handleLike = async () => {
    if (isOwn) return
    if (liked) {
      await supabase.from('story_likes').delete().eq('story_id', story.id).eq('user_id', userId)
      setLiked(false)
      setLikeCount(c => Math.max(0, c - 1))
    } else {
      await supabase.from('story_likes').insert({ story_id: story.id, user_id: userId })
      setLiked(true)
      setLikeCount(c => c + 1)
      setLikeAnim(true)
      setTimeout(() => setLikeAnim(false), 400)
      haptics.light?.()
      await supabase.from('notifications').insert({
        user_id: story.user_id,
        actor_id: userId,
        type: 'story_like',
        message: 'liked your story',
        read: false,
      })
    }
  }

  // Send comment
  const handleComment = async () => {
    const text = commentText.trim()
    if (!text || sending) return
    setSending(true)
    const { error } = await supabase.from('story_comments').insert({
      story_id: story.id,
      user_id: userId,
      text,
    })
    if (error) { toast.error('Could not send reply'); setSending(false); return }
    if (story.user_id !== userId) {
      await supabase.from('notifications').insert({
        user_id: story.user_id,
        actor_id: userId,
        type: 'story_comment',
        message: `replied to your story: "${text.length > 60 ? text.slice(0, 60) + '…' : text}"`,
        read: false,
      })
    }
    toast.success('Reply sent!')
    setCommentText('')
    setCommentOpen(false)
    setPaused(false)
    setSending(false)
  }

  // Delete own story
  const handleDelete = async () => {
    const { error } = await supabase.from('spot_stories').delete().eq('id', story.id)
    if (error) { toast.error('Could not delete'); return }
    const path = story.image_url.split('/photos/')[1]
    if (path) supabase.storage.from('photos').remove([path])
    onDelete(story.id)
    if (index < stories.length - 1) setIndex(i => i + 1); else onClose()
  }

  const stopTouch = (e: React.TouchEvent) => e.stopPropagation()

  return (
    // Use JS window.innerHeight so the container fills the real screen on WKWebView
    // regardless of dvh/vh support issues in Capacitor
    <div
      className="fixed top-0 left-0 w-full z-[60] bg-black select-none"
      style={{ height: vh }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { if (holdTimer.current) clearTimeout(holdTimer.current); if (!commentOpen) setPaused(false) }}
    >
      {/* Story image — fills container 100% */}
      <img
        key={story.id}
        src={img.feed(story.image_url)}
        alt=""
        onLoad={() => setImgLoaded(true)}
        className={`story-image absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent via-45% to-black/85 pointer-events-none" />

      {/* ── Top area: progress bars + header stacked, safe-top applied once ── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-2 safe-top">
        {/* Progress bars */}
        <div className="flex gap-[3px] pointer-events-none">
          {stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-[2px] bg-white/25 rounded-full overflow-hidden">
              {i < index && <div className="h-full w-full bg-white rounded-full" />}
              {i === index && (
                <div
                  key={barKey}
                  className={`story-bar-fill h-full bg-white rounded-full${paused || !imgLoaded ? ' paused' : ''}`}
                  style={{ animationDuration: `${storyDuration(story)}ms` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Header: avatar + actions ── */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-8 safe-top pb-2 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/25 bg-lenz-card shrink-0">
            {story.profiles?.avatar_url
              ? <img src={img.avatar(story.profiles.avatar_url)} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white/60 font-bold text-sm">
                  {story.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white text-[13px] font-semibold leading-none">
                {story.profiles?.username ? `@${story.profiles.username}` : ''}
              </p>
              <span className="text-white/40 text-[11px]">· {timeAgo(story.created_at)}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={9} className="text-gold/80" />
              <p className="text-white/55 text-[11px]">{story.location_name}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          {/* Delete button — only on own stories, one tap opens confirm */}
          {isOwn && (
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10"
              onTouchStart={stopTouch}
              onTouchEnd={stopTouch}
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); setPaused(true) }}
            >
              <Trash2 size={18} className="text-white/80" />
            </button>
          )}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10"
            onTouchStart={stopTouch}
            onTouchEnd={stopTouch}
            onClick={e => { e.stopPropagation(); onClose() }}
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* ── Caption ── */}
      {story.caption && (
        <div className="absolute bottom-32 left-0 right-0 z-20 px-5 pointer-events-none">
          <p className="text-white text-[14px] leading-snug drop-shadow-md">{story.caption}</p>
        </div>
      )}

      {/* ── Bottom: heart + comment (other people's stories only) ── */}
      {!isOwn && (
        <div
          className="absolute bottom-0 left-0 right-0 z-40 px-4"
          style={{ paddingBottom: `max(env(safe-area-inset-bottom, 16px), 20px)` }}
          onTouchStart={stopTouch}
          onTouchEnd={stopTouch}
          onClick={e => e.stopPropagation()}
        >
          {commentOpen ? (
            <div className="flex items-center gap-2">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Reply to story…"
                maxLength={500}
                onKeyDown={e => { if (e.key === 'Enter') handleComment() }}
                className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-3 text-[14px] text-white placeholder-white/50 outline-none focus:border-white/60"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim() || sending}
                className="w-11 h-11 rounded-full bg-gold flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-90 transition-transform"
              >
                <Send size={16} className="text-lenz-bg" />
              </button>
              <button
                onClick={() => { setCommentOpen(false); setPaused(false) }}
                className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 active:bg-white/30"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCommentOpen(true)}
                className="flex-1 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-3 text-left active:bg-white/25 transition-colors"
              >
                <span className="text-white/75 text-[14px]">Reply to story…</span>
              </button>
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-1 active:scale-90 transition-transform min-w-[44px]"
              >
                <div className={`transition-transform duration-200 ${likeAnim ? 'scale-150' : 'scale-100'}`}>
                  <Heart
                    size={30}
                    className={liked ? 'fill-rose-500 text-rose-500' : 'text-white drop-shadow-md'}
                    strokeWidth={liked ? 0 : 2}
                  />
                </div>
                {likeCount > 0 && (
                  <span className="text-white text-[11px] font-bold leading-none drop-shadow-md">{likeCount}</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Delete confirmation overlay ── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[70] flex items-end"
          onTouchStart={stopTouch}
          onTouchEnd={stopTouch}
          onClick={e => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => { setConfirmDelete(false); setPaused(false) }} />
          <div className="relative w-full bg-[#111] rounded-t-[28px] px-5 pt-4 pb-10 safe-bottom animate-slide-up">
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />
            <p className="text-white font-bold text-[17px] text-center mb-1">Delete this story?</p>
            <p className="text-white/35 text-sm text-center mb-5">It will be removed immediately for everyone.</p>
            <div className="space-y-2.5">
              <button
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-[15px] active:bg-red-600 transition-colors"
                onTouchStart={stopTouch}
                onTouchEnd={stopTouch}
                onClick={e => { e.stopPropagation(); handleDelete() }}
              >
                Yes, Delete
              </button>
              <button
                className="w-full py-4 rounded-2xl bg-white/8 text-white/55 font-semibold text-[15px] active:bg-white/15"
                onTouchStart={stopTouch}
                onTouchEnd={stopTouch}
                onClick={e => { e.stopPropagation(); setConfirmDelete(false); setPaused(false) }}
              >
                Keep It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
