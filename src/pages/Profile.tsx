import { useState } from 'react'
import {
  Settings, Grid3X3, Heart, Bookmark, Instagram,
  ExternalLink, MapPin, CheckCircle, Edit3, Camera,
  ChevronRight, Star, Users, Building2, Share2
} from 'lucide-react'
import { currentUser } from '@/data/mockData'
import { formatCount } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Link } from 'wouter'

type ProfileTab = 'posts' | 'liked' | 'saved'

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [following, setFollowing] = useState(false)
  const u = currentUser

  const tabs: { key: ProfileTab; icon: typeof Grid3X3; label: string }[] = [
    { key: 'posts', icon: Grid3X3, label: 'Posts' },
    { key: 'liked', icon: Heart, label: 'Liked' },
    { key: 'saved', icon: Bookmark, label: 'Saved' },
  ]

  return (
    <div className="min-h-screen bg-lenz-bg pb-24">
      {/* Cover photo */}
      <div className="relative h-48 overflow-hidden">
        <img src={u.coverPhoto} alt="cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-lenz-bg" />

        {/* Top actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2 safe-top">
          <button className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white transition-colors">
            <Share2 size={17} />
          </button>
          <button className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white transition-colors">
            <Settings size={17} />
          </button>
        </div>

        {/* LENZLY logo top-left */}
        <div className="absolute top-4 left-4 safe-top">
          <h1 className="text-lg font-bold tracking-[0.15em] gold-text">LENZLY</h1>
        </div>
      </div>

      {/* Avatar + edit */}
      <div className="px-4 -mt-14 relative z-10">
        <div className="flex items-end justify-between">
          <div className={u.verified ? 'story-ring' : 'story-ring-seen'} style={{ padding: '3px' }}>
            <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-lenz-bg">
              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {u.pro ? (
              <button className="btn-primary text-xs py-2 px-4">Edit Profile</button>
            ) : (
              <button className="btn-ghost text-xs py-2 px-4">Edit Profile</button>
            )}
            <button className="w-9 h-9 rounded-full bg-lenz-card border border-lenz-border flex items-center justify-center">
              <Edit3 size={15} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* Name + badges */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white">{u.name}</h2>
            {u.verified && <CheckCircle size={16} className="text-gold fill-gold/20" />}
            {u.pro && (
              <span className="text-[10px] font-bold tracking-widest text-lenz-bg bg-gold px-2 py-0.5 rounded-full">PRO</span>
            )}
            {u.secondShooter && (
              <span className="text-[10px] font-bold tracking-widest text-gold border border-gold/40 bg-gold/10 px-2 py-0.5 rounded-full">2nd Shooter</span>
            )}
          </div>
          <p className="text-sm text-white/40 mt-0.5">@{u.username}</p>
        </div>

        {/* Bio */}
        <p className="text-sm text-white/70 mt-3 leading-relaxed">{u.bio}</p>

        {/* Meta links */}
        <div className="flex flex-col gap-1.5 mt-3">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-white/30" />
            <span className="text-sm text-white/50">{u.location}</span>
          </div>
          <button className="flex items-center gap-1.5 group">
            <Instagram size={13} className="text-white/30 group-hover:text-[#E1306C] transition-colors" />
            <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">{u.instagram}</span>
          </button>
          <button className="flex items-center gap-1.5 group">
            <ExternalLink size={13} className="text-white/30 group-hover:text-gold transition-colors" />
            <span className="text-sm text-white/50 group-hover:text-gold transition-colors">{u.portfolio}</span>
          </button>
        </div>

        {/* Specialty badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {u.specialty.map(s => (
            <span key={s} className="flex items-center gap-1 text-[11px] font-medium text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              <Camera size={9} className="text-white/30" />
              {s}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 py-4 border-t border-b border-lenz-border">
          {[
            { label: 'Posts', value: u.posts },
            { label: 'Followers', value: formatCount(u.followers) },
            { label: 'Following', value: u.following },
            { label: 'Hired', value: u.hired },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-base font-bold text-white">{value}</p>
              <p className="text-[10px] text-white/30 mt-0.5 tracking-wide">{label}</p>
            </div>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between py-3 border-b border-lenz-border">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-gold fill-gold" />
            <span className="text-sm font-semibold text-white">{u.rating} Rating</span>
            <span className="text-xs text-white/30">from {u.hired} clients</span>
          </div>
          <span className="text-xs text-gold font-medium">{u.priceRange}</span>
        </div>

        {/* For Brands Banner */}
        <Link href="/brands">
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-lenz-card to-lenz-card2 border border-gold/20 flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Building2 size={15} className="text-gold" />
              </div>
              <div>
                <p className="text-xs font-bold text-gold tracking-wide">Get Discovered by Brands</p>
                <p className="text-[11px] text-white/30">Upgrade to Pro · Get discovered by top brands &amp; publications</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-gold/50 group-hover:text-gold transition-colors shrink-0" />
          </div>
        </Link>
      </div>

      {/* Tab selector */}
      <div className="flex border-b border-lenz-border mt-4 sticky top-0 z-30 bg-lenz-bg">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium tracking-wide uppercase border-b-2 transition-all',
              activeTab === key
                ? 'text-gold border-gold'
                : 'text-white/25 border-transparent hover:text-white/40'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-0.5 mt-0.5">
        {u.photos.map((photo, i) => (
          <div key={i} className="photo-grid-item">
            <img src={photo} alt="" loading="lazy" />
          </div>
        ))}
      </div>

      {/* Upgrade to Pro CTA (if not pro) */}
      {!u.pro && (
        <div className="mx-4 mt-6 p-5 rounded-2xl bg-gradient-to-br from-lenz-card via-lenz-card2 to-lenz-card border border-gold/20 text-center">
          <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center mx-auto mb-3">
            <Camera size={22} className="text-lenz-bg" />
          </div>
          <h3 className="font-bold text-white text-base mb-1">Go Pro</h3>
          <p className="text-xs text-white/40 mb-4 leading-relaxed">
            Get verified, appear in brand searches, unlock analytics, and get discovered by leading publications, luxury brands, and commercial clients.
          </p>
          <button className="btn-primary w-full">Upgrade to LENZLY Pro</button>
          <p className="text-[10px] text-white/20 mt-2">Starting at $5/month</p>
        </div>
      )}
    </div>
  )
}
