import { useState } from 'react'
import { Search, Shield, MapPin, TrendingUp, CheckCircle, ArrowRight, Building2, Eye, EyeOff, Lock, Mail, Star } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/brand'
const NEEDS = ['Editorial', 'Commercial', 'Events', 'Product', 'Fashion', 'Campaign']

const perks = [
  { icon: Search, title: 'Talent Discovery', desc: 'Search verified PRO photographers by specialty, location, and shooting style.' },
  { icon: Shield, title: 'Vetted Professionals', desc: 'Every PRO photographer is identity-verified and portfolio-reviewed by our team.' },
  { icon: MapPin, title: 'Location Search', desc: 'Find the right photographer in any city or region, instantly.' },
  { icon: TrendingUp, title: 'Direct Booking', desc: 'Send hire requests directly. No agency fees, no middleman, no commission.' },
]

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Invalid credentials'); setLoading(false); return }
      localStorage.setItem('lenzly_brand', JSON.stringify({
        ...data, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }))
      window.location.href = '/brand-portal'
    } catch { setError('Cannot connect to server') }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Work Email</label>
        <div className="relative">
          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 transition-colors" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Password</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
            className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl pl-9 pr-10 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 transition-colors" />
          <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      {error && <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#dbb95f] text-[#060606] font-bold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-[#C9A84C]/20 transition-all">
        {loading ? 'Signing in…' : 'Sign In to Brand Portal'}
      </button>
    </form>
  )
}

function SignupForm() {
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [needs, setNeeds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function toggle(n: string) { setNeeds(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, email, website, needs }),
      })
      if (res.ok) setSubmitted(true)
      else {
        const d = await res.json()
        alert(d.error ?? 'Failed to submit')
      }
    } catch { alert('Cannot connect to server') }
    setSubmitting(false)
  }

  if (submitted) return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-green-950/30 border border-green-500/20 flex items-center justify-center mx-auto">
        <CheckCircle size={28} className="text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
      <p className="text-sm text-white/45 leading-relaxed">We'll send login credentials to <span className="text-white font-medium">{email}</span> within 24 hours.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Company Name *</label>
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name" required
          className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Work Email *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
          className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Website</label>
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="company.com"
          className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#C9A84C]/40 transition-colors" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Photography Needs</label>
        <div className="grid grid-cols-3 gap-2">
          {NEEDS.map(n => (
            <button type="button" key={n} onClick={() => toggle(n)}
              className={`text-xs py-2.5 rounded-xl border transition-all font-medium ${needs.includes(n) ? 'bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]' : 'bg-[#0A0A0A] border-[#222] text-white/40 hover:border-[#C9A84C]/20 hover:text-white/70'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={submitting}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#dbb95f] text-[#060606] font-bold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-[#C9A84C]/20 transition-all">
        {submitting ? 'Submitting…' : 'Request Brand Access'}
      </button>
      <p className="text-[11px] text-white/20 text-center">Our team reviews all requests within 24 hours.</p>
    </form>
  )
}

export default function Brands() {
  const [tab, setTab] = useState<'login' | 'apply'>('apply')

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/8 border border-[#C9A84C]/15 rounded-full px-5 py-2.5 mb-8">
            <Building2 size={12} className="text-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C] font-medium tracking-wider">Brand Portal</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-white mb-5 leading-tight">
            Hire world-class<br /><em className="gold-text">photographers.</em>
          </h1>
          <p className="text-lg text-white/40 max-w-lg mx-auto leading-relaxed font-light">
            Connect with verified PRO photographers for editorial, commercial, and brand campaigns. Direct access, no agency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-14 items-start">
          {/* Perks */}
          <div className="space-y-6">
            <p className="section-label mb-8">What you get</p>
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#C9A84C]/15 transition-colors">
                  <Icon size={18} className="text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1.5">{title}</p>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}

            <div className="card p-6 mt-10">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-[#C9A84C] fill-[#C9A84C]" />)}
              </div>
              <p className="text-sm text-white/55 italic leading-relaxed mb-4">"We booked 4 photographers in a week. The talent on Lenzly is exceptional."</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Sarah M.</p>
                  <p className="text-xs text-white/30">Creative Director, NOVO Studio</p>
                </div>
                <button onClick={() => setTab('login')} className="flex items-center gap-1.5 text-xs text-[#C9A84C] font-medium hover:text-white transition-colors">
                  Sign in <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <div className="card p-7">
              <div className="flex gap-1 mb-7 bg-[#0A0A0A] rounded-xl p-1 border border-[#1C1C1C]">
                {(['apply', 'login'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-[#C9A84C] text-[#060606]' : 'text-white/35 hover:text-white/70'}`}>
                    {t === 'apply' ? 'Apply for Access' : 'Sign In'}
                  </button>
                ))}
              </div>
              {tab === 'apply' ? <SignupForm /> : <LoginForm />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
