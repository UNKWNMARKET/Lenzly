import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useLocation } from 'wouter'
import { photoSpots } from '@/data/mockData'
import SpotDetailModal from './SpotDetailModal'
import type { PhotoSpot } from '@/data/mockData'

export default function StoriesBar() {
  const [selected, setSelected] = useState<PhotoSpot | null>(null)
  const [, navigate] = useLocation()

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto no-scrollbar">
        {/* Add your spot — opens the upload flow */}
        <button
          onClick={() => navigate('/upload')}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <div className="w-16 h-16 rounded-full bg-lenz-card border border-dashed border-gold/40 flex items-center justify-center hover:border-gold/70 transition-colors">
            <Plus size={20} className="text-gold/60" />
          </div>
          <span className="text-[10px] text-white/40 tracking-wide w-16 text-center truncate">Your Spot</span>
        </button>

        {/* Photo spots — tap to open forecast modal */}
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

      {selected && (
        <SpotDetailModal spot={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
