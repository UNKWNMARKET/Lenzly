import { useState } from 'react'
import { X, MapPin, Star, Camera, Clock, Navigation, Zap, Wind, Droplets, CheckCircle } from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import type { PhotoSpot } from '@/data/mockData'
import { formatCount, cn } from '@/lib/utils'

interface Props {
  spot: PhotoSpot
  onClose: () => void
}

export default function SpotDetailModal({ spot, onClose }: Props) {
  const { forecast, loading, error } = useWeather(spot.lat, spot.lng)
  const [showMapPicker, setShowMapPicker] = useState(false)

  const openMaps = (app: 'apple' | 'google') => {
    const url = app === 'apple'
      ? `https://maps.apple.com/?daddr=${spot.lat},${spot.lng}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
    window.open(url, '_blank')
    setShowMapPicker(false)
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ maxWidth: 430, margin: '0 auto', left: 0, right: 0 }}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet — absolute-positioned so flex-justify-end doesn't fight iOS scroll */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-lenz-bg rounded-t-3xl animate-slide-up"
        style={{
          height: '92vh',
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >

        {/* Hero image */}
        <div className="relative h-60 shrink-0">
          <img src={spot.image} alt={spot.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-lenz-bg via-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <X size={16} className="text-white" />
          </button>

          {spot.aiDiscovered && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-gold/30 rounded-full px-2.5 py-1">
              <Zap size={10} className="text-gold fill-gold" />
              <span className="text-[10px] font-bold text-gold tracking-widest">AI DISCOVERED</span>
            </div>
          )}

          <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
            <Star size={11} className="text-gold fill-gold" />
            <span className="text-xs font-semibold text-white">{spot.rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-10">
          {/* Title */}
          <div className="mt-4 mb-1">
            <h2 className="text-xl font-bold text-white leading-tight">{spot.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-gold" />
                <span className="text-xs text-white/50">{spot.city}{spot.state ? `, ${spot.state}` : ''}</span>
              </div>
              <span className="text-white/15">·</span>
              <span className="text-xs text-white/40 font-medium">{spot.category}</span>
              {spot.architectureStyle && (
                <>
                  <span className="text-white/15">·</span>
                  <span className="text-xs text-gold/70 font-medium">{spot.architectureStyle}</span>
                </>
              )}
              <span className="text-white/15">·</span>
              <div className="flex items-center gap-0.5">
                <Camera size={10} className="text-white/30" />
                <span className="text-xs text-white/30">{formatCount(spot.photoCount)}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/60 leading-relaxed mt-3">{spot.description}</p>

          {/* ── Best Time to Shoot ── */}
          <div className="mt-5 p-4 bg-lenz-card border border-lenz-border rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-gold" />
              <span className="text-xs font-bold tracking-wider uppercase text-white">Best Time to Shoot</span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40">Recommended Window</span>
              <span className="text-sm font-semibold text-gold">{spot.bestTime}</span>
            </div>

            {spot.goldenHourNote && (
              <div className="mt-2 p-2.5 rounded-xl bg-gold/5 border border-gold/15">
                <p className="text-xs text-gold/80 leading-relaxed">
                  <span className="font-bold">Golden Hour: </span>{spot.goldenHourNote}
                </p>
              </div>
            )}

            {spot.shootingTips && spot.shootingTips.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] font-semibold text-white/25 tracking-widest uppercase">Photographer Tips</p>
                {spot.shootingTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-gold/60 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/55 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 5-Day Forecast ── */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-wider uppercase text-white">5-Day Forecast</span>
              <span className="text-[10px] text-white/25">for this location</span>
            </div>

            {loading && (
              <div className="grid grid-cols-5 gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="shimmer h-28 rounded-2xl" />
                ))}
              </div>
            )}

            {error && (
              <p className="text-xs text-white/30 text-center py-4">{error}</p>
            )}

            {!loading && !error && forecast.length > 0 && (
              <>
                <div className="grid grid-cols-5 gap-2">
                  {forecast.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex flex-col items-center p-2 rounded-xl border text-center gap-0.5',
                        day.photoScore >= 80
                          ? 'border-gold/40 bg-gold/5'
                          : day.photoScore >= 55
                          ? 'border-lenz-border bg-lenz-card'
                          : 'border-red-900/30 bg-red-950/20'
                      )}
                    >
                      <span className="text-[10px] font-semibold text-white/50">{day.dayName}</span>
                      <span className="text-2xl leading-tight my-0.5">{day.emoji}</span>
                      <span className="text-xs font-bold text-white">{day.tempMaxF}°</span>
                      <span className="text-[10px] text-white/30">{day.tempMinF}°</span>

                      {day.precipPct > 0 && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Droplets size={8} className="text-blue-400/60" />
                          <span className="text-[9px] text-blue-400/60">{day.precipPct}%</span>
                        </div>
                      )}

                      <div className={cn(
                        'mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight',
                        day.photoScore >= 80
                          ? 'bg-gold/20 text-gold'
                          : day.photoScore >= 55
                          ? 'bg-white/10 text-white/50'
                          : 'bg-red-900/30 text-red-400'
                      )}>
                        {day.photoLabel}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Best day callout */}
                {(() => {
                  const best = forecast.reduce((a, b) => a.photoScore > b.photoScore ? a : b)
                  return best.photoScore >= 75 ? (
                    <div className="mt-3 p-3 rounded-xl bg-gold/5 border border-gold/20 flex items-center gap-2">
                      <Camera size={14} className="text-gold shrink-0" />
                      <p className="text-xs text-white/70">
                        <span className="text-gold font-semibold">{best.dayName}</span> looks best for shooting —{' '}
                        {best.condition}, {best.tempMaxF}°F
                        {best.precipPct < 15 ? ', dry' : ''}
                      </p>
                    </div>
                  ) : null
                })()}

                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <Wind size={10} className="text-white/20" />
                    <span className="text-[10px] text-white/20">Wind today: {forecast[0]?.windMph} mph</span>
                  </div>
                  <p className="text-[10px] text-white/15">via Open-Meteo</p>
                </div>
              </>
            )}
          </div>

          {/* Directions CTA */}
          {!showMapPicker ? (
            <button
              onClick={() => setShowMapPicker(true)}
              className="mt-5 w-full btn-primary py-4 flex items-center justify-center gap-2 text-sm"
            >
              <Navigation size={15} />
              Navigate to This Spot
            </button>
          ) : (
            <div className="mt-5 space-y-2">
              <p className="text-[10px] font-semibold text-white/30 tracking-widest uppercase text-center mb-3">Open directions in</p>
              <button
                onClick={() => openMaps('apple')}
                className="w-full py-4 flex items-center justify-center gap-2.5 text-sm font-semibold bg-lenz-card border border-lenz-border rounded-2xl text-white active:scale-[0.98] transition-transform"
              >
                <span className="text-base">🍎</span>
                Apple Maps
              </button>
              <button
                onClick={() => openMaps('google')}
                className="w-full py-4 flex items-center justify-center gap-2.5 text-sm font-semibold bg-lenz-card border border-lenz-border rounded-2xl text-white active:scale-[0.98] transition-transform"
              >
                <span className="text-base">🗺️</span>
                Google Maps
              </button>
              <button
                onClick={() => setShowMapPicker(false)}
                className="w-full py-3 text-xs text-white/25 hover:text-white/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
