import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Lock, Briefcase, Camera, Star, ArrowRight, Download, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Post { id: string; image_url: string; caption: string | null; profiles?: { name: string; avatar_url: string | null } }

const features = [
  {
    icon: MapPin,
    title: 'Community Discovered',
    desc: 'Photographers tag real locations when they post. Browse the map, see live weather, and get one-tap directions to your next shoot.',
    tag: 'Discover',
  },
  {
    icon: Briefcase,
    title: 'Get Hired',
    desc: 'Build your PRO profile. Let clients find and book you directly — no agency, no middleman, no commission cut.',
    tag: 'Grow',
  },
  {
    icon: Lock,
    title: 'Encrypted Messaging',
    desc: 'Every message is end-to-end encrypted. Discuss rates, share contracts, send previews. Only you and your client can read them.',
    tag: 'Private',
  },
  {
    icon: Camera,
    title: 'Stories & Feed',
    desc: 'Share your work in a community that actually appreciates it. No algorithm hiding your posts from the people who follow you.',
    tag: 'Share',
  },
]

const stats = [
  { value: '14K+', label: 'Photographers' },
  { value: '48K+', label: 'Posts Shared' },
  { value: '2K+', label: 'Hires Made' },
  { value: '56+', label: 'Spots Mapped' },
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
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#060606]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#C9A84C]/5 blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-full px-4 py-2 mb-8">
            <Star size={12} className="text-[#C9A84C] fill-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C] font-medium tracking-wider">Built for photographers, by photographers</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-normal text-white leading-[1.1] mb-6">
            Your lens.<br />
            <span className="gold-text italic">Your community.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            Discover real photo locations, get hired by brands, and message clients privately.
            The photography platform that actually works for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="https://apps.apple.com" className="btn-gold">
              <Download size={16} />
              Download Free — App Store
            </a>
            <Link to="/feed" className="btn-outline">
              Browse the community
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold gold-text">{value}</p>
                <p className="text-xs text-white/30 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#C9A84C] tracking-[0.3em] uppercase mb-4">Everything you need</p>
          <h2 className="text-4xl md:text-5xl font-serif text-white">Built for photographers<br /><em className="gold-text">who are serious.</em></h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc, tag }) => (
            <div key={title} className="card p-8 group hover:border-[#C9A84C]/20 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center">
                  <Icon size={22} className="text-[#C9A84C]" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-[#C9A84C]/50 uppercase border border-[#C9A84C]/20 px-2.5 py-1 rounded-full">{tag}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community preview */}
      {posts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-[#C9A84C] tracking-[0.3em] uppercase mb-2">Real photographers, real work</p>
              <h2 className="text-3xl font-serif text-white">From the community</h2>
            </div>
            <Link to="/feed" className="hidden md:flex items-center gap-2 text-sm text-[#C9A84C] hover:text-white transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {posts.map(p => (
              <div key={p.id} className="aspect-square rounded-2xl overflow-hidden bg-[#141414] group relative">
                <img src={p.image_url} alt={p.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    {p.profiles?.avatar_url && <img src={p.profiles.avatar_url} className="w-6 h-6 rounded-full object-cover" />}
                    <span className="text-xs text-white font-medium">{p.profiles?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6 md:hidden">
            <Link to="/feed" className="btn-outline text-sm py-3 px-6">View all posts</Link>
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1400] to-[#0A0A0A] border border-[#C9A84C]/20 p-12 md:p-16 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#C9A84C]/10 blur-[80px]" />
          </div>
          <div className="relative">
            <p className="text-xs font-semibold text-[#C9A84C] tracking-[0.3em] uppercase mb-4">Free forever</p>
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-4">Ready to shoot?</h2>
            <p className="text-lg text-white/50 mb-8 max-w-md mx-auto">Join thousands of photographers already on Lenzly. It's free.</p>
            <a href="https://apps.apple.com" className="btn-gold text-base px-10 py-4">
              <Download size={18} />
              Download on the App Store
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
