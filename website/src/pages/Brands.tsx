import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Search, Shield, MapPin, CheckCircle, ArrowRight, Building2, Eye, EyeOff, Lock, Mail, Bookmark, BookmarkCheck, X, Users, Zap, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'

const SPECIALTIES = ['Landscape', 'Portrait', 'Wedding', 'Commercial', 'Fashion', 'Street', 'Editorial', 'Events', 'Product']
const LOCATIONS = ['New York', 'Los Angeles', 'Chicago', 'Miami', 'London', 'Paris', 'Tokyo', 'Sydney']

const fadeUp: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4,0,0.2,1] } } }
const stagger: Variants = { show: { transition: { staggerChildren: 0.07 } } }

interface Photographer {
  id: string; name: string; username: string; avatar_url: string | null
  bio: string | null; specialty: string[]; location: string | null
  is_pro: boolean; available: boolean; posts_count: number
  followers_count: number; price_range: string | null; cover_url: string | null
}

function PhotographerCard({ p, shortlisted, onShortlist }: { p: Photographer; shortlisted: boolean; onShortlist: () => void }) {
  const specialties = (p.specialty || []).slice(0, 2)
  return (
    <motion.div layout variants={fadeUp} className="card-premium card-glow group relative overflow-hidden">
      {/* Cover/Avatar header */}
      <div className="relative h-28 bg-gradient-to-br from-[#141414] to-[#0A0A0A] overflow-hidden">
        {p.cover_url
          ? <img src={p.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          : <div className="absolute inset-0 grid-bg-sm opacity-40" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={onShortlist}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${shortlisted ? 'bg-[#ecc85c] text-[#0b0b0d]' : 'bg-black/40 text-white/60 hover:bg-black/60 hover:text-white border border-white/10'}`}
        >
          {shortlisted ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
        {p.available && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-green-950/70 border border-green-500/20 rounded-full px-2 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-green-400">Available</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3 mb-3 -mt-8 relative z-10">
          <div className="w-14 h-14 rounded-xl border-2 border-[#0b0b0d] overflow-hidden bg-[#141414] shrink-0 shadow-xl">
            {p.avatar_url
              ? <img src={p.avatar_url} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[#ecc85c]/50">{p.name?.[0]}</div>
            }
          </div>
          <div className="pt-8 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
              {p.is_pro && <span className="text-[8px] font-black text-[#0b0b0d] bg-[#ecc85c] px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
            </div>
            <p className="text-xs text-white/35">@{p.username}</p>
          </div>
        </div>

        {p.bio && <p className="text-xs text-white/45 leading-relaxed mb-3 line-clamp-2">{p.bio}</p>}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {specialties.map(s => (
            <span key={s} className="text-[10px] font-medium text-[#ecc85c]/70 bg-[#ecc85c]/8 border border-[#ecc85c]/12 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {p.location && (
            <span className="flex items-center gap-1 text-[10px] text-white/30">
              <MapPin size={9} /> {p.location}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xs font-bold text-white">{p.posts_count || 0}</p>
              <p className="text-[9px] text-white/25 uppercase tracking-wide">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-white">{(p.followers_count || 0).toLocaleString()}</p>
              <p className="text-[9px] text-white/25 uppercase tracking-wide">Followers</p>
            </div>
          </div>
          {p.price_range && <p className="text-xs font-semibold text-[#ecc85c]">{p.price_range}</p>}
        </div>

        <Link to={`/photographer/${p.id}`} className="mt-4 w-full py-2.5 rounded-xl bg-[#ecc85c]/10 border border-[#ecc85c]/15 text-[#ecc85c] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#ecc85c]/18 hover:border-[#ecc85c]/25 transition-all">
          View Profile <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  )
}

function DiscoveryPortal() {
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [proOnly, setProOnly] = useState(false)
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [tab, setTab] = useState<'discover' | 'shortlist'>('discover')

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('profiles')
      .select('id, name, username, avatar_url, bio, specialty, location, is_pro, available, posts_count, followers_count, price_range, cover_url')
      .eq('is_pro', true)
      .order('followers_count', { ascending: false })
      .limit(24)

    if (availableOnly) q = q.eq('available', true)
    if (location) q = q.ilike('location', `%${location}%`)
    if (search) q = q.or(`name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`)

    const { data } = await q
    let results = (data || []) as Photographer[]
    if (selectedSpecialties.length > 0) {
      results = results.filter(p => selectedSpecialties.some(s => (p.specialty || []).includes(s)))
    }
    setPhotographers(results)
    setLoading(false)
  }, [search, selectedSpecialties, location, availableOnly])

  useEffect(() => {
    const t = setTimeout(load, 350)
    return () => clearTimeout(t)
  }, [load])

  const toggleSpecialty = (s: string) => setSelectedSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  const toggleShortlist = (id: string) => setShortlisted(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const displayed = tab === 'shortlist' ? photographers.filter(p => shortlisted.has(p.id)) : photographers
  const activeFilters = selectedSpecialties.length + (location ? 1 : 0) + (availableOnly ? 1 : 0) + (proOnly ? 1 : 0)

  return (
    <div className="min-h-[600px]">
      {/* Discovery header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search photographers by name, style, or keyword…"
              className="input-dark pl-10 py-3"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showFilters || activeFilters > 0 ? 'bg-[#ecc85c]/10 border-[#ecc85c]/30 text-[#ecc85c]' : 'bg-[#0A0A0A] border-[#1E1E1E] text-white/50 hover:border-[#ecc85c]/20 hover:text-white/70'}`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-[#ecc85c] text-[#0b0b0d] text-[10px] font-black flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="card p-5 mb-4">
                <div className="grid md:grid-cols-3 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-white/35 tracking-wider uppercase mb-3">Specialty</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SPECIALTIES.map(s => (
                        <button key={s} onClick={() => toggleSpecialty(s)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${selectedSpecialties.includes(s) ? 'bg-[#ecc85c]/15 border-[#ecc85c]/40 text-[#ecc85c]' : 'bg-transparent border-[#1E1E1E] text-white/40 hover:border-[#ecc85c]/20 hover:text-white/60'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/35 tracking-wider uppercase mb-3">Location</p>
                    <div className="relative mb-2">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Any city…" className="input-dark pl-8 py-2.5 text-xs" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {LOCATIONS.slice(0, 4).map(l => (
                        <button key={l} onClick={() => setLocation(l === location ? '' : l)}
                          className={`text-[10px] px-2 py-1 rounded border transition-all ${l === location ? 'border-[#ecc85c]/30 text-[#ecc85c] bg-[#ecc85c]/8' : 'border-[#1E1E1E] text-white/30 hover:border-[#1E1E1E] hover:text-white/50'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/35 tracking-wider uppercase mb-3">Options</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Available for hire only', value: availableOnly, set: setAvailableOnly },
                      ].map(opt => (
                        <button key={opt.label} onClick={() => opt.set(!opt.value)}
                          className={`flex items-center gap-3 w-full text-left text-sm transition-colors ${opt.value ? 'text-white' : 'text-white/40 hover:text-white/60'}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${opt.value ? 'bg-[#ecc85c] border-[#ecc85c]' : 'border-[#333]'}`}>
                            {opt.value && <CheckCircle size={10} className="text-[#0b0b0d]" />}
                          </div>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {activeFilters > 0 && (
                  <button onClick={() => { setSelectedSpecialties([]); setLocation(''); setAvailableOnly(false); setProOnly(false) }}
                    className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                    <X size={12} /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-1">
          {[
            { id: 'discover', label: `All Photographers (${photographers.length})` },
            { id: 'shortlist', label: `Shortlist (${shortlisted.size})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`text-sm font-medium pb-3 border-b-2 transition-all ${tab === t.id ? 'text-white border-[#ecc85c]' : 'text-white/35 border-transparent hover:text-white/60'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-white/20" />
          </div>
          <p className="text-white/30 text-sm">{tab === 'shortlist' ? 'No photographers shortlisted yet' : 'No photographers match your filters'}</p>
        </div>
      ) : (
        <motion.div
          layout
          initial="hidden" animate="show" variants={stagger}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {displayed.map(p => (
            <PhotographerCard
              key={p.id}
              p={p}
              shortlisted={shortlisted.has(p.id)}
              onShortlist={() => toggleShortlist(p.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

const NEEDS = ['Editorial', 'Commercial', 'Events', 'Product', 'Fashion', 'Campaign']


function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    onSuccess()
    window.location.href = '/business'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Work Email</label>
        <div className="relative">
          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="input-dark pl-9" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Password</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="input-dark pl-9 pr-10" />
          <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      {error && <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
      <button type="submit" disabled={loading} className="w-full py-3.5 rounded-2xl btn-gold justify-center">
        {loading ? 'Signing in…' : 'Sign In to Brand Portal'}
      </button>
    </form>
  )
}

function SignupForm() {
  const [form, setForm] = useState({ company: '', email: '', website: '' })
  const [needs, setNeeds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const toggle = (n: string) => setNeeds(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: err } = await supabase.from('brand_applications').insert({
      company: form.company.trim(),
      email: form.email.trim().toLowerCase(),
      website: form.website.trim().replace(/^https?:\/\//, ''),
      needs,
      status: 'pending',
    })

    if (err) {
      setError(err.code === '23505' ? 'An application with this email already exists.' : err.message)
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-green-950/30 border border-green-500/20 flex items-center justify-center mx-auto">
        <CheckCircle size={28} className="text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-white">Application Submitted!</h3>
      <p className="text-sm text-white/45 leading-relaxed max-w-xs mx-auto">
        We'll review your request and send login credentials to <span className="text-white font-medium">{form.email}</span> within 24 hours.
      </p>
      <Link to="/business/login" className="btn-gold inline-flex mt-2">Go to Brand Login</Link>
    </motion.div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Company Name *</label>
          <input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="Your company name" required className="input-dark" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Work Email *</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@company.com" required className="input-dark" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Website</label>
          <input value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} placeholder="company.com" className="input-dark" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/35 tracking-wider uppercase mb-2">Photography Needs</label>
        <div className="grid grid-cols-3 gap-2">
          {NEEDS.map(n => (
            <button type="button" key={n} onClick={() => toggle(n)}
              className={`text-xs py-2.5 rounded-xl border transition-all font-medium ${needs.includes(n) ? 'bg-[#ecc85c]/15 border-[#ecc85c]/40 text-[#ecc85c]' : 'bg-[#0A0A0A] border-[#1E1E1E] text-white/40 hover:border-[#ecc85c]/20 hover:text-white/60'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
      <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-2xl btn-gold justify-center disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Request Brand Access'}
      </button>
      <p className="text-[11px] text-white/20 text-center">Our team reviews every application within 24 hours.</p>
    </form>
  )
}

const perks = [
  { icon: Search, title: 'Smart Talent Discovery', desc: 'Search photographers by specialty, location, style, and availability.' },
  { icon: Shield, title: 'Fully Vetted Professionals', desc: 'Every PRO is identity-verified and portfolio-reviewed by our curation team.' },
  { icon: MapPin, title: 'Global Location Search', desc: 'Find the right photographer in any city or region, instantly.' },
  { icon: TrendingUp, title: 'Direct Booking', desc: 'Send hire requests directly. No agency fees, no middleman, no commission.' },
  { icon: Zap, title: 'Fast Turnaround', desc: 'Most photographers respond within 24 hours. Book a shoot in days, not weeks.' },
  { icon: Users, title: 'Shortlist & Compare', desc: 'Build a shortlist, compare portfolios side-by-side, then hire with confidence.' },
]

export default function Brands() {
  const [tab, setTab] = useState<'login' | 'apply'>('apply')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lenzly_brand')
    if (stored) {
      try {
        const d = JSON.parse(stored)
        if (d.expiresAt > Date.now()) setIsLoggedIn(true)
      } catch {}
    }
  }, [])

  return (
    <div className="min-h-screen pt-20">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(201,168,76,0.1) 0%, transparent 70%)' }} className="absolute inset-0" />
          <div className="absolute inset-0 grid-bg opacity-60" />
        </div>
        <div className="max-w-6xl mx-auto px-6 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="badge mb-8 mx-auto">
              <Building2 size={10} />
              Brand Portal
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-6 leading-tight">
              Hire world-class<br /><em className="gold-text">photographers.</em>
            </h1>
            <p className="text-lg md:text-xl text-white/40 max-w-xl mx-auto leading-relaxed font-light mb-10">
              Connect with PRO photographers for editorial, commercial, and brand campaigns. Direct access, no agency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#discover" className="btn-gold text-[15px] px-9 py-4">
                <Search size={16} /> Discover Photographers
              </a>
              <a href="#apply" className="btn-outline text-[15px] px-9 py-4">
                Apply for Brand Access <ArrowRight size={15} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Perks ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {perks.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={fadeUp} className="card-premium card-glow p-5">
              <div className="w-9 h-9 rounded-xl bg-[#ecc85c]/10 border border-[#ecc85c]/10 flex items-center justify-center mb-3">
                <Icon size={16} className="text-[#ecc85c]" />
              </div>
              <p className="text-sm font-semibold text-white mb-1.5">{title}</p>
              <p className="text-xs text-white/35 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Live discovery portal ── */}
      <section id="discover" className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="section-label mb-3">Live Discovery</p>
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-3">Browse the talent pool.</h2>
          <p className="text-sm text-white/35">Real photographers from the Lenzly community. Search, filter, and shortlist for free.</p>
        </div>
        <DiscoveryPortal />
      </section>

      {/* ── Apply / Login ── */}
      <section id="apply" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-14 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="section-label mb-6">Brand Access</p>
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-5 leading-tight">
              {isLoggedIn ? 'Welcome back.' : 'Get full access.'}
            </h2>
            <p className="text-sm text-white/40 leading-relaxed mb-8">
              {isLoggedIn
                ? 'You\'re signed in. Head to your brand portal to manage shortlists and hire requests.'
                : 'Apply for a brand account to send hire requests, save shortlists, and access direct messaging with photographers.'}
            </p>
            <div className="space-y-4">
              {[
                'Unlimited photographer search',
                'Send direct hire requests',
                'Save and manage shortlists',
                'Encrypted direct messaging',
                'Priority support',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#ecc85c]/15 border border-[#ecc85c]/20 flex items-center justify-center shrink-0">
                    <CheckCircle size={11} className="text-[#ecc85c]" />
                  </div>
                  <p className="text-sm text-white/60">{f}</p>
                </div>
              ))}
            </div>
            {isLoggedIn && (
              <Link to="/brand-portal" className="btn-gold mt-8 w-fit">
                Go to Brand Portal <ArrowRight size={15} />
              </Link>
            )}
          </motion.div>

          {!isLoggedIn && (
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="card-premium p-7">
                <div className="flex gap-1 mb-7 bg-[#0A0A0A] rounded-xl p-1 border border-[#1C1C1C]">
                  {(['apply', 'login'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-[#ecc85c] text-[#0b0b0d]' : 'text-white/35 hover:text-white/60'}`}>
                      {t === 'apply' ? 'Apply for Access' : 'Sign In'}
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                    {tab === 'apply' ? <SignupForm /> : <LoginForm onSuccess={() => setIsLoggedIn(true)} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}
