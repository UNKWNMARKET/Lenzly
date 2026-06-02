import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, MapPin, X, MoreHorizontal } from 'lucide-react'
import { useLocation } from 'wouter'
import { photoSpots } from '@/data/mockData'
import SpotDetailModal from './SpotDetailModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { img } from '@/lib/image'
import { haptics } from '@/lib/haptics'
import type { PhotoSpot } from '@/data/mockData'

type SpotStory = {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  location_name: string
  expires_at: string
  created_at: string
  profiles?: { username: string; avatar_url: string | null; private_account?: boolean } | null
}

const STORY_DURATION = 6000 // ms per story

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h`
}

// ─── Story Viewer ────────────────────────────────────────────────────────────
function StoryViewer({
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
  // key forces progress bar CSS animation to restart on story change
  const [barKey, setBarKey] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const story = stories[index]
  const isOwn = story?.user_id === userId

  // Hide the bottom nav while the story viewer is open
  useEffect(() => {
    document.body.classList.add('story-open')
    return () => { document.body.classList.remove('story-open') }
  }, [])

  // Mark viewed + reset state whenever story changes
  useEffect(() => {
    if (!story) return
    onViewed(story.id)
    setImgLoaded(false)
    setShowMenu(false)
    setConfirmDelete(false)
    setBarKey(k => k + 1)
  }, [index, story?.id])

  // Auto-advance using a single timeout (no interval = no drift)
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

  // Touch: distinguish tap vs swipe vs hold
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
    if (Math.abs(dy) > 60 && dy < 0) { onClose(); return } // swipe up = close

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // tap — left 35% goes back, right 65% goes forward
      const x = e.changedTouches[0].clientX
      if (x < window.innerWidth * 0.35) {
        if (index > 0) setIndex(i => i - 1); else onClose()
      } else {
        if (index < stories.length - 1) setIndex(i => i + 1); else onClose()
      }
    }
  }

  const handleDelete = async () => {
    const { error } = await supabase.from('spot_stories').delete().eq('id', story.id)
    if (error) { toast.error('Could not delete'); return }
    onDelete(story.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { if (holdTimer.current) clearTimeout(holdTimer.current); setPaused(false) }}
    >
      {/* Photo — crossfade on load */}
      <img
        key={story.id}
        src={img.feed(story.image_url)}
        alt=""
        onLoad={() => setImgLoaded(true)}
        className={`story-image absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent via-50% to-black/70 pointer-events-none" />

      {/* ── Progress bars ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex gap-[3px] px-3 pt-14 safe-top pointer-events-none">
        {stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
            {i < index && (
              <div className="h-full w-full bg-white rounded-full" />
            )}
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

      {/* ── Header ── */}
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
              onTouchEnd={e => { e.stopPropagation(); setShowMenu(true) }}
            >
              <MoreHorizontal size={20} className="text-white" />
            </button>
          )}
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full active:bg-white/10"
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => { e.stopPropagation(); onClose() }}
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* ── Caption ── */}
      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-14 pointer-events-none">
          <p className="text-white text-[14px] leading-snug drop-shadow-md">{story.caption}</p>
        </div>
      )}

      {/* ── Delete bottom sheet ── */}
      {showMenu && (
        <div
          className="absolute inset-0 z-40"
          onTouchStart={e => e.stopPropagation()}
          onTouchEnd={e => { e.stopPropagation(); if (!confirmDelete) setShowMenu(false) }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-lenz-card rounded-t-[28px] px-5 pt-3 pb-10 animate-slide-up"
            onTouchStart={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-6" />

            {!confirmDelete ? (
              <div className="space-y-2">
                <button
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl active:bg-white/5 transition-colors"
                  onTouchEnd={e => { e.stopPropagation(); setConfirmDelete(true) }}
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
                    <X size={16} className="text-red-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-red-400 font-semibold text-[15px]">Delete Story</p>
                    <p className="text-white/30 text-xs mt-0.5">Removes it immediately for everyone</p>
                  </div>
                </button>
                <button
                  className="w-full py-4 rounded-2xl bg-white/5 text-white/50 font-semibold text-[15px] active:bg-white/10"
                  onTouchEnd={e => { e.stopPropagation(); setShowMenu(false) }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-white font-bold text-[17px] text-center mb-1">Delete this spot?</p>
                <p className="text-white/35 text-sm text-center mb-5">It will be removed for all viewers immediately.</p>
                <button
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-[15px] active:bg-red-600 transition-colors"
                  onTouchEnd={e => { e.stopPropagation(); handleDelete() }}
                >
                  Yes, Delete
                </button>
                <button
                  className="w-full py-4 rounded-2xl bg-white/6 text-white/55 font-semibold text-[15px] active:bg-white/10"
                  onTouchEnd={e => { e.stopPropagation(); setConfirmDelete(false) }}
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

// ─── StoriesBar ───────────────────────────────────────────────────────────────
export default function StoriesBar() {
  const [selected, setSelected] = useState<PhotoSpot | null>(null)
  const [storyIndex, setStoryIndex] = useState<number | null>(null)
  const [spotStories, setSpotStories] = useState<SpotStory[]>([])
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())
  const [, navigate] = useLocation()
  const { user } = useAuth()

  const loadStories = useCallback(async () => {
    if (!user) return

    const { data: followData } = await supabase
      .from('follows').select('following_id').eq('follower_id', user.id)
    const followingIds = new Set((followData ?? []).map((f: any) => f.following_id))

    const { data, error } = await supabase
      .from('spot_stories').select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(30)

    if (error || !data || data.length === 0) return

    const posterIds = [...new Set(data.map((s: any) => s.user_id))]
    const { data: profileRows } = await supabase
      .from('profiles').select('id, username, avatar_url, private_account').in('id', posterIds)
    const profileMap = Object.fromEntries((profileRows ?? []).map((p: any) => [p.id, p]))

    // Hide stories from anyone in a block relationship with the viewer
    const { data: hiddenRows } = await supabase.rpc('hidden_user_ids')
    const hidden = new Set<string>((hiddenRows ?? []).map((r: any) => (typeof r === 'string' ? r : r.hidden_user_ids)))

    const visible = data
      .map((s: any) => ({ ...s, profiles: profileMap[s.user_id] ?? null }))
      .filter((s: any) => {
        if (s.user_id === user.id) return true
        if (hidden.has(s.user_id)) return false
        if (!s.profiles?.private_account) return true
        return followingIds.has(s.user_id)
      })

    setSpotStories(visible as SpotStory[])
  }, [user])

  useEffect(() => {
    loadStories()
    const stored = localStorage.getItem('viewed_spots')
    if (stored) { try { setViewedIds(new Set(JSON.parse(stored))) } catch {} }
    const ch = supabase.channel('spot_stories_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spot_stories' }, loadStories)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadStories])

  const markViewed = (id: string) => {
    setViewedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem('viewed_spots', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const removeStory = (id: string) => setSpotStories(prev => prev.filter(s => s.id !== id))

  const myStory = spotStories.find(s => s.user_id === user?.id)
  const othersStories = spotStories.filter(s => s.user_id !== user?.id)
  const allViewable = myStory ? [myStory, ...othersStories] : othersStories

  const ring = (unseen: boolean) => unseen
    ? 'p-[2.5px] rounded-full bg-gradient-to-tr from-gold via-yellow-300 to-amber-200 shadow-[0_0_10px_2px_rgba(201,168,76,0.4)]'
    : 'p-[2.5px] rounded-full bg-white/10'

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
        {/* Your Spot */}
        <button
          onClick={() => { haptics.light(); myStory ? setStoryIndex(0) : navigate('/spot') }}
          className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-150"
        >
          {myStory ? (
            <div className={ring(!viewedIds.has(myStory.id))}>
              <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                <img src={img.thumb(myStory.image_url)} className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="w-[63px] h-[63px] rounded-full border-[1.5px] border-dashed border-gold/30 bg-lenz-card/50 flex items-center justify-center">
              <Plus size={20} className="text-gold/50" />
            </div>
          )}
          <span className="text-[10px] text-white/30 tracking-wide">Your Spot</span>
        </button>

        {/* Others */}
        {othersStories.map((story, i) => {
          const unseen = !viewedIds.has(story.id)
          const idx = myStory ? i + 1 : i
          return (
            <button
              key={story.id}
              onClick={() => { haptics.light(); setStoryIndex(idx) }}
              className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-150"
            >
              <div className={ring(unseen)}>
                <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                  <img src={img.thumb(story.image_url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
              <span className="text-[10px] text-white/35 w-16 text-center truncate leading-tight">
                {story.location_name.split(/[,—]/)[0].trim()}
              </span>
            </button>
          )
        })}

        {/* AI spots */}
        {photoSpots.map((spot, i) => (
          <button
            key={spot.id}
            onClick={() => setSelected(spot)}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-150"
          >
            <div className={i < 3 ? 'story-ring' : 'story-ring-seen'}>
              <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                <img src={img.thumb(spot.image)} alt={spot.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            {spot.aiDiscovered && (
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] text-gold font-medium tracking-widest uppercase">AI</span>
                <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
              </div>
            )}
            <span className="text-[10px] text-white/35 w-16 text-center truncate leading-tight">
              {spot.name.split(' ').slice(0, 2).join(' ')}
            </span>
          </button>
        ))}
      </div>

      {selected && <SpotDetailModal spot={selected} onClose={() => setSelected(null)} />}

      {storyIndex !== null && allViewable.length > 0 && (
        <StoryViewer
          stories={allViewable}
          startIndex={Math.min(storyIndex, allViewable.length - 1)}
          userId={user?.id ?? ''}
          onClose={() => setStoryIndex(null)}
          onDelete={removeStory}
          onViewed={markViewed}
        />
      )}
    </>
  )
}
