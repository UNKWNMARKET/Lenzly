import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Lock, Briefcase, Camera, Star, ArrowRight, Download, ChevronRight, Shield, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Post { id: string; image_url: string; caption: string | null; profiles?: { name: string; avatar_url: string | null } }

const features = [
  {
    icon: MapPin,
    title: 'Community Discovered Locations',
    desc: 'Photographers tag real shoot spots when they post. Browse the interactive map, check live weather conditions, and get one-tap directions to your next location.',
    tag: 'Discover',
  },
  {
    icon: Briefcase,
    title: 'Get Hired by Brands',
    desc: 'Build a PRO profile that clients actually find. Let brands search and book you directly — no agency fees, no middleman taking a cut of your work.',
    tag: 'Grow',
  },
  {
    icon: Lock,
    title: 'End-to-End Encrypted Messaging',
    desc: 'Every conversation is end-to-end encrypted. Discuss rates, share contracts, send previews. Only you and your client can ever read them.',
    tag: 'Private',
  },
  {
    icon: Camera,
    title: 'Stories & Community Feed',
    desc: 'Share your work in a community built around photography. No algorithm suppressing your posts, no ads competing with your art.',
    tag: 'Share',
  },
]

const stats = [
  { value: '14K+', label: 'Photographers' },
  { value: '48K+', label: 'Posts Shared' },
  { value: '2K+', label: 'Hires Made' },
  { value: '56+', label: 'Spots Mapped' },
]

const testimonials = [
  { name: 'Marcus T.', role: 'Wedding Photographer', text: 'Landed three brand deals in my first month. The PRO profile actually works.', avatar: 'M' },
  { name: 'Sofia R.', role: 'Fashion Photographer', text: 'The location map alone is worth it. Found spots I never would have discovered on my own.', avatar: 'S' },
  { name: 'James K.', role: 'Commercial Photographer', text: 'Finally a platform that gets photographers. No noise, just the community.', avatar: 'J' },
]

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, image_url, caption, profiles:user_id(name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => { if (data) setPosts(data as any) })
  }, [])

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060606]/50 to-[#060606]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#C9A84C]/4 blur-[150px]" />
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-[#C9A84C]/3 blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2.5 bg-[#C9A84C]/8 border border-[#C9A84C]/15 rounded-full px-5 py-2.5 mb-10">
            <Star size={11} className="text-[#C9A84C] fill-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C] font-medium tracking-wider">Built for photographers, by photographers</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-normal text-white leading-[1.05] mb-7 tracking-tight">
            Your lens.<br />
            <span className="shimmer italic">Your community.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/45 max-w-xl mx-auto leading-relaxed mb-12 font-light">
            Discover real photo locations, get hired by brands, and message clients privately. The photography platform that actually works for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <a href="https://apps.apple.com" className="btn-gold text-[15px] px-8 py-4">
              <Download size={16} />
              Download Free on App Store
            </a>
            <Link to="/feed" className="btn-outline text-[15px] px-8 py-4">
              Browse the community
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1A1A1A] rounded-2xl overflow-hidden max-w-2xl mx-auto border border-[#1A1A1A]">
            {stats.map(({ value, label }) => (
              <div key={label} className="bg-[#060606] px-6 py-6 text-center">
                <p className="text-2xl font-bold gold-text mb-1">{value}</p>
                <p className="text-[11px] text-white/30 font-medium tracking-wide uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-28">
        <div className="text-center mb-20">
          <p className="section-label mb-5">Everything you need</p>
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-5 leading-tight">
            Built for photographers<br /><em className="gold-text">who are serious.</em>
          </h2>
          <p className="text-base text-white/40 max-w-md mx-auto">Every feature was designed with working photographers in mind.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc, tag }) => (
            <div key={title} className="card card-hover p-8 group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/10 flex items-center justify-center">
                  <Icon size={20} className="text-[#C9A84C]" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-[#C9A84C]/50 uppercase border border-[#C9A84C]/15 px-2.5 py-1 rounded-full bg-[#C9A84C]/5">{tag}</span>
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-3 leading-snug">{title}</h3>
              <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Lenzly */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0E0E0E] to-[#060606] border border-[#1C1C1C] p-12 md:p-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A84C]/4 blur-[120px] rounded-full" />
          </div>
          <div className="relative grid md:grid-cols-3 gap-10">
            <div>
              <p className="section-label mb-5">Why Lenzly</p>
              <h2 className="text-3xl font-serif text-white leading-tight">The platform photographers actually trust.</h2>
            </div>
            <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
              {[
                { icon: Shield, title: 'Privacy First', desc: 'All messages are end-to-end encrypted. Your conversations stay between you and your clients.' },
                { icon: Zap, title: 'No Algorithm', desc: 'Your posts reach your followers. No pay-to-play, no shadowbanning, no surprises.' },
                { icon: Briefcase, title: 'Real Clients', desc: 'Verified brand accounts only. Every hire request comes from a real business.' },
                { icon: MapPin, title: 'Real Locations', desc: 'Every pin on the map was tagged by a photographer who actually shot there.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-[#C9A84C]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">{title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community preview */}
      {posts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-3">Real photographers, real work</p>
              <h2 className="text-3xl md:text-4xl font-serif text-white">From the community</h2>
            </div>
            <Link to="/feed" className="hidden md:flex items-center gap-2 text-sm text-[#C9A84C] hover:text-white transition-colors font-medium">
              View all posts <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {posts.map(p => (
              <Link key={p.id} to={`/post/${p.id}`} className="aspect-square rounded-2xl overflow-hidden bg-[#141414] group relative">
                <img src={p.image_url} alt={p.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                    {p.profiles?.avatar_url
                      ? <img src={p.profiles.avatar_url} className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0" />
                      : <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[10px] font-bold text-[#C9A84C] shrink-0">{p.profiles?.name?.[0]}</div>
                    }
                    <span className="text-xs text-white font-medium truncate">{p.profiles?.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6 md:hidden">
            <Link to="/feed" className="btn-outline text-sm py-3 px-6">View all posts</Link>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <p className="section-label mb-4">Testimonials</p>
          <h2 className="text-3xl font-serif text-white">Photographers love it.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map(t => (
            <div key={t.name} className="card card-hover p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-[#C9A84C] fill-[#C9A84C]" />)}
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#C9A84C]/15 border border-[#C9A84C]/20 flex items-center justify-center text-sm font-bold text-[#C9A84C]">{t.avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/35">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-16 pb-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1200] via-[#0E0A00] to-[#060606] border border-[#C9A84C]/15 p-12 md:p-20 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#C9A84C]/10 blur-[80px]" />
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(201,168,76,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>
          <div className="relative">
            <p className="section-label mb-5">Free forever</p>
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-5 leading-tight">Ready to shoot?</h2>
            <p className="text-lg text-white/45 mb-10 max-w-md mx-auto font-light">Join thousands of photographers already building their careers on Lenzly.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="https://apps.apple.com" className="btn-gold text-[15px] px-10 py-4">
                <Download size={17} />
                Download on the App Store
              </a>
              <Link to="/feed" className="btn-outline text-[15px] px-10 py-4">
                Explore the community
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
