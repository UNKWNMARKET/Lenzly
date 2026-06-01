import { useState, useEffect } from 'react'
import { Plus, MapPin, X } from 'lucide-react'
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
  profiles?: { username: string; avatar_url: string | null } | null
}

function SpotStoryViewer({ story, onClose }: { story: SpotStory; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={onClose}>
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-lenz-card overflow-hidden border border-gold/40">
            {story.profiles?.avatar_url
              ? <img src={story.profiles.avatar_url} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white/40 text-xs font-bold">
                  {story.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
          </div>
          <div>
            <p className="text-white text-xs font-semibold">@{story.profiles?.username}</p>
            <div className="flex items-center gap-1">
              <MapPin size={9} className="text-gold/70" />
              <p className="text-white/50 text-[10px]">{story.location_name}</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
          <X size={16} className="text-white" />
        </button>
      </div>

      <img
        src={story.image_url}
        alt={story.location_name}
        className="w-full h-full object-cover"
        onClick={e => e.stopPropagation()}
      />

      {story.caption && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
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
  const [, navigate] = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('spot_stories')
        .select('*, profiles:user_id(username, avatar_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setSpotStories(data as SpotStory[])
    }
    fetch()

    const ch = supabase.channel('spot_stories_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'spot_stories' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const myStory = spotStories.find(s => s.user_id === user?.id)
  const othersStories = spotStories.filter(s => s.user_id !== user?.id)

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto no-scrollbar">
        {/* Your spot button */}
        <button
          onClick={() => myStory ? setActiveStory(myStory) : navigate('/spot')}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <div className={`w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center relative ${myStory ? 'border-gold' : 'border-dashed border-gold/40 bg-lenz-card'}`}>
            {myStory ? (
              <img src={myStory.image_url} className="w-full h-full object-cover" />
            ) : (
              <Plus size={20} className="text-gold/60" />
            )}
            {!myStory && (
              <div className="absolute inset-0 rounded-full border border-dashed border-gold/40" />
            )}
          </div>
          <span className="text-[10px] text-white/40 tracking-wide w-16 text-center truncate">Your Spot</span>
        </button>

        {/* Other users' spot stories */}
        {othersStories.map(story => (
          <button
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className="story-ring">
              <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                <img src={story.image_url} alt={story.location_name} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <MapPin size={8} className="text-gold/60" />
            </div>
            <span className="text-[10px] text-white/50 w-16 text-center truncate">
              {story.location_name.split(',')[0]}
            </span>
          </button>
        ))}

        {/* AI photo spots */}
        {photoSpots.map((spot, i) => (
          <button
            key={spot.id}
            onClick={() => setSelected(spot)}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div className={i < 3 ? 'story-ring' : 'story-ring-seen'}>
              <div className="w-[58px] h-[58px] rounded-full overflow-hidden border-2 border-lenz-bg">
                <img
                  src={spot.image}
                  alt={spot.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
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
      {activeStory && <SpotStoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
    </>
  )
}
