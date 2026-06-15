import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useMotionValue, useSpring, type Variants } from 'framer-motion'
import { MapPin, Lock, Briefcase, Camera, Star, ArrowRight, Download, ChevronRight, Shield, Zap, Users, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Post { id: string; image_url: string; caption: string | null; profiles?: { name: string; avatar_url: string | null } }

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }
}
const stagger: Variants = { show: { transition: { staggerChildren: 0.1 } } }
const staggerFast: Variants = { show: { transition: { staggerChildren: 0.06 } } }

const features = [
  { icon: MapPin, title: 'Community Discovered Locations', desc: 'Photographers tag real shoot spots when they post. Browse the interactive map, see live weather, and get directions to your next location.', tag: 'Discover' },
  { icon: Briefcase, title: 'Get Hired by Brands', desc: 'Build a PRO profile that clients find. Let brands search and book you directly — no agency, no middleman, no commission cuts.', tag: 'Grow' },
  { icon: Lock, title: 'End-to-End Encryption', desc: 'Every message is AES-256 encrypted. Discuss rates, share contracts, send previews. Only you and your client can read them.', tag: 'Private' },
  { icon: Camera, title: 'Stories & Feed', desc: 'Share your work in a community built for photography. No algorithm hiding your posts, no ads diluting your audience.', tag: 'Share' },
]

const highlights = [
  { value: 'Free', label: 'Forever' },
  { value: 'AES-256', label: 'Encrypted DMs' },
  { value: 'GPS', label: 'Location Maps' },
  { value: 'Direct', label: 'No Commission' },
]

const howItWorks = [
  { step: '01', title: 'Create your PRO profile', desc: 'Build your portfolio, set your specialties, and list your availability. Takes under 5 minutes.' },
  { step: '02', title: 'Get discovered by brands', desc: 'Verified brand clients search for photographers by location, style, and specialty. Your profile does the work.' },
  { step: '03', title: 'Connect privately & get paid', desc: 'All negotiations happen in end-to-end encrypted messages. No middleman, no commission.' },
]

const tickerItems = [
  '✦ Free forever',
  '✦ AES-256 encryption',
  '✦ No algorithm',
  '✦ Direct brand bookings',
  '✦ GPS location maps',
  '✦ Community first',
  '✦ No commission cuts',
  '✦ Built for photographers',
]

// 3D tilt card hook
function useTilt() {
  const ref = useRef<HTMLDivElement>(null)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(4px)`
  }, [])
  const handleMouseLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateZ(0)'
  }, [])
  return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave }
}

function FeatureCard({ icon: Icon, title, desc, tag, delay }: { icon: any; title: string; desc: string; tag: string; delay: number }) {
  const tilt = useTilt()
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      className="card-premium card-glow p-8 group cursor-default"
      style={{ transition: 'border-color 0.3s, box-shadow 0.3s' }}
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="flex items-start justify-between mb-6">
        <motion.div
          whileHover={{ scale: 1.15, rotate: -6 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-12 h-12 rounded-2xl bg-[#ecc85c]/10 border border-[#ecc85c]/10 flex items-center justify-center"
        >
          <Icon size={20} className="text-[#ecc85c]" />
        </motion.div>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.2 }}
          className="text-[10px] font-bold tracking-widest text-[#ecc85c]/45 uppercase border border-[#ecc85c]/12 px-2.5 py-1 rounded-full bg-[#ecc85c]/4"
        >{tag}</motion.span>
      </div>
      <h3 className="text-[17px] font-semibold text-white mb-3 leading-snug">{title}</h3>
      <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
      <motion.div
        className="mt-6 h-px bg-gradient-to-r from-[#ecc85c]/20 to-transparent"
        initial={{ scaleX: 0, originX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: delay + 0.3 }}
      />
    </motion.div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set())
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  // Smooth mouse parallax for hero orb
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 40)
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 40)
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, image_url, caption, user_id')
      .order('created_at', { ascending: false })
      .limit(9)
      .then(async ({ data }) => {
        if (!data) return
        const userIds = [...new Set(data.map((p: any) => p.user_id))]
        const { data: profilesData } = await supabase.from('profiles')
          .select('id, name, avatar_url').in('id', userIds)
        const map: Record<string, any> = {}
        for (const pr of profilesData ?? []) map[pr.id] = pr
        setPosts(data.map((p: any) => ({ ...p, profiles: map[p.user_id] ?? null })) as any)
      })
  }, [])

  const tickerDuped = [...tickerItems, ...tickerItems]

  return (
    <div className="overflow-x-hidden">
      {/* ── Announcement ticker ── */}
      <div className="border-b border-[#ecc85c]/8 bg-[#ecc85c]/[0.03] py-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-ticker">
          {tickerDuped.map((item, i) => (
            <span key={i} className="text-[11px] text-[#ecc85c]/50 font-medium tracking-widest mx-8 shrink-0">{item}</span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center pt-24 overflow-hidden">
        {/* Cursor spotlight */}
        <div
          className="pointer-events-none fixed z-0 w-[600px] h-[600px] rounded-full transition-all duration-300"
          style={{
            left: mousePos.x - 300,
            top: mousePos.y - 300,
            background: 'radial-gradient(circle, rgba(236,200,92,0.04) 0%, transparent 70%)',
          }}
        />

        {/* Background layers */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.12) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, #0b0b0d, transparent)' }} />
          {/* Mouse-following orb */}
          <motion.div
            style={{ x: springX, y: springY }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-full h-full orb-gold" />
          </motion.div>
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative w-full max-w-6xl mx-auto px-6 py-24 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="badge badge-pulse mb-8 mx-auto">
              <Star size={10} className="fill-[#ecc85c]" />
              Built for photographers, by photographers
            </div>
          </motion.div>

          {/* Headline */}
          <div className="overflow-hidden">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="text-6xl md:text-7xl lg:text-[88px] font-serif font-normal text-white leading-[1.02] mb-7 tracking-tight"
            >
              Your lens.<br />
              <em className="shimmer-text not-italic">Your community.</em>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-lg md:text-xl text-white/45 max-w-lg mx-auto leading-relaxed mb-12 font-light"
          >
            Discover real photo locations, get hired by brands, and message clients with military-grade encryption. Free, always.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/signup" className="btn-gold text-[15px] px-9 py-4">
                <Download size={16} />
                Join Free
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/login" className="btn-outline text-[15px] px-9 py-4">
                Open Web App
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>

          {/* Highlights grid */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1C1C1C] rounded-2xl overflow-hidden max-w-2xl mx-auto border border-[#1C1C1C]"
          >
            {highlights.map((h, i) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                whileHover={{ backgroundColor: 'rgba(236,200,92,0.04)' }}
                className="bg-[#0b0b0d] px-6 py-6 text-center transition-colors"
              >
                <p className="text-lg md:text-xl font-bold gold-text mb-1">{h.value}</p>
                <p className="text-[11px] text-white/25 font-medium tracking-widest uppercase">{h.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-white/20 tracking-widest uppercase mb-1">Scroll</span>
          <motion.div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center p-1.5">
            <motion.div
              className="w-1 h-1.5 rounded-full bg-[#ecc85c]"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
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
          <motion.p variants={fadeUp} className="text-base text-white/35 max-w-md mx-auto leading-relaxed">
            Every feature was designed with working photographers in mind — not hobbyists, not influencers.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={stagger}
          className="grid md:grid-cols-2 gap-5"
        >
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.1} />
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

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Animated connector line */}
              <motion.div
                className="hidden md:block absolute top-5 left-[33%] right-[33%] h-px bg-gradient-to-r from-[#ecc85c]/30 via-[#ecc85c]/15 to-[#ecc85c]/30"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ originX: 0 }}
              />
              {howItWorks.map((s, i) => (
                <motion.div key={s.step} variants={fadeUp} className="relative">
                  <motion.div
                    className="text-5xl font-serif gold-text mb-4 leading-none"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                  >
                    {s.step}
                  </motion.div>
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
              <Link to="/feed" className="hidden md:flex items-center gap-2 text-sm text-[#ecc85c] hover:text-white transition-colors font-medium group">
                View all <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <div className="grid grid-cols-3 gap-2">
              {posts.filter(p => p.image_url && !brokenImgs.has(p.id)).slice(0, 9).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.94, y: 16 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                  viewport={{ once: true }}
                  whileHover={{ zIndex: 10, scale: 1.02 }}
                  className="relative"
                >
                  <Link to={`/post/${p.id}`} className={`block overflow-hidden rounded-xl md:rounded-2xl bg-[#141414] group relative ${i === 0 ? 'row-span-2 aspect-[1/2] md:aspect-square' : 'aspect-square'}`}>
                    <img
                      src={p.image_url}
                      alt=""
                      onError={() => setBrokenImgs(prev => new Set(prev).add(p.id))}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                        {p.profiles?.avatar_url
                          ? <img src={p.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover border border-white/20 shrink-0" />
                          : <div className="w-6 h-6 rounded-full bg-[#ecc85c]/20 border border-[#ecc85c]/30 flex items-center justify-center text-[9px] font-bold text-[#ecc85c] shrink-0">{p.profiles?.name?.[0]}</div>
                        }
                        <span className="text-xs text-white font-medium truncate">{p.profiles?.name}</span>
                      </div>
                    </div>
                    {/* Gold shimmer on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ecc85c]/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} className="text-center mt-8">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/feed" className="btn-outline text-sm py-3 px-8">
                  Explore the full feed <ArrowRight size={14} />
                </Link>
              </motion.div>
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
          {[
            {
              label: 'For photographers',
              title: 'Your work. Your clients. Your rules.',
              desc: 'No gatekeepers. No commissions. Build your business on a platform that works for you, not against you.',
              cta: 'Join Free', ctaIcon: Download, href: '/signup', gold: true,
            },
            {
              label: 'For brands',
              title: 'Find the perfect photographer in minutes.',
              desc: 'Search photographers by specialty, location, and availability. Hire directly — no agency, no commission.',
              cta: 'Access Brand Portal', ctaIcon: ArrowRight, href: '/brands', gold: false,
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="card-premium p-10 flex flex-col justify-between min-h-[280px] group"
            >
              <div>
                <p className="section-label mb-5">{card.label}</p>
                <h3 className="text-2xl font-serif text-white mb-4 leading-snug">{card.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{card.desc}</p>
              </div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to={card.href} className={`mt-8 w-fit text-sm py-3 px-6 ${card.gold ? 'btn-gold' : 'btn-outline'}`}>
                  <card.ctaIcon size={14} /> {card.cta}
                </Link>
              </motion.div>
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ecc85c]/30 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Trust indicators ── */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerFast}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Shield, title: 'AES-256 Encryption', desc: 'All messages encrypted end-to-end' },
            { icon: CheckCircle, title: 'Verified PROs', desc: 'Every PRO account is manually reviewed' },
            { icon: Zap, title: 'No Algorithm', desc: 'Your posts reach 100% of followers' },
            { icon: Users, title: 'Built for Pros', desc: 'A community focused on photography' },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -3, borderColor: 'rgba(236,200,92,0.25)' }}
              className="card p-5 text-center card-glow"
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 rounded-xl bg-[#ecc85c]/8 border border-[#ecc85c]/10 flex items-center justify-center mx-auto mb-3"
              >
                <Icon size={18} className="text-[#ecc85c]" />
              </motion.div>
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
          {/* Floating orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#ecc85c]/8 blur-[100px]" />
            <div className="absolute inset-0 grid-bg-sm opacity-50" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ecc85c]/30 to-transparent" />
            <motion.div
              className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#ecc85c]/5 blur-[60px]"
              animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#ecc85c]/4 blur-[80px]"
              animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </div>
          <div className="relative">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="section-label mb-6"
            >Free forever</motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight"
            >Ready to shoot?</motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-white/40 mb-12 max-w-md mx-auto font-light leading-relaxed"
            >Join photographers building their careers on Lenzly. No credit card, no commitments.</motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link to="/signup" className="btn-gold text-[15px] px-10 py-4">
                  <Download size={17} /> Join Lenzly Free
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/business/login" className="btn-outline text-[15px] px-10 py-4">
                  I'm a brand <ArrowRight size={15} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
