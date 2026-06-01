import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, MapPin, X, Trash2, MoreHorizontal } from 'lucide-react'
import { useLocation } from 'wouter'
import { photoSpots } from '@/data/mockData'
import SpotDetailModal from './SpotDetailModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`
  return `${h}h ago`
}

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
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const DURATION = 5000

  const story = stories[index]
  const isOwn = story?.user_id === userId

  useEffect(() => {
    if (story) onViewed(story.id)
  }, [story?.id])

  useEffect(() => {
    setProgress(0)
    setShowMenu(false)
    setConfirmDelete(false)
  }, [index])

  useEffect(() => {
    if (paused) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current!)
          if (index < stories.length - 1) setIndex(i => i + 1)
          else onClose()
          return 0
        }
        return p + (100 / (DURATION / 100))
      })
    }, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [index, paused, stories.length])

  const handleDelete = async () => {
    const { error } = await supabase.from('spot_stories').delete().eq('id', story.id)
    if (error) { toast.error('Could not delete story'); return }
    toast.success('Story deleted')
    onDelete(story.id)
    onClose()
  }

  const tapLeft = () => {
    if (showMenu || confirmDelete) { setShowMenu(false); setConfirmDelete(false); return }
    if (index > 0) { setIndex(i => i - 1) } else { onClose() }
  }
  const tapRight = () => {
    if (showMenu || confirmDelete) { setShowMenu(false); setConfirmDelete(false); return }
    if (index < stories.length - 1) { setIndex(i => i + 1) } else { onClose() }
  }

  if (!story) return null

  return (
    <div className="fixed inset-0 z-50 bg-black" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}>
      {/* Photo */}
      <img src={story.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-12">
        {stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2px] bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-16 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
            {story.profiles?.avatar_url
              ? <img src={story.profiles.avatar_url} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-lenz-card flex items-center justify-center text-white font-bold text-sm">
                  {story.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
          </div>
          <div>
            <p className="text-white text-[13px] font-bold leading-tight">
              {story.profiles?.username ? `@${story.profiles.username}` : 'Unknown'}
            </p>
            <p className="text-white/50 text-[11px]">{timeAgo(story.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isOwn && (
            <button
              className="w-10 h-10 flex items-center justify-center"
              onPointerDown={e => e.stopPropagation()}
              onPointerUp={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowMenu(m => !m); setConfirmDelete(false) }}
            >
              <MoreHorizontal size={22} className="text-white" />
            </button>
          )}
          <button
            className="w-10 h-10 flex items-center justify-center"
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onClose() }}
          >
            <X size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* Location pill */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-12 pointer-events-none">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <MapPin size={11} className="text-gold" />
            <p className="text-white text-xs font-semibold">{story.location_name}</p>
          </div>
        </div>
        {story.caption && (
          <p className="text-white text-sm leading-relaxed drop-shadow-lg">{story.caption}</p>
        )}
      </div>

      {/* Tap zones */}
      <div className="absolute inset-0 z-10 flex">
        <div className="flex-1" onClick={tapLeft} />
        <div className="flex-1" onClick={tapRight} />
      </div>

      {/* Own story menu */}
      {showMenu && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-lenz-card/95 backdrop-blur-xl rounded-t-3xl p-6 pb-10 space-y-3"
          onClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
        >
          {!confirmDelete ? (
            <>
              <p className="text-white/40 text-xs text-center font-semibold tracking-widest uppercase mb-4">Story Options</p>
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-red-500/10 active:bg-red-500/20 transition-colors"
              >
                <Trash2 size={18} className="text-red-400" />
                <span className="text-red-400 font-semibold">Delete Story</span>
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full py-4 rounded-2xl bg-white/5 text-white/60 font-semibold active:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <p className="text-white text-base font-bold text-center mb-1">Delete this story?</p>
              <p className="text-white/40 text-sm text-center mb-4">This cannot be undone.</p>
              <button
                onClick={handleDelete}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold active:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => { setConfirmDelete(false); setShowMenu(false) }}
                className="w-full py-4 rounded-2xl bg-white/5 text-white/60 font-semibold active:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

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

    const visible = data
      .map((s: any) => ({ ...s, profiles: profileMap[s.user_id] ?? null }))
      .filter((s: any) => {
        if (s.user_id === user.id) return true
        if (!s.profiles?.private_account) return true
        return followingIds.has(s.user_id)
      })

    setSpotStories(visible as SpotStory[])
  }, [user])

  useEffect(() => {
    loadStories()
    const stored = localStorage.getItem('viewed_spots')
    if (stored) setViewedIds(new Set(JSON.parse(stored)))
    const ch = supabase.channel('spot_stories_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spot_stories' }, loadStories)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadStories])

  const markViewed = (id: string) => {
    setViewedIds(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('viewed_spots', JSON.stringify([...next]))
      return next
    })
  }

  const removeStory = (id: string) => {
    setSpotStories(prev => prev.filter(s => s.id !== id))
  }

  // Own story first, then others
  const myStory = spotStories.find(s => s.user_id === user?.id)
  const othersStories = spotStories.filter(s => s.user_id !== user?.id)
  const allViewable = myStory ? [myStory, ...othersStories] : othersStories

  const ring = (seen: boolean) => seen
    ? 'p-[2.5px] rounded-full bg-white/20'
    : 'p-[2.5px] rounded-full bg-gradient-to-tr from-gold via-yellow-300 to-amber-200 shadow-[0_0_12px_3px_rgba(212,175,55,0.45)]'

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
        {/* Your spot */}
        <button
          onClick={() => {
            if (myStory) setStoryIndex(0)
            else navigate('/spot')
          }}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          {myStory ? (
            <div className={ring(viewedIds.has(myStory.id))}>
              <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                <img src={myStory.image_url} className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="w-[63px] h-[63px] rounded-full border-2 border-dashed border-gold/35 bg-lenz-card/60 flex items-center justify-center">
              <Plus size={22} className="text-gold/50" />
            </div>
          )}
          <span className="text-[10px] text-white/35 tracking-wide">Your Spot</span>
        </button>

        {/* Other users' stories */}
        {othersStories.map((story, i) => {
          const seen = viewedIds.has(story.id)
          const idx = myStory ? i + 1 : i
          return (
            <button key={story.id} onClick={() => setStoryIndex(idx)} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={ring(seen)}>
                <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                  <img src={story.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-[10px] text-white/40 w-16 text-center truncate">
                {story.location_name.split(/[,—]/)[0].trim()}
              </span>
            </button>
          )
        })}

        {/* AI photo spots */}
        {photoSpots.map((spot, i) => (
          <button key={spot.id} onClick={() => setSelected(spot)} className="flex flex-col items-center gap-1.5 shrink-0 group">
            <div className={i < 3 ? 'story-ring' : 'story-ring-seen'}>
              <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                <img src={spot.image} alt={spot.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
            </div>
            {spot.aiDiscovered && (
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] text-gold font-medium tracking-widest uppercase">AI</span>
                <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
              </div>
            )}
            <span className="text-[10px] text-white/40 w-16 text-center truncate">
              {spot.name.split(' ').slice(0, 2).join(' ')}
            </span>
          </button>
        ))}
      </div>

      {selected && <SpotDetailModal spot={selected} onClose={() => setSelected(null)} />}

      {storyIndex !== null && allViewable.length > 0 && (
        <StoryViewer
          stories={allViewable}
          startIndex={storyIndex}
          userId={user?.id ?? ''}
          onClose={() => setStoryIndex(null)}
          onDelete={removeStory}
          onViewed={markViewed}
        />
      )}
    </>
  )
}
