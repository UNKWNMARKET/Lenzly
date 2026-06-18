import { useEffect, useState } from 'react'
import { X, MapPin, Star, Camera, Clock, Navigation, Zap, Wind, Droplets, CheckCircle, Share2, Search, Send } from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import type { PhotoSpot } from '@/data/mockData'
import { formatCount, cn } from '@/lib/utils'
import SmartSpotImage from './SmartSpotImage'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface Props {
  spot: PhotoSpot
  onClose: () => void
}

interface Conversation {
  id: string
  other_name: string
  other_avatar: string | null
  other_id: string
}

function ShareSheet({ spot, onClose }: { spot: PhotoSpot; onClose: () => void }) {
  const { user } = useAuth()
  const [convos, setConvos] = useState<Conversation[]>([])
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)
      .then(async ({ data: mine }) => {
        if (!mine?.length) return
        const ids = mine.map(r => r.conversation_id)
        const { data: others } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id, profiles(name, avatar_url)')
          .in('conversation_id', ids)
          .neq('user_id', user.id)
        const list: Conversation[] = (others ?? []).map((r: any) => ({
          id: r.conversation_id,
          other_id: r.user_id,
          other_name: r.profiles?.name ?? 'User',
          other_avatar: r.profiles?.avatar_url ?? null,
        }))
        setConvos(list)
      })
  }, [user])

  const sendSpot = async (convo: Conversation) => {
    if (!user || sending) return
    setSending(convo.id)
    const msg = `📍 **${spot.name}** — ${spot.city ?? ''}${spot.state ? `, ${spot.state}` : ''}\n${spot.description?.slice(0, 120) ?? ''}…\n\n_Best time: ${spot.bestTime}_`
    const { error } = await supabase.from('messages').insert({
      conversation_id: convo.id,
      sender_id: user.id,
      content: msg,
      unsent: false,
    })
    setSending(null)
    if (error) { toast.error('Failed to send'); return }
    setSent(prev => new Set([...prev, convo.id]))
    toast.success(`Sent to ${convo.other_name}`)
  }

  const filtered = convos.filter(c => c.other_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-[70] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full bg-lenz-bg border-t border-white/10 rounded-t-3xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 className="text-white font-semibold text-base">Share this spot</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors"><X size={20} /></button>
        </div>

        {/* Spot preview pill */}
        <div className="mx-5 mb-3 bg-white/5 border border-white/8 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 shrink-0">
          <MapPin size={14} className="text-gold shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{spot.name}</p>
            <p className="text-[11px] text-white/40 truncate">{spot.city}{spot.state ? `, ${spot.state}` : ''}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mx-5 mb-3 shrink-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text" placeholder="Search conversations…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40 transition-colors"
          />
        </div>

        {/* Conversation list */}
        <div className="overflow-y-auto pb-6 px-5">
          {filtered.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-6">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
                    {c.other_avatar
                      ? <img src={c.other_avatar} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/40 text-sm font-semibold">{c.other_name[0]}</div>
                    }
                  </div>
                  <p className="flex-1 text-sm text-white font-medium truncate">{c.other_name}</p>
                  <button
                    onClick={() => sendSpot(c)}
                    disabled={!!sending || sent.has(c.id)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      sent.has(c.id)
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 active:scale-95 disabled:opacity-50'
                    }`}
                  >
                    {sending === c.id ? '…' : sent.has(c.id) ? 'Sent ✓' : 'Send'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SpotDetailModal({ spot, onClose }: Props) {
  const { forecast, loading, error } = useWeather(spot.lat, spot.lng)
  const [showShare, setShowShare] = useState(false)

  // Lock body scroll while modal is open (fixes iOS WKWebView bounce)
  useEffect(() => {
    const prev = document.body.style.cssText
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = `-${window.scrollY}px`
    return () => {
      const scrollY = parseInt(document.body.style.top || '0') * -1
      document.body.style.cssText = prev
      window.scrollTo(0, scrollY)
    }
  }, [])

  const navigate = () => {
    window.open(`https://maps.apple.com/?daddr=${spot.lat},${spot.lng}&dirflg=d`, '_blank')
  }

  return (
    <div
      className="fixed inset-0 z-[60]"
      style={{ maxWidth: 430, margin: '0 auto', left: 0, right: 0, overflow: 'hidden' }}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-lenz-bg rounded-t-3xl animate-slide-up"
        style={{
          height: '92dvh',
          overflowY: 'scroll',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
        }}
      >

        {/* Hero image */}
        <div className="relative h-60 shrink-0">
          <SmartSpotImage
            name={`${spot.name} ${spot.city ?? ''} ${spot.state ?? ''}`.trim()}
            fallback={spot.image}
            alt={spot.name}
            className="w-full h-full object-cover"
          />
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
        <div className="px-4 pb-16" style={{ paddingBottom: 'max(4rem, env(safe-area-inset-bottom, 1rem))' }}>
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

          {/* Action buttons */}
          <div className="mt-5 mb-6 flex gap-3">
            <button
              onClick={navigate}
              className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 text-sm active:scale-[0.98] transition-transform"
            >
              <Navigation size={15} />
              Navigate
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="w-14 py-4 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all text-white/60 hover:text-white"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {showShare && <ShareSheet spot={spot} onClose={() => setShowShare(false)} />}
    </div>
  )
}
