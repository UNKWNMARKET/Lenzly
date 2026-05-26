import { CheckCircle, MapPin, Star, Camera, Users } from 'lucide-react'
import { formatCount } from '@/lib/utils'
import type { Photographer } from '@/data/mockData'

interface Props {
  photographer: Photographer
  compact?: boolean
}

export default function PhotographerCard({ photographer: p, compact = false }: Props) {
  return (
    <div className="card p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className={p.verified ? 'story-ring' : 'story-ring-seen'}>
            <div className="w-[54px] h-[54px] rounded-full overflow-hidden border-2 border-lenz-bg">
              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
            </div>
          </div>
          {p.available && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-lenz-card" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-white text-sm truncate">{p.name}</span>
              {p.verified && <CheckCircle size={13} className="text-gold fill-gold/20 shrink-0" />}
              {p.pro && (
                <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Star size={11} className="text-gold fill-gold" />
              <span className="text-xs text-white/70 font-medium">{p.rating}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={10} className="text-white/30" />
            <span className="text-[11px] text-white/40">{p.location}</span>
          </div>

          {/* Specialty badges */}
          <div className="flex flex-wrap gap-1 mt-2">
            {p.specialty.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] font-medium text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
            {p.secondShooter && (
              <span className="text-[10px] font-medium text-gold bg-gold-muted border border-gold/20 px-2 py-0.5 rounded-full">
                2nd Shooter
              </span>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-lenz-border">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{formatCount(p.followers)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">{p.hired}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Hired</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gold">{p.priceRange.split('–')[0]}</p>
              <p className="text-[10px] text-white/30 mt-0.5">Starting</p>
            </div>
          </div>

          {/* Mini photo grid */}
          <div className="grid grid-cols-3 gap-1 mt-3">
            {p.photos.slice(0, 3).map((photo, i) => (
              <div key={i} className="aspect-square rounded-md overflow-hidden bg-lenz-muted">
                <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 btn-primary text-xs py-2">
              Hire {p.name.split(' ')[0]}
            </button>
            <button className="btn-ghost text-xs py-2 px-4">
              View Profile
            </button>
          </div>
        </>
      )}
    </div>
  )
}
