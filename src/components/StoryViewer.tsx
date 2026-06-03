import { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, X, MoreHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { img } from '@/lib/image'

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
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [barKey, setBarKey] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const story = stories[index]
  const isOwn = story?.user_id === userId

  useEffect(() => {
    document.body.classList.add('story-open')
    return () => { document.body.classList.remove('story-open') }
  }, [])

  useEffect(() => {
    if (!story) return
    onViewed(story.id)
    setImgLoaded(false)
    setShowMenu(false)
    setConfirmDelete(false)
    setBarKey(k => k + 1)
  }, [index, story?.id])

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

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    holdTimer.current = setTimeout(() => setPaused(true), 120)
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current

    if (paused) { setPaused(false); return }
    if (showMenu || confirmDelete) { setShowMenu(false); setConfirmDelete(false); return }
    if (Math.abs(dy) > 60 && dy < 0) { onClose(); return }

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

  const handleDelete = async () => {
    // Hard-delete the row and its storage file
    const { error } = await supabase.from('spot_stories').delete().eq('id', story.id)
    if (error) { toast.error('Could not delete'); return }
    // Best-effort: remove the storage object (ignore errors — public CDN cache clears on expiry)
    const path = story.image_url.split('/photos/')[1]
    if (path) supabase.storage.from('photos').remove([path])
    onDelete(story.id)
    if (index < stories.length - 1) setIndex(i => i + 1); else onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { if (holdTimer.current) clearTimeout(holdTimer.current); setPaused(false) }}
    >
      <img
        key={story.id}
        src={img.feed(story.image_url)}
        alt=""
        onLoad={() => setImgLoaded(true)}
        className={`story-image absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent via-50% to-black/70 pointer-events-none" />

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-[3px] px-3 pt-14 safe-top pointer-events-none">
        {stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
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

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-20 pb-2 flex items-center justify-between safe-top pointer-events-none">
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
              <span className="text-white/35 text-[11px]">· {timeAgo(story.created_at)}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={9} className="text-gold/80" />
              <p className="text-white/55 text-[11px]">{story.location_name}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center pointer-events-auto">
          {isOwn && (
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10"
              onTouchStart={e => e.stopPropagation()}
              onTouchEnd={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowMenu(true) }}
            >
              <MoreHorizontal size={20} className="text-white" />
            </button>
          )}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10"
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onClose() }}
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-14 pointer-events-none">
          <p className="text-white text-[14px] leading-snug drop-shadow-md">{story.caption}</p>
        </div>
      )}

      {showMenu && (
        <div
          className="fixed inset-0 z-[70]"
          onTouchStart={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); if (!confirmDelete) setShowMenu(false) }}
        >
          {/* Dimmed backdrop */}
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#111] rounded-t-[28px] px-5 pt-3 pb-8 safe-bottom animate-slide-up"
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />
            {!confirmDelete ? (
              <div className="space-y-2">
                <button
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl active:bg-white/5 transition-colors"
                  onTouchStart={e => e.stopPropagation()}
                  onTouchEnd={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                >
                  <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                    <X size={15} className="text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-red-400 font-semibold text-[15px]">Delete Story</p>
                    <p className="text-white/30 text-xs mt-0.5">Removes it immediately for everyone</p>
                  </div>
                </button>
                <button
                  className="w-full py-3.5 rounded-2xl bg-white/5 text-white/50 font-semibold text-[15px] active:bg-white/10"
                  onTouchStart={e => e.stopPropagation()}
                  onTouchEnd={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setShowMenu(false) }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-white font-bold text-[17px] text-center">Delete this spot?</p>
                <p className="text-white/35 text-sm text-center pb-3">It will be removed immediately for everyone.</p>
                <button
                  className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold text-[15px] active:bg-red-600 transition-colors"
                  onTouchStart={e => e.stopPropagation()}
                  onTouchEnd={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); handleDelete() }}
                >
                  Yes, Delete
                </button>
                <button
                  className="w-full py-3.5 rounded-2xl bg-white/6 text-white/55 font-semibold text-[15px] active:bg-white/10"
                  onTouchStart={e => e.stopPropagation()}
                  onTouchEnd={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
                >
                  Keep It
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
