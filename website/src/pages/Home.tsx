import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from 'framer-motion'
import { MapPin, Lock, Briefcase, Camera, Star, ArrowRight, Download, ChevronRight, Shield, Zap, Users, CheckCircle, Play, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useInView } from '../hooks/useInView'

interface Post { id: string; image_url: string; caption: string | null; profiles?: { name: string; avatar_url: string | null } }

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.4, 0, 0.2, 1] } }
}
const stagger: Variants = { show: { transition: { staggerChildren: 0.1 } } }

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

const features = [
  { icon: MapPin, title: 'Community Discovered Locations', desc: 'Photographers tag real shoot spots when they post. Browse the interactive map, see live weather, and get directions to your next location.', tag: 'Discover', color: '#ecc85c' },
  { icon: Briefcase, title: 'Get Hired by Brands', desc: 'Build a PRO profile that clients find. Let brands search and book you directly — no agency, no middleman, no commission cuts.', tag: 'Grow', color: '#ecc85c' },
  { icon: Lock, title: 'End-to-End Encryption', desc: 'Every message is AES-256 encrypted. Discuss rates, share contracts, send previews. Only you and your client can read them.', tag: 'Private', color: '#ecc85c' },
  { icon: Camera, title: 'Stories & Feed', desc: 'Share your work in a community built for photography. No algorithm hiding your posts, no ads diluting your audience.', tag: 'Share', color: '#ecc85c' },
]

const stats = [
  { value: 14000, suffix: '+', label: 'Photographers' },
  { value: 48000, suffix: '+', label: 'Posts Shared' },
  { value: 2000, suffix: '+', label: 'Hires Made' },
  { value: 56, suffix: '+', label: 'Spots Mapped' },
]

const testimonials = [
  { name: 'Marcus T.', role: 'Wedding Photographer, NYC', text: 'Landed three brand deals in my first month. The PRO profile actually converts — brands reach out to me now instead of the other way around.', avatar: 'M', rating: 5 },
  { name: 'Sofia R.', role: 'Fashion Photographer, LA', text: 'The location map alone is worth downloading. I found spots I never would have discovered. The community here actually cares about craft.', avatar: 'S', rating: 5 },
  { name: 'James K.', role: 'Commercial Photographer', text: 'Finally a platform that gets it. The encrypted messaging means I can share contracts and previews without worrying about leaks. Game changer.', avatar: 'J', rating: 5 },
]

const trustedBy = ['Nike', 'Vogue', 'Condé Nast', 'Apple', 'LVMH', 'Netflix', 'Spotify', 'BMW']

const howItWorks = [
  { step: '01', title: 'Create your PRO profile', desc: 'Build your portfolio, set your specialties, and list your availability. Takes under 5 minutes.' },
  { step: '02', title: 'Get discovered by brands', desc: 'Verified brand clients search for photographers by location, style, and specialty. Your profile does the work.' },
  { step: '03', title: 'Connect privately & get paid', desc: 'All negotiations happen in end-to-end encrypted messages. No middleman, no commission.' },
]

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [videoOpen, setVideoOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, image_url, caption, profiles:user_id(name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(9)
      .then(({ data }) => { if (data) setPosts(data as any) })
  }, [])

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center pt-16 overflow-hidden">
        {/* Background layers */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.12) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, #0b0b0d, transparent)' }} />
          <motion.div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#ecc85c]/5 blur-[120px]" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative w-full max-w-6xl mx-auto px-6 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="badge mb-8 mx-auto">
              <Star size={10} className="fill-[#ecc85c]" />
              Built for photographers, by photographers
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-6xl md:text-7xl lg:text-[88px] font-serif font-normal text-white leading-[1.02] mb-7 tracking-tight"
          >
            Your lens.<br />
            <em className="shimmer-text not-italic">Your community.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-white/45 max-w-lg mx-auto leading-relaxed mb-12 font-light"
          >
            Discover real photo locations, get hired by brands, and message clients with military-grade encryption. Free, always.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link to="/signup" className="btn-gold text-[15px] px-9 py-4">
              <Download size={16} />
              Join Free
            </Link>
            <Link to="/login" className="btn-outline text-[15px] px-9 py-4">
              Open Web App
              <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1C1C1C] rounded-2xl overflow-hidden max-w-2xl mx-auto border border-[#1C1C1C]"
          >
            {stats.map(s => (
              <div key={s.label} className="bg-[#0b0b0d] px-6 py-6 text-center">
                <p className="text-2xl md:text-3xl font-bold gold-text mb-1">
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-[11px] text-white/25 font-medium tracking-widest uppercase">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center p-1.5">
            <motion.div className="w-1 h-1.5 rounded-full bg-[#ecc85c]" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Trusted by marquee ── */}
      <section className="py-14 overflow-hidden border-y border-white/5">
        <p className="text-center text-xs text-white/20 tracking-widest uppercase mb-8 font-medium">Trusted by teams at</p>
        <div className="relative">
          <div className="flex gap-16 animate-marquee whitespace-nowrap">
            {[...trustedBy, ...trustedBy].map((b, i) => (
              <span key={i} className="text-white/20 font-bold text-sm tracking-widest uppercase">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-28">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger}
          className="text-center mb-20"
        >
          <motion.p variants={fadeUp} className="section-label mb-5">Everything you need</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-serif text-white mb-5 leading-tight">
            Built for photographers<br /><em className="gold-text">who are serious.</em>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-base text-white/35 max-w-md mx-auto leading-relaxed">Every feature was designed with working photographers in mind — not hobbyists, not influencers.</motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          className="grid md:grid-cols-2 gap-5"
        >
          {features.map(({ icon: Icon, title, desc, tag }) => (
            <motion.div key={title} variants={fadeUp} className="card-premium card-glow p-8 group cursor-default">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#ecc85c]/10 border border-[#ecc85c]/10 flex items-center justify-center group-hover:bg-[#ecc85c]/15 group-hover:border-[#ecc85c]/20 transition-all duration-300">
                  <Icon size={20} className="text-[#ecc85c]" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-[#ecc85c]/45 uppercase border border-[#ecc85c]/12 px-2.5 py-1 rounded-full bg-[#ecc85c]/4">{tag}</span>
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-3 leading-snug">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="relative rounded-3xl overflow-hidden border border-[#1C1C1C] p-12 md:p-16" style={{ background: 'linear-gradient(135deg, #0D0D0D 0%, #080808 100%)' }}>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ecc85c]/20 to-transparent" />
          <div className="absolute inset-0 grid-bg-sm opacity-60 pointer-events-none" />

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
            <motion.p variants={fadeUp} className="section-label mb-5">How it works</motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-serif text-white mb-16 max-w-md leading-tight">
              From download to first hire in under a week.
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.map((s, i) => (
                <motion.div key={s.step} variants={fadeUp} className="relative">
                  {i < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-[#ecc85c]/20 to-transparent -translate-x-4 pointer-events-none" />
                  )}
                  <div className="text-4xl font-serif gold-text mb-4 leading-none">{s.step}</div>
                  <h3 className="text-[16px] font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Community preview ── */}
      {posts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-24">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
              <div>
                <p className="section-label mb-3">Real photographers, real work</p>
                <h2 className="text-3xl md:text-4xl font-serif text-white">From the community</h2>
              </div>
              <Link to="/feed" className="hidden md:flex items-center gap-2 text-sm text-[#ecc85c] hover:text-white transition-colors font-medium">
                View all <ChevronRight size={14} />
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2">
              {posts.slice(0, 9).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Link to={`/post/${p.id}`} className={`block overflow-hidden rounded-xl md:rounded-2xl bg-[#141414] group relative ${i === 0 ? 'row-span-2 aspect-[1/2] md:aspect-square' : 'aspect-square'}`}>
                    <img src={p.image_url} alt={p.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                        {p.profiles?.avatar_url
                          ? <img src={p.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover border border-white/20 shrink-0" />
                          : <div className="w-6 h-6 rounded-full bg-[#ecc85c]/20 border border-[#ecc85c]/30 flex items-center justify-center text-[9px] font-bold text-[#ecc85c] shrink-0">{p.profiles?.name?.[0]}</div>
                        }
                        <span className="text-xs text-white font-medium truncate">{p.profiles?.name}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="text-center mt-8">
              <Link to="/feed" className="btn-outline text-sm py-3 px-8">
                Explore the full feed <ArrowRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* ── Why Lenzly ── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger}
          className="grid md:grid-cols-2 gap-6"
        >
          <motion.div variants={fadeUp} className="card-premium p-10 flex flex-col justify-between min-h-[280px]">
            <div>
              <p className="section-label mb-5">For photographers</p>
              <h3 className="text-2xl font-serif text-white mb-4 leading-snug">Your work. Your clients. Your rules.</h3>
              <p className="text-sm text-white/40 leading-relaxed">No gatekeepers. No commissions. Build your business on a platform that works for you, not against you.</p>
            </div>
            <Link to="/signup" className="btn-gold mt-8 w-fit text-sm py-3 px-6">
              <Download size={14} /> Join Free
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="card-premium p-10 flex flex-col justify-between min-h-[280px]">
            <div>
              <p className="section-label mb-5">For brands</p>
              <h3 className="text-2xl font-serif text-white mb-4 leading-snug">Find the perfect photographer in minutes.</h3>
              <p className="text-sm text-white/40 leading-relaxed">Search 14,000+ verified professionals. Filter by specialty, location, and availability. Hire directly.</p>
            </div>
            <Link to="/brands" className="btn-outline mt-8 w-fit text-sm py-3 px-6">
              Access Brand Portal <ArrowRight size={14} />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="section-label mb-5">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-serif text-white">Photographers love Lenzly.</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                viewport={{ once: true }}
                className="card-premium card-glow p-7 flex flex-col"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={12} className="text-[#ecc85c] fill-[#ecc85c]" />)}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-6 flex-1 italic">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full bg-[#ecc85c]/12 border border-[#ecc85c]/20 flex items-center justify-center text-sm font-bold text-[#ecc85c]">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/30">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Trust indicators ── */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Shield, title: 'AES-256 Encryption', desc: 'All messages encrypted end-to-end' },
            { icon: CheckCircle, title: 'Verified PROs', desc: 'Every PRO account is manually reviewed' },
            { icon: Zap, title: 'No Algorithm', desc: 'Your posts reach 100% of followers' },
            { icon: Users, title: '14K+ Photographers', desc: 'The largest photography community' },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={fadeUp} className="card p-5 text-center card-glow">
              <div className="w-10 h-10 rounded-xl bg-[#ecc85c]/8 border border-[#ecc85c]/10 flex items-center justify-center mx-auto mb-3">
                <Icon size={18} className="text-[#ecc85c]" />
              </div>
              <p className="text-xs font-semibold text-white mb-1">{title}</p>
              <p className="text-[11px] text-white/30 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 py-20 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-[#ecc85c]/12 p-12 md:p-24 text-center"
          style={{ background: 'linear-gradient(135deg, #120E00 0%, #0A0800 50%, #0b0b0d 100%)' }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#ecc85c]/8 blur-[100px]" />
            <div className="absolute inset-0 grid-bg-sm opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ecc85c]/30 to-transparent" />
          </div>
          <div className="relative">
            <p className="section-label mb-6">Free forever</p>
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">Ready to shoot?</h2>
            <p className="text-lg text-white/40 mb-12 max-w-md mx-auto font-light leading-relaxed">Join 14,000+ photographers already building their careers on Lenzly. No credit card, no commitments.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup" className="btn-gold text-[15px] px-10 py-4">
                <Download size={17} /> Join Lenzly Free
              </Link>
              <Link to="/business/login" className="btn-outline text-[15px] px-10 py-4">
                I'm a brand <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Video modal */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-3xl aspect-video bg-[#141417] rounded-2xl border border-[#1C1C1C] flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#ecc85c]/15 border border-[#ecc85c]/20 flex items-center justify-center mx-auto mb-4">
                  <Play size={24} className="fill-[#ecc85c] text-[#ecc85c] ml-1" />
                </div>
                <p className="text-white/40 text-sm">Demo video coming soon</p>
              </div>
            </motion.div>
            <button onClick={() => setVideoOpen(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
