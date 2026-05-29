import { useState } from 'react'
import { CheckCircle, MapPin, Star, Camera, X } from 'lucide-react'
import { formatCount } from '@/lib/utils'
import { useLocation } from 'wouter'
import { toast } from 'sonner'
import type { Photographer } from '@/data/mockData'

interface Props {
  photographer: Photographer
  compact?: boolean
}

export default function PhotographerCard({ photographer: p, compact = false }: Props) {
  const [, navigate] = useLocation()
  const [showHire, setShowHire] = useState(false)
  const [projectType, setProjectType] = useState('')
  const [date, setDate] = useState('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleHireSend = async () => {
    if (!projectType.trim()) { toast.error('Project type is required'); return }
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setSending(false)
    setSent(true)
    toast.success(`Hire request sent to ${p.name.split(' ')[0]}!`)
  }

  return (
    <>
      <div className="card p-4 animate-slide-up">
        <div className="flex items-start gap-3">
          {/* Avatar — clickable → full profile */}
          <button className="relative shrink-0" onClick={() => navigate(`/photographer/${p.id}`)}>
            <div className={p.verified ? 'story-ring' : 'story-ring-seen'}>
              <div className="w-[54px] h-[54px] rounded-full overflow-hidden border-2 border-lenz-bg">
                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
              </div>
            </div>
            {p.available && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-lenz-card" />
            )}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <button
                className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/photographer/${p.id}`)}
              >
                <span className="font-semibold text-white text-sm truncate">{p.name}</span>
                {p.verified && <CheckCircle size={13} className="text-gold fill-gold/20 shrink-0" />}
                {p.pro && (
                  <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>
                )}
              </button>
              <div className="flex items-center gap-0.5 shrink-0">
                <Star size={11} className="text-gold fill-gold" />
                <span className="text-xs text-white/70 font-medium">{p.rating}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-white/30" />
              <span className="text-[11px] text-white/40">{p.location}</span>
            </div>

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
              <button
                onClick={() => setShowHire(true)}
                className="flex-1 btn-primary text-xs py-2"
              >
                Hire {p.name.split(' ')[0]}
              </button>
              <button
                onClick={() => navigate(`/photographer/${p.id}`)}
                className="btn-ghost text-xs py-2 px-4"
              >
                View Profile
              </button>
            </div>
          </>
        )}
      </div>

      {/* Hire modal */}
      {showHire && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowHire(false)}
        >
          <div className="w-full max-w-[430px] mx-auto bg-lenz-bg rounded-t-3xl border-t border-lenz-border pb-10 safe-bottom">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-lenz-border">
              <h2 className="text-base font-bold text-white">
                {sent ? '✓ Request Sent!' : `Hire ${p.name.split(' ')[0]}`}
              </h2>
              <button onClick={() => { setShowHire(false); setSent(false) }} className="p-1.5 rounded-full bg-white/5">
                <X size={16} className="text-white/50" />
              </button>
            </div>

            {sent ? (
              <div className="px-5 py-8 text-center">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                  <Camera size={28} className="text-lenz-bg" />
                </div>
                <p className="text-white font-semibold mb-2">Request sent to {p.name.split(' ')[0]}!</p>
                <p className="text-white/40 text-sm">They'll get back to you via message.</p>
                <button
                  onClick={() => { setShowHire(false); setSent(false) }}
                  className="btn-primary w-full mt-6"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3.5">
                <div className="flex items-center gap-3 p-3 bg-lenz-card rounded-xl border border-lenz-border">
                  <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-gold fill-gold" />
                      <span className="text-xs text-white/40">{p.rating} · {p.priceRange}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Project Type *</label>
                  <input
                    value={projectType}
                    onChange={e => setProjectType(e.target.value)}
                    placeholder="e.g. Wedding, Brand Campaign, Portraits"
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Preferred Date</label>
                  <input
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    placeholder="e.g. June 15 or flexible"
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Details</label>
                  <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Tell them about your project…"
                    rows={3}
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleHireSend}
                  disabled={sending}
                  className="btn-primary w-full py-3.5 font-bold disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Hire Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
