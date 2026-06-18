import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'wouter'
import { ChevronLeft, MapPin, X, Clock, MoreHorizontal, RefreshCw } from 'lucide-react'
import Spinner from '@/components/Spinner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { img } from '@/lib/image'

type SpotStory = {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  location_name: string
  expires_at: string
  created_at: string
}

const STORY_DURATION = 6000
const DELETED_SENTINEL = '2000-01-01T00:00:00.000Z'

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function isActive(iso: string) {
  return new Date(iso).getTime() > Date.now()
}

function isDeleted(iso: string) {
  return iso === DELETED_SENTINEL
}

function isExpired(iso: string) {
  return !isActive(iso) && !isDeleted(iso)
}

// ─── Archive Story Viewer ─────────────────────────────────────────────────────
function ArchiveViewer({
  stories,
  startIndex,
  userId,
  onClose,
  onDelete,
}: {
  stories: SpotStory[]
  startIndex: number
  userId: string
  onClose: () => void
  onDelete: (id: string) => void
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

  useEffect(() => {
    document.body.classList.add('story-open')
    return () => { document.body.classList.remove('story-open') }
  }, [])

  useEffect(() => {
    if (!story) return
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
    }, STORY_DURATION)
  }, [index, stories.length, onClose])

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
    // Permanently delete from archive (user chose to remove it entirely)
    const { error } = await supabase.from('spot_stories').delete().eq('id', story.id)
    if (error) { toast.error('Could not delete'); return }
    onDelete(story.id)
    onClose()
  }

  const handleReshare = async () => {
    setShowMenu(false)
    // Check daily limit
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('spot_stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
    if ((count ?? 0) >= 5) { toast.error("Daily story limit reached (5)"); return }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('spot_stories').insert({
      user_id: userId,
      image_url: story.image_url,
      caption: story.caption,
      location_name: story.location_name,
      expires_at: expiresAt,
    })
    if (error) { toast.error('Could not reshare'); return }
    toast.success('Story reshared for another 24h!')
  }

  const deleted = isDeleted(story.expires_at)
  const expired = isExpired(story.expires_at)

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
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-[3px] px-3 pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 8px)' }}>
        {stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
            {i < index && <div className="h-full w-full bg-white rounded-full" />}
            {i === index && (
              <div
                key={barKey}
                className={`story-bar-fill h-full bg-white rounded-full${paused || !imgLoaded ? ' paused' : ''}`}
                style={{ animationDuration: `${STORY_DURATION}ms` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 pb-2 flex items-center justify-between pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 16px)' }}>
        <div className="flex items-center gap-2 pointer-events-auto">
          {deleted && (
            <div className="flex items-center gap-1 bg-black/60 rounded-full px-2.5 py-1">
              <X size={9} className="text-rose-400/80" />
              <span className="text-[10px] text-rose-400/80 font-medium">Deleted</span>
            </div>
          )}
          {expired && (
            <div className="flex items-center gap-1 bg-black/50 rounded-full px-2.5 py-1">
              <Clock size={10} className="text-white/60" />
              <span className="text-[10px] text-white/60 font-medium">Expired</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2.5 py-1">
            <MapPin size={9} className="text-gold/80" />
            <span className="text-[11px] text-white/70">{story.location_name}</span>
          </div>
          <span className="text-white/40 text-[11px]">{timeAgo(story.created_at)}</span>
        </div>

        <div className="flex items-center pointer-events-auto">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10"
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => { e.stopPropagation(); setShowMenu(true) }}
            onClick={() => setShowMenu(true)}
          >
            <MoreHorizontal size={20} className="text-white" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10"
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => { e.stopPropagation(); onClose() }}
            onClick={onClose}
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
          className="absolute inset-0 z-40"
          onTouchStart={e => e.stopPropagation()}
          onTouchEnd={e => { e.stopPropagation(); if (!confirmDelete) setShowMenu(false) }}
          onClick={() => { if (!confirmDelete) setShowMenu(false) }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-lenz-card rounded-t-[28px] px-5 pt-3 pb-10 animate-slide-up"
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-6" />
            {!confirmDelete ? (
              <div className="space-y-2">
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-white/5 transition-colors"
                  onTouchEnd={e => { e.stopPropagation(); handleReshare() }}
                  onClick={handleReshare}
                >
                  <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
                    <RefreshCw size={16} className="text-gold" />
                  </div>
                  <div className="text-left">
                    <p className="text-gold font-semibold text-[15px]">Reshare Story</p>
                    <p className="text-white/30 text-xs mt-0.5">Post again for another 24 hours</p>
                  </div>
                </button>
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-white/5 transition-colors"
                  onTouchEnd={e => { e.stopPropagation(); setConfirmDelete(true) }}
                  onClick={() => setConfirmDelete(true)}
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                    <X size={16} className="text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-red-400 font-semibold text-[15px]">Delete Story</p>
                    <p className="text-white/30 text-xs mt-0.5">Remove permanently from your archive</p>
                  </div>
                </button>
                <button
                  className="w-full py-4 rounded-2xl bg-white/5 text-white/50 font-semibold text-[15px] active:bg-white/10"
                  onTouchEnd={e => { e.stopPropagation(); setShowMenu(false) }}
                  onClick={() => setShowMenu(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white font-bold text-[17px] text-center mb-1">Delete this story?</p>
                <p className="text-white/35 text-sm text-center mb-5">This cannot be undone.</p>
                <button
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-[15px] active:bg-red-600 transition-colors"
                  onTouchEnd={e => { e.stopPropagation(); handleDelete() }}
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
                <button
                  className="w-full py-4 rounded-2xl bg-white/6 text-white/55 font-semibold text-[15px] active:bg-white/10"
                  onTouchEnd={e => { e.stopPropagation(); setConfirmDelete(false) }}
                  onClick={() => setConfirmDelete(false)}
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

// ─── Story Archive Page ───────────────────────────────────────────────────────
export default function StoryArchive() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [stories, setStories] = useState<SpotStory[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const loadArchive = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('spot_stories')
      .select('id, user_id, image_url, caption, location_name, expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setStories((data ?? []) as SpotStory[])
    setLoading(false)
  }, [user])

  useEffect(() => { loadArchive() }, [loadArchive])

  const removeStory = (id: string) => {
    setStories(prev => prev.filter(s => s.id !== id))
  }

  const active = stories.filter(s => isActive(s.expires_at))
  const expired = stories.filter(s => isExpired(s.expires_at))
  const deleted = stories.filter(s => isDeleted(s.expires_at))

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none">
    <div className="min-h-full bg-lenz-bg pb-8">
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ChevronLeft size={22} className="text-white/70" />
        </button>
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">Story Archive</h2>
      </header>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="md" />
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-full bg-lenz-card flex items-center justify-center">
              <Clock size={28} className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm">No stories yet</p>
            <p className="text-white/20 text-xs text-center max-w-[220px]">Stories you post will appear here even after they expire</p>
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">Active ({active.length})</p>
                <div className="grid grid-cols-3 gap-[2px] rounded-2xl overflow-hidden">
                  {active.map((story, i) => (
                    <StoryTile
                      key={story.id}
                      story={story}
                      onOpen={() => setViewerIndex(i)}
                      state="active"
                    />
                  ))}
                </div>
              </section>
            )}

            {expired.length > 0 && (
              <section>
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">Expired ({expired.length})</p>
                <div className="grid grid-cols-3 gap-[2px] rounded-2xl overflow-hidden">
                  {expired.map((story, i) => (
                    <StoryTile
                      key={story.id}
                      story={story}
                      onOpen={() => setViewerIndex(active.length + i)}
                      state="expired"
                    />
                  ))}
                </div>
              </section>
            )}

            {deleted.length > 0 && (
              <section>
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase mb-3">Deleted ({deleted.length})</p>
                <div className="grid grid-cols-3 gap-[2px] rounded-2xl overflow-hidden">
                  {deleted.map((story, i) => (
                    <StoryTile
                      key={story.id}
                      story={story}
                      onOpen={() => setViewerIndex(active.length + expired.length + i)}
                      state="deleted"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {viewerIndex !== null && stories.length > 0 && (
        <ArchiveViewer
          stories={stories}
          startIndex={Math.min(viewerIndex, stories.length - 1)}
          userId={user?.id ?? ''}
          onClose={() => setViewerIndex(null)}
          onDelete={removeStory}
        />
      )}
    </div>
    </div>
  )
}

function StoryTile({
  story,
  onOpen,
  state,
}: {
  story: SpotStory
  onOpen: () => void
  state: 'active' | 'expired' | 'deleted'
}) {
  return (
    <button
      onClick={onOpen}
      className="relative aspect-square bg-lenz-card active:opacity-75 transition-opacity overflow-hidden"
    >
      <img
        src={img.thumb(story.image_url)}
        alt=""
        className={`w-full h-full object-cover ${state !== 'active' ? 'opacity-40' : ''}`}
        loading="lazy"
      />
      {state === 'expired' && (
        <div className="absolute top-1.5 left-1.5">
          <div className="flex items-center gap-0.5 bg-black/60 rounded-full px-1.5 py-0.5">
            <Clock size={8} className="text-white/60" />
            <span className="text-[8px] text-white/60">expired</span>
          </div>
        </div>
      )}
      {state === 'deleted' && (
        <div className="absolute top-1.5 left-1.5">
          <div className="flex items-center gap-0.5 bg-black/70 rounded-full px-1.5 py-0.5">
            <X size={8} className="text-rose-400/80" />
            <span className="text-[8px] text-rose-400/80">deleted</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1.5 pt-4">
        <p className="text-[8px] text-white/60 truncate">{story.location_name.split(/[,—]/)[0].trim()}</p>
        <p className="text-[7px] text-white/35">{timeAgo(story.created_at)}</p>
      </div>
    </button>
  )
}
