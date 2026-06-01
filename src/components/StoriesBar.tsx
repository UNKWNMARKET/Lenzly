import { useState, useEffect, useCallback } from 'react'
import { Plus, MapPin, X, Trash2 } from 'lucide-react'
import { useLocation } from 'wouter'
import { photoSpots } from '@/data/mockData'
import SpotDetailModal from './SpotDetailModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
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

function SpotStoryViewer({
  story,
  isOwn,
  onClose,
  onDelete,
  onViewed,
}: {
  story: SpotStory
  isOwn: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onViewed: (id: string) => void
}) {
  useEffect(() => { onViewed(story.id) }, [story.id])

  const handleDelete = async () => {
    await supabase.from('spot_stories').delete().eq('id', story.id)
    onDelete(story.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={onClose}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3">
        <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-[story-progress_5s_linear_forwards]" style={{ width: '0%' }} />
        </div>
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-lenz-card overflow-hidden border-2 border-gold/50">
            {story.profiles?.avatar_url
              ? <img src={story.profiles.avatar_url} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white/50 text-xs font-bold">
                  {story.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
          </div>
          <div>
            <p className="text-white text-xs font-bold">@{story.profiles?.username}</p>
            <div className="flex items-center gap-1">
              <MapPin size={9} className="text-gold" />
              <p className="text-gold/80 text-[10px] font-medium">{story.location_name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwn && (
            <button
              onClick={e => { e.stopPropagation(); handleDelete() }}
              className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      </div>

      <img
        src={story.image_url}
        alt={story.location_name}
        className="w-full h-full object-cover"
        onClick={e => e.stopPropagation()}
      />

      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-20 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white text-sm leading-relaxed">{story.caption}</p>
        </div>
      )}
    </div>
  )
}

export default function StoriesBar() {
  const [selected, setSelected] = useState<PhotoSpot | null>(null)
  const [activeStory, setActiveStory] = useState<SpotStory | null>(null)
  const [spotStories, setSpotStories] = useState<SpotStory[]>([])
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())
  const [, navigate] = useLocation()
  const { user } = useAuth()

  const loadStories = useCallback(async () => {
    if (!user) return

    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    const followingIds = new Set((followData ?? []).map((f: any) => f.following_id))

    const { data, error } = await supabase
      .from('spot_stories')
      .select('*, profiles:user_id(username, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) { console.error('spot_stories error:', JSON.stringify(error)); return }
    if (!data) return

    // Fetch private accounts separately
    const posterIds = [...new Set(data.map((s: any) => s.user_id))]
    let privateSet = new Set<string>()
    if (posterIds.length > 0) {
      const { data: pd } = await supabase
        .from('profiles')
        .select('id, private_account')
        .in('id', posterIds)
      privateSet = new Set((pd ?? []).filter((p: any) => p.private_account).map((p: any) => p.id))
    }

    const visible = data.filter((s: any) => {
      if (s.user_id === user.id) return true
      if (!privateSet.has(s.user_id)) return true
      return followingIds.has(s.user_id)
    })

    setSpotStories(visible as SpotStory[])
  }, [user])

  useEffect(() => {
    loadStories()

    // Load previously viewed IDs from localStorage
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

  const myStory = spotStories.find(s => s.user_id === user?.id)
  const othersStories = spotStories.filter(s => s.user_id !== user?.id)

  const storyRing = (id: string, seen: boolean) =>
    seen
      ? 'p-[2px] rounded-full bg-white/15'
      : 'p-[2px] rounded-full bg-gradient-to-tr from-gold via-amber-300 to-yellow-200 shadow-[0_0_10px_2px_rgba(212,175,55,0.5)]'

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto no-scrollbar">
        {/* Your spot */}
        <button
          onClick={() => myStory ? setActiveStory(myStory) : navigate('/spot')}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          {myStory ? (
            <div className={storyRing(myStory.id, viewedIds.has(myStory.id))}>
              <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                <img src={myStory.image_url} className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="w-[62px] h-[62px] rounded-full border-2 border-dashed border-gold/40 bg-lenz-card flex items-center justify-center">
              <Plus size={20} className="text-gold/60" />
            </div>
          )}
          <span className="text-[10px] text-white/40 tracking-wide w-16 text-center truncate">Your Spot</span>
        </button>

        {/* Other users' stories */}
        {othersStories.map(story => {
          const seen = viewedIds.has(story.id)
          return (
            <button
              key={story.id}
              onClick={() => setActiveStory(story)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className={storyRing(story.id, seen)}>
                <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                  <img src={story.image_url} alt={story.location_name} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-[10px] text-white/50 w-16 text-center truncate">
                {story.location_name.split(',')[0]}
              </span>
            </button>
          )
        })}

        {/* AI photo spots */}
        {photoSpots.map((spot, i) => (
          <button
            key={spot.id}
            onClick={() => setSelected(spot)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
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
            <span className="text-[10px] text-white/50 w-16 text-center truncate">
              {spot.name.split(' ').slice(0, 2).join(' ')}
            </span>
          </button>
        ))}
      </div>

      {selected && <SpotDetailModal spot={selected} onClose={() => setSelected(null)} />}
      {activeStory && (
        <SpotStoryViewer
          story={activeStory}
          isOwn={activeStory.user_id === user?.id}
          onClose={() => setActiveStory(null)}
          onDelete={removeStory}
          onViewed={markViewed}
        />
      )}
    </>
  )
}
