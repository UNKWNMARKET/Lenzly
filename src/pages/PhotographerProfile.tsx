import { useState } from 'react'
import { useParams, useLocation } from 'wouter'
import {
  ChevronLeft, Star, MapPin, CheckCircle, Camera,
  MessageCircle, Share2, X, Globe, AtSign
} from 'lucide-react'
import { photographers } from '@/data/mockData'
import { floridaPhotographers } from '@/data/floridaData'
import { formatCount } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

const allPhotographers = [...photographers, ...floridaPhotographers]

type HireStep = 'idle' | 'form' | 'sent'

export default function PhotographerProfile() {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [hireStep, setHireStep] = useState<HireStep>('idle')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [hireForm, setHireForm] = useState({
    projectType: '',
    date: '',
    budget: '',
    details: '',
  })
  const [sending, setSending] = useState(false)

  const p = allPhotographers.find(ph => ph.id === id)

  if (!p) {
    return (
      <div className="min-h-screen bg-lenz-bg flex flex-col items-center justify-center gap-4">
        <Camera size={40} className="text-white/10" />
        <p className="text-white/30 text-sm">Photographer not found</p>
        <button onClick={() => navigate('/find')} className="btn-ghost text-sm px-4 py-2">← Back to Find</button>
      </div>
    )
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: `${p.name} on LENZLY`, text: p.bio, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  const handleMessageStart = async () => {
    if (!user) { navigate('/auth/login'); return }
    toast.info('Starting conversation…')
    navigate('/messages')
  }

  const handleHireSend = async () => {
    if (!hireForm.projectType.trim()) { toast.error('Project type is required'); return }
    setSending(true)
    await new Promise(r => setTimeout(r, 900)) // simulate send
    setSending(false)
    setHireStep('sent')
    toast.success(`Hire request sent to ${p.name.split(' ')[0]}!`)
  }

  return (
    <div className="min-h-screen bg-lenz-bg pb-24">
      {/* Cover */}
      <div className="relative h-48 overflow-hidden bg-lenz-card">
        {p.coverPhoto
          ? <img src={p.coverPhoto} alt="cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#0a0804]" />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-lenz-bg" />

        {/* Back + Share */}
        <div className="absolute top-4 left-4 safe-top">
          <button
            onClick={() => navigate('/find')}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="absolute top-4 right-4 safe-top">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/80"
          >
            <Share2 size={17} />
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div className="px-4 -mt-14 relative z-10">
        <div className="flex items-end justify-between">
          <div className="relative">
            <div className={p.verified ? 'story-ring' : 'story-ring-seen'} style={{ padding: '3px' }}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-lenz-bg bg-lenz-card">
                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
              </div>
            </div>
            {p.available && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-lenz-bg" />
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleMessageStart}
              className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <MessageCircle size={13} />
              Message
            </button>
            <button
              onClick={() => setHireStep('form')}
              className="btn-primary text-xs py-2 px-4"
            >
              Hire {p.name.split(' ')[0]}
            </button>
          </div>
        </div>

        {/* Name + badges */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-white">{p.name}</h1>
            {p.verified && <CheckCircle size={16} className="text-gold fill-gold/20" />}
            {p.pro && (
              <span className="text-[10px] font-bold tracking-widest text-lenz-bg bg-gold px-2 py-0.5 rounded-full">PRO</span>
            )}
            {p.secondShooter && (
              <span className="text-[10px] font-bold tracking-widest text-gold border border-gold/40 bg-gold/10 px-2 py-0.5 rounded-full">2nd Shooter</span>
            )}
          </div>
          <p className="text-sm text-white/40 mt-0.5">@{p.username}</p>
        </div>

        {/* Rating + Price */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={12} className={s <= Math.round(p.rating) ? 'text-gold fill-gold' : 'text-white/15'} />
            ))}
            <span className="text-xs text-white/60 ml-1">{p.rating} · {p.hired} bookings</span>
          </div>
          {p.priceRange && (
            <span className="text-xs text-gold font-semibold">{p.priceRange}</span>
          )}
        </div>

        {/* Bio */}
        <p className="text-sm text-white/70 mt-3 leading-relaxed">{p.bio}</p>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 mt-3">
          {p.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-white/30" />
              <span className="text-sm text-white/50">{p.location}</span>
            </div>
          )}
          {p.portfolio && (
            <button
              onClick={() => window.open(p.portfolio.startsWith('http') ? p.portfolio : `https://${p.portfolio}`, '_blank')}
              className="flex items-center gap-1.5 group"
            >
              <Globe size={13} className="text-white/30 group-hover:text-gold transition-colors" />
              <span className="text-sm text-white/50 group-hover:text-gold transition-colors">{p.portfolio}</span>
            </button>
          )}
          {p.instagram && (
            <div className="flex items-center gap-1.5">
              <AtSign size={13} className="text-white/30" />
              <span className="text-sm text-white/50">{p.instagram}</span>
            </div>
          )}
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {p.specialty.map(s => (
            <span
              key={s}
              className="text-[11px] font-medium text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 py-4 border-t border-b border-lenz-border">
          {[
            { label: 'Posts',     value: formatCount(p.posts) },
            { label: 'Followers', value: formatCount(p.followers) },
            { label: 'Hired',     value: p.hired },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-base font-bold text-white">{value}</p>
              <p className="text-[10px] text-white/30 mt-0.5 tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Photo grid */}
      {p.photos.length > 0 && (
        <div className="mt-1">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-white/30 tracking-wider uppercase">Portfolio</p>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            {p.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setSelectedPhoto(photo)}
                className="relative group overflow-hidden"
              >
                <img
                  src={photo}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Photo viewer */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setSelectedPhoto(null)}>
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            onClick={() => setSelectedPhoto(null)}
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={selectedPhoto.replace('w=400', 'w=800')}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Hire modal */}
      {(hireStep === 'form' || hireStep === 'sent') && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setHireStep('idle')}>
          <div className="w-full max-w-[430px] mx-auto bg-lenz-bg rounded-t-3xl border-t border-lenz-border pb-10 safe-bottom">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-lenz-border">
              <h2 className="text-base font-bold text-white">
                {hireStep === 'sent' ? '✓ Request Sent!' : `Hire ${p.name.split(' ')[0]}`}
              </h2>
              <button onClick={() => setHireStep('idle')} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10">
                <X size={16} className="text-white/50" />
              </button>
            </div>

            {hireStep === 'sent' ? (
              <div className="px-5 py-8 text-center">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                  <Camera size={28} className="text-lenz-bg" />
                </div>
                <p className="text-white font-semibold text-base mb-2">Your request is on its way!</p>
                <p className="text-white/40 text-sm leading-relaxed">
                  {p.name.split(' ')[0]} will review your request and get back to you via message shortly.
                </p>
                <button
                  onClick={() => { setHireStep('idle'); navigate('/messages') }}
                  className="btn-primary w-full mt-6"
                >
                  Go to Messages
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3.5">
                {/* Photographer mini header */}
                <div className="flex items-center gap-3 p-3 bg-lenz-card rounded-xl border border-lenz-border">
                  <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
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
                    type="text"
                    value={hireForm.projectType}
                    onChange={e => setHireForm(f => ({ ...f, projectType: e.target.value }))}
                    placeholder="e.g. Wedding, Brand Campaign, Portraits"
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Preferred Date</label>
                  <input
                    type="text"
                    value={hireForm.date}
                    onChange={e => setHireForm(f => ({ ...f, date: e.target.value }))}
                    placeholder="e.g. June 15 or flexible"
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Budget</label>
                  <input
                    type="text"
                    value={hireForm.budget}
                    onChange={e => setHireForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="e.g. $500–1000"
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Details</label>
                  <textarea
                    value={hireForm.details}
                    onChange={e => setHireForm(f => ({ ...f, details: e.target.value }))}
                    placeholder="Tell them about your project…"
                    rows={3}
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleHireSend}
                  disabled={sending}
                  className="btn-primary w-full py-3.5 font-bold tracking-wider disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Hire Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
