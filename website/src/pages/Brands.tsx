import { useState } from 'react'
import { Search, Shield, MapPin, TrendingUp, CheckCircle, ArrowRight, Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react'

const API = 'http://localhost:3001/api/brand'
const NEEDS = ['Editorial', 'Commercial', 'Events', 'Product', 'Fashion', 'Campaign']

const perks = [
  { icon: Search, title: 'Talent Discovery', desc: 'Search verified PRO photographers by specialty, location, and style.' },
  { icon: Shield, title: 'Vetted Professionals', desc: 'Every PRO is identity-verified and portfolio-reviewed.' },
  { icon: MapPin, title: 'Location Search', desc: 'Find the right photographer in any city or region.' },
  { icon: TrendingUp, title: 'Direct Booking', desc: 'Send hire requests directly. No agency fees, no middleman.' },
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
        <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Work Email</label>
        <div className="relative">
          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
            className="w-full bg-[#141414] border border-[#222] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Password</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
            className="w-full bg-[#141414] border border-[#222] rounded-xl pl-9 pr-10 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40" />
          <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      {error && <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full py-3.5 rounded-2xl bg-[#C9A84C] text-[#060606] font-bold text-sm disabled:opacity-50">
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
    <div className="text-center py-6 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-green-950/30 border border-green-500/20 flex items-center justify-center mx-auto">
        <CheckCircle size={26} className="text-green-400" />
      </div>
      <h3 className="text-lg font-bold text-white">Application Submitted!</h3>
      <p className="text-sm text-white/50">We'll send login credentials to <span className="text-white">{email}</span> within 24 hours.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Company Name *</label>
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company..." required
          className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Work Email *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
          className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Website</label>
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="company.com"
          className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/40" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/40 tracking-wider uppercase mb-1.5">Photography Needs</label>
        <div className="grid grid-cols-3 gap-2">
          {NEEDS.map(n => (
            <button type="button" key={n} onClick={() => toggle(n)}
              className={`text-xs py-2 rounded-xl border transition-all ${needs.includes(n) ? 'bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]' : 'bg-[#141414] border-[#222] text-white/50 hover:border-[#C9A84C]/20'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <button type="submit" disabled={submitting}
        className="w-full py-3.5 rounded-2xl bg-[#C9A84C] text-[#060606] font-bold text-sm disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Request Brand Access'}
      </button>
      <p className="text-[10px] text-white/25 text-center">Our team reviews requests within 24 hours.</p>
    </form>
  )
}

export default function Brands() {
  const [tab, setTab] = useState<'login' | 'apply'>('apply')

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-full px-4 py-2 mb-6">
            <Building2 size={12} className="text-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C] font-medium tracking-wider">Brand Portal</span>
          </div>
          <h1 className="text-5xl font-serif text-white mb-4">
            Hire world-class<br /><em className="gold-text">photographers.</em>
          </h1>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            Connect with verified PRO photographers for editorial, commercial, and brand campaigns. Direct access, no agency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Perks */}
          <div className="space-y-5">
            <p className="text-xs font-semibold text-[#C9A84C] tracking-[0.3em] uppercase mb-6">What you get</p>
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={18} className="text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{title}</p>
                  <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}

            <div className="card p-6 mt-8">
              <p className="text-xs text-white/30 tracking-widest uppercase mb-3">Already have an account?</p>
              <p className="text-sm text-white/60 mb-4">Access your brand dashboard to search photographers, manage your shortlist, and track hire requests.</p>
              <button onClick={() => setTab('login')} className="flex items-center gap-2 text-sm text-[#C9A84C] font-medium hover:text-white transition-colors">
                Sign in to Brand Portal <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Form */}
          <div>
            <div className="card p-6">
              <div className="flex gap-1 mb-6 bg-[#141414] rounded-xl p-1">
                {(['apply', 'login'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all capitalize ${tab === t ? 'bg-[#C9A84C] text-[#060606]' : 'text-white/40 hover:text-white'}`}>
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
