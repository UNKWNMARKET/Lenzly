import { useState } from 'react'
import { ArrowLeft, Building2, CheckCircle, Camera, MapPin, Star, Search, ChevronRight, Shield, TrendingUp } from 'lucide-react'
import { useLocation } from 'wouter'
import { photographers } from '@/data/mockData'
import { toast } from 'sonner'

const API = 'http://localhost:3001/api/brand'
const brandLogos = ['WildScope', 'Maison Élite', 'Lumière', 'ApexGear', 'Nexar', 'Meridian']

const perks = [
  { icon: Search, title: 'Talent Discovery', desc: 'Search verified photographers by specialty, location, and style.' },
  { icon: Shield, title: 'Vetted Professionals', desc: 'Every Pro photographer is identity-verified and portfolio-reviewed.' },
  { icon: MapPin, title: 'Location Search', desc: 'Find the right photographer in any city or zip code.' },
  { icon: TrendingUp, title: 'Track Results', desc: 'View post analytics and campaign performance.' },
]

export default function BrandsPage() {
  const [, navigate] = useLocation()
  const [activeTab, setActiveTab] = useState<'discover' | 'signup'>('discover')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function toggleNeed(need: string) {
    setSelectedNeeds(prev => prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need])
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !email.trim()) { toast.error('Company name and email are required'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim(), email: email.trim(), website: website.trim(), needs: selectedNeeds }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to submit'); setSubmitting(false); return }
      setSubmitted(true)
    } catch {
      toast.error('Could not connect to server')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none">
    <div className="min-h-full bg-lenz-bg pb-24 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-4 flex items-center gap-3 safe-top">
        <button onClick={() => navigate('/')} className="p-1 -ml-1 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-[0.12em] gold-text">FOR BRANDS</h1>
      </header>

      {/* Hero */}
      <div className="relative px-4 pt-6 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={18} className="text-gold" />
            <span className="text-xs font-bold tracking-widest text-gold uppercase">Brand Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight mb-3">
            Hire world-class<br />
            <span className="gold-text">photographers</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed mb-5">
            Connect with verified, talented photographers for editorial, commercial, and brand campaigns. Trusted by leading companies worldwide.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('signup')}
              className="flex-1 btn-primary"
            >
              Create Brand Account
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className="flex-1 btn-ghost"
            >
              Browse Talent
            </button>
          </div>

          {/* Trusted by */}
          <div className="mt-5">
            <p className="text-[10px] text-white/20 tracking-widest uppercase mb-2">Trusted by</p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {brandLogos.map(b => (
                <span key={b} className="shrink-0 text-xs font-bold text-white/20 tracking-widest uppercase">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex border-b border-lenz-border mx-4 mb-4">
        {(['discover', 'signup'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold tracking-widest uppercase border-b-2 transition-all ${
              activeTab === t ? 'text-gold border-gold' : 'text-white/25 border-transparent'
            }`}
          >
            {t === 'discover' ? 'Discover Talent' : 'Sign Up'}
          </button>
        ))}
      </div>

      {activeTab === 'discover' ? (
        <div className="px-4 space-y-4 animate-fade-in">
          {/* Perks */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-3">
                <Icon size={16} className="text-gold mb-2" />
                <p className="text-xs font-semibold text-white mb-0.5">{title}</p>
                <p className="text-[11px] text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Featured photographers for brands */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white/50 tracking-wider uppercase">Featured Talent</p>
              <button className="text-[11px] text-gold font-medium">View All</button>
            </div>

            <div className="space-y-3">
              {photographers.filter(p => p.pro).map(p => (
                <div key={p.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div className="story-ring shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-lenz-bg">
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{p.name}</span>
                        <CheckCircle size={13} className="text-gold" />
                        <span className="text-[9px] font-bold text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full">PRO</span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5">{p.specialty.join(' · ')}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-0.5">
                          <Star size={10} className="text-gold fill-gold" />
                          <span className="text-xs text-white/60">{p.rating}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Camera size={10} className="text-white/30" />
                          <span className="text-xs text-white/40">{p.hired} hired</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <MapPin size={10} className="text-white/30" />
                          <span className="text-xs text-white/40">{p.city}</span>
                        </div>
                      </div>
                    </div>
                    <button className="shrink-0 btn-primary text-xs py-1.5 px-3">
                      Hire
                    </button>
                  </div>

                  {/* Photo strip */}
                  <div className="grid grid-cols-4 gap-1 mt-3">
                    {p.photos.slice(0, 4).map((photo, i) => (
                      <div key={i} className="aspect-square rounded-md overflow-hidden bg-lenz-muted">
                        <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 animate-fade-in">
          {submitted ? (
            <div className="card p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-green-950/30 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle size={26} className="text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Application Submitted!</h3>
              <p className="text-sm text-white/50">We'll review your request and send login credentials to <span className="text-white">{email}</span> within 24 hours.</p>
              <button onClick={() => navigate('/brand-portal/login')} className="w-full btn-primary py-3 text-sm mt-2">
                Go to Brand Portal
              </button>
            </div>
          ) : (
          <form onSubmit={handleApply} className="card p-5 space-y-4">
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-3">
                <Building2 size={26} className="text-lenz-bg" />
              </div>
              <h3 className="text-lg font-bold text-white">Create Brand Account</h3>
              <p className="text-xs text-white/30 mt-1">Start hiring photographers today</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Company Name *</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name..." required
                className="w-full bg-lenz-muted border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Work Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                className="w-full bg-lenz-muted border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Website</label>
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="company.com"
                className="w-full bg-lenz-muted border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold/40 transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Photography Needs</label>
              <div className="grid grid-cols-2 gap-2">
                {['Editorial', 'Commercial', 'Events', 'Product', 'Fashion', 'Campaign'].map(need => (
                  <button type="button" key={need} onClick={() => toggleNeed(need)}
                    className={`text-xs py-2 rounded-lg border transition-all ${
                      selectedNeeds.includes(need)
                        ? 'bg-gold/15 border-gold/40 text-gold'
                        : 'text-white/50 bg-lenz-muted border-lenz-border hover:border-gold/40 hover:text-gold'
                    }`}>
                    {need}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="w-full btn-primary py-3.5 text-sm disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Request Brand Access'}
            </button>
            <p className="text-[10px] text-white/20 text-center">
              Our team will review your request within 24 hours.
            </p>
          </form>
          )}
        </div>
      )}
    </div>
    </div>
  )
}
