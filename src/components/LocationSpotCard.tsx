import { MapPin, Star, Camera, Clock, Zap, Navigation } from 'lucide-react'
import { formatCount } from '@/lib/utils'
import type { PhotoSpot } from '@/data/mockData'
import { useSpotModal } from '@/contexts/SpotModalContext'
import SmartSpotImage from './SmartSpotImage'

interface Props {
  spot: PhotoSpot
}

export default function LocationSpotCard({ spot }: Props) {
  const { openSpot } = useSpotModal()

  return (
    <>
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer group animate-slide-up"
        style={{ aspectRatio: '3/4' }}
        onClick={() => openSpot(spot)}
      >
        <SmartSpotImage
          name={`${spot.name} ${spot.city ?? ''} ${spot.state ?? ''}`.trim()}
          fallback={spot.image}
          alt={spot.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* AI badge */}
        {spot.aiDiscovered && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-gold/30 rounded-full px-2.5 py-1">
            <Zap size={10} className="text-gold fill-gold" />
            <span className="text-[10px] font-bold text-gold tracking-widest">AI SPOT</span>
          </div>
        )}

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-full px-2 py-1">
          <Star size={10} className="text-gold fill-gold" />
          <span className="text-[11px] font-semibold text-white">{spot.rating}</span>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-white leading-tight">{spot.name}</h3>

          <div className="flex items-center gap-1 mt-1">
            <MapPin size={10} className="text-gold" />
            <span className="text-[11px] text-white/60">
              {spot.city}{spot.state ? `, ${spot.state}` : ''}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1">
              <Camera size={10} className="text-white/40" />
              <span className="text-[10px] text-white/40">{formatCount(spot.photoCount)} photos</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-white/40" />
              <span className="text-[10px] text-white/40">{spot.bestTime.split('·')[0].trim()}</span>
            </div>
          </div>

          {/* Tap hint */}
          <div className="mt-2 flex items-center justify-center gap-1.5 bg-gold/10 border border-gold/20 rounded-full py-1.5">
            <span className="text-[10px] text-gold font-semibold tracking-wide">
              Tap for forecast &amp; tips
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
