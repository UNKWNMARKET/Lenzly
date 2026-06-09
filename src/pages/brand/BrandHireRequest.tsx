import { useState, useEffect } from 'react'
import { useLocation, useParams } from 'wouter'
import { ArrowLeft, MapPin, Send, Bookmark, BookmarkCheck } from 'lucide-react'
import { useBrandAuth } from '@/contexts/BrandAuthContext'
import { toast } from 'sonner'

interface Photographer {
  id: string; name: string; username: string; avatar_url: string | null
  bio: string | null; specialty: string[]; location: string | null
  price_range: string | null; available: boolean; followers_count: number
}

const PROJECT_TYPES = ['Editorial', 'Commercial', 'Campaign', 'Events', 'Fashion', 'Product', 'Social Media', 'Other']

export default function BrandHireRequest() {
  const { api } = useBrandAuth()
  const { id: photographerId } = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [shortlisted, setShortlisted] = useState(false)
  const [message, setMessage] = useState('')
  const [budget, setBudget] = useState('')
  const [projectType, setProjectType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!photographerId) return
    // Fetch photographer profile via search
    api(`/photographers?search=&page=0`).then(r => r.json()).then(data => {
      const p = Array.isArray(data) ? data.find((x: any) => x.id === photographerId) : null
      if (p) setPhotographer(p)
    }).catch(() => {})
    // Fetch portfolio posts
    api(`/photographers/${photographerId}/posts`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPosts(data)
    }).catch(() => {})
    // Check shortlist
    api('/shortlist').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setShortlisted(data.some((p: any) => p.id === photographerId))
    }).catch(() => {})
  }, [photographerId])

  async function toggleShortlist() {
    if (shortlisted) {
      await api(`/shortlist/${photographerId}`, { method: 'DELETE' })
      setShortlisted(false)
      toast.success('Removed from shortlist')
    } else {
      await api(`/shortlist/${photographerId}`, { method: 'POST' })
      setShortlisted(true)
      toast.success('Added to shortlist')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) { toast.error('Please write a message'); return }
    setSubmitting(true)
    try {
      const res = await api('/hire-requests', {
        method: 'POST',
        body: JSON.stringify({ photographerId, message: message.trim(), budget: budget || null, projectType: projectType || null, startDate: startDate || null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Failed to send request')
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch {
      toast.error('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-green-950/30 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
            <Send size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Request Sent!</h2>
          <p className="text-sm text-white/50 mb-6">
            Your hire request has been sent to <span className="text-white">{photographer?.name}</span>. They'll receive it and can respond via the Lenzly app.
          </p>
          <div className="flex gap-3">
            <button onClick={() => navigate('/brand-portal/search')} className="flex-1 py-3 rounded-xl bg-white/5 text-sm text-white/70 font-medium">
              Find More
            </button>
            <button onClick={() => navigate('/brand-portal/requests')} className="flex-1 py-3 rounded-xl bg-[#C9A84C] text-sm text-[#060606] font-bold">
              View Requests
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060606]">
      <header className="sticky top-0 z-40 bg-[#060606]/95 backdrop-blur border-b border-[#1A1A1A] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1 as any)} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-white">Send Hire Request</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Photographer profile */}
        {photographer && (
          <div className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/5 overflow-hidden shrink-0">
                {photographer.avatar_url
                  ? <img src={photographer.avatar_url} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white/20 font-bold text-lg">{photographer.name?.[0]}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{photographer.name}</span>
                  <span className="text-[9px] font-bold text-[#060606] bg-[#C9A84C] px-1.5 py-0.5 rounded-full">PRO</span>
                </div>
                <p className="text-xs text-white/40">@{photographer.username}</p>
                {photographer.specialty?.length > 0 && <p className="text-xs text-[#C9A84C]/60 mt-0.5">{photographer.specialty.slice(0, 3).join(' · ')}</p>}
                {photographer.location && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-white/25" />
                    <span className="text-xs text-white/30">{photographer.location}</span>
                  </div>
                )}
              </div>
              <button onClick={toggleShortlist} className={`p-2 rounded-xl shrink-0 transition-colors ${shortlisted ? 'text-[#C9A84C] bg-[#C9A84C]/10' : 'text-white/25 hover:text-[#C9A84C]'}`}>
                {shortlisted ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
            </div>
            {photographer.bio && <p className="text-xs text-white/40 mt-3 leading-relaxed">{photographer.bio}</p>}
          </div>
        )}

        {/* Portfolio strip */}
        {posts.length > 0 && (
          <div>
            <p className="text-[10px] text-white/30 tracking-widest uppercase mb-2">Portfolio</p>
            <div className="grid grid-cols-4 gap-1.5">
              {posts.slice(0, 8).map(p => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-white/5">
                  <img src={p.image_url} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hire request form */}
        <form onSubmit={handleSubmit} className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Project Details</h3>

          <div>
            <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Project Type</label>
            <div className="grid grid-cols-3 gap-2">
              {PROJECT_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setProjectType(projectType === t ? '' : t)}
                  className={`text-xs py-2 rounded-xl border transition-all ${projectType === t ? 'bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]' : 'bg-[#141414] border-[#222] text-white/50 hover:border-[#C9A84C]/20'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Budget (optional)</label>
            <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. $500–$1,000"
              className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Preferred Start Date (optional)</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40 [color-scheme:dark]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 1000))} placeholder="Describe your project, vision, requirements, timeline…" rows={5} required
              className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40 resize-none" />
            <p className="text-[10px] text-white/20 text-right mt-1">{message.length}/1000</p>
          </div>

          <button type="submit" disabled={submitting || !message.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#C9A84C] text-[#060606] font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform">
            <Send size={15} />
            {submitting ? 'Sending…' : 'Send Hire Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
