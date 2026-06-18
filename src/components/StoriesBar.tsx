import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useLocation } from 'wouter'
import { photoSpots } from '@/data/mockData'
import SpotDetailModal from './SpotDetailModal'
import StoryViewer, { type SpotStory, DELETED_SENTINEL } from './StoryViewer'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { img } from '@/lib/image'
import { haptics } from '@/lib/haptics'
import type { PhotoSpot } from '@/data/mockData'

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

  const myStories = spotStories
    .filter(s => s.user_id === user?.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Group other users' stories: one bubble per user, stories sorted oldest→newest
  const othersMap = new Map<string, SpotStory[]>()
  for (const s of spotStories.filter(s => s.user_id !== user?.id)) {
    const arr = othersMap.get(s.user_id) ?? []
    arr.push(s)
    othersMap.set(s.user_id, arr)
  }
  const othersGrouped = [...othersMap.values()]
    .map(arr => arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
    .sort((a, b) => new Date(b[b.length - 1].created_at).getTime() - new Date(a[a.length - 1].created_at).getTime())

  // Flat ordered list for the viewer — own stories first, then per-user groups
  const allViewable = [...myStories, ...othersGrouped.flat()]

  // Start index for each user's bubble in the flat list
  const myStartIndex = 0
  const othersStartIndex = (groupIdx: number) =>
    myStories.length + othersGrouped.slice(0, groupIdx).reduce((acc, g) => acc + g.length, 0)

  const ring = (unseen: boolean) => unseen
    ? 'p-[2.5px] rounded-full bg-gradient-to-tr from-gold via-yellow-300 to-amber-200 shadow-[0_0_10px_2px_rgba(201,168,76,0.4)]'
    : 'p-[2.5px] rounded-full bg-white/10'

  return (
    <>
      <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
        {/* Your Spot */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative">
            <button
              onClick={() => { haptics.light(); myStories.length > 0 ? setStoryIndex(myStartIndex) : navigate('/spot') }}
              className="active:scale-95 transition-transform duration-150"
            >
              {myStories.length > 0 ? (
                <div className={ring(myStories.some(s => !viewedIds.has(s.id)))}>
                  <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                    <img src={img.thumb(myStories[myStories.length - 1].image_url)} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                </div>
              ) : (
                <div className="w-[63px] h-[63px] rounded-full border-[1.5px] border-dashed border-gold/30 bg-lenz-card/50 flex items-center justify-center">
                  <Plus size={20} className="text-gold/50" />
                </div>
              )}
            </button>
            {/* Add more spots button */}
            {myStories.length > 0 && (
              <button
                onClick={() => { haptics.light(); navigate('/spot') }}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gold border-2 border-lenz-bg flex items-center justify-center active:scale-90 transition-transform"
              >
                <Plus size={11} className="text-lenz-bg" strokeWidth={3} />
              </button>
            )}
          </div>
          <span className="text-[10px] text-white/30 tracking-wide">
            Your Spot{myStories.length > 1 ? ` (${myStories.length})` : ''}
          </span>
        </div>

        {/* Others — one bubble per user, shows count badge if multiple stories */}
        {othersGrouped.map((group, groupIdx) => {
          const latest = group[group.length - 1]
          const unseen = group.some(s => !viewedIds.has(s.id))
          return (
            <button
              key={latest.user_id}
              onClick={() => { haptics.light(); setStoryIndex(othersStartIndex(groupIdx)) }}
              className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-150"
            >
              <div className="relative">
                <div className={ring(unseen)}>
                  <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                    <img src={img.thumb(latest.image_url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
                {group.length > 1 && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-lenz-card border border-lenz-border text-[9px] font-bold text-white/70 flex items-center justify-center">
                    {group.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/35 w-16 text-center truncate leading-tight">
                {latest.location_name.split(/[,—]/)[0].trim()}
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
