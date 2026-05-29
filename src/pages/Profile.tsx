import { useState, useEffect, useCallback } from 'react'
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import AppLogo from '@/components/AppLogo'
import VerifiedBadge from '@/components/VerifiedBadge'
import {
  Settings, Grid3X3, Heart, Bookmark,
  ExternalLink, MapPin, Edit3, Camera,
  ChevronRight, Star, Building2, Share2, X,
  ChevronLeft, MessageSquare, MoreVertical, Archive, Trash2
} from 'lucide-react'
import { currentUser, photographers } from '@/data/mockData'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatCount } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Link, useLocation } from 'wouter'

type ProfileTab = 'posts' | 'liked' | 'saved'
type ModalType = 'followers' | 'following' | 'photo' | 'reviews' | null

// Mock liked/saved posts (different from the posts grid)
const likedPhotos = currentUser.photos.slice(0, 6).reverse()
const savedPhotos = currentUser.photos.slice(3)

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts')
  const [modal, setModal] = useState<ModalType>(null)
  const [mockSelectedPhoto, setMockSelectedPhoto] = useState<string | null>(null)
  const [, navigate] = useLocation()
  const { user, profile, refreshProfile } = useAuth()

  type MyPost = {
    id: string
    image_url: string
    likes_count: number
    comments_count: number
    caption: string | null
    archived: boolean
  }

  // The current user's own uploaded posts
  const [myPosts, setMyPosts] = useState<MyPost[]>([])
  const [selectedPost, setSelectedPost] = useState<MyPost | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [postMenuOpen, setPostMenuOpen] = useState(false)

  // Derived for backwards-compat
  const selectedPostId = selectedPost?.id ?? null
  const selectedPhoto = selectedPost?.image_url ?? null

  const loadMyPosts = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('posts')
      .select('id, image_url, likes_count, comments_count, caption, archived')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setMyPosts(data.filter(p => p.image_url) as MyPost[])
  }, [user])

  useEffect(() => { loadMyPosts() }, [loadMyPosts])

  const ptr = usePullToRefresh({ onRefresh: async () => { await refreshProfile(); await loadMyPosts() } })

  const handleDeletePost = async () => {
    if (!selectedPostId || !user) return
    setDeleting(true)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', selectedPostId)
      .eq('user_id', user.id)
    setDeleting(false)
    if (error) { toast.error('Could not delete post'); return }
    setMyPosts(prev => prev.filter(p => p.id !== selectedPostId))
    toast.success('Post deleted')
    closeModal()
  }

  const handleArchivePost = async () => {
    if (!selectedPostId || !user) return
    setArchiving(true)
    const { error } = await supabase
      .from('posts')
      .update({ archived: true })
      .eq('id', selectedPostId)
      .eq('user_id', user.id)
    setArchiving(false)
    if (error) { toast.error('Could not archive post'); return }
    setMyPosts(prev => prev.filter(p => p.id !== selectedPostId))
    toast.success('Post archived')
    closeModal()
  }

  // Merge real Supabase profile data over mock for the fields that users can edit.
  // Everything else (photos grid, cover, rating, etc.) falls back to mock data
  // until those columns are added to the database.
  // If the user has a real Supabase profile, use ONLY real data (blank for new users).
  // Only fall back to mock currentUser when there is NO profile at all (logged out / loading).
  const hasRealProfile = !!profile

  const u = {
    // Static mock fields used only as shape — real values override everything below
    ...currentUser,
    name:        profile?.name       ?? currentUser.name,
    username:    profile?.username   ?? currentUser.username,
    bio:         profile?.bio        ?? (hasRealProfile ? '' : currentUser.bio),
    location:    profile?.location   ?? (hasRealProfile ? null : currentUser.location),
    website:     profile?.website    ?? null,
    specialty:   profile?.specialty?.length ? profile.specialty : (hasRealProfile ? [] : currentUser.specialty),
    // Only real uploaded photos — never mock grid
    avatar:      profile?.avatar_url  ?? null,
    coverPhoto:  profile?.cover_url   ?? (hasRealProfile ? null : currentUser.coverPhoto),
    // Real counts or zero — never mock numbers
    followers:   profile?.followers_count ?? 0,
    following:   profile?.following_count ?? 0,
    posts:       hasRealProfile ? myPosts.length : currentUser.posts,
    pro:         profile?.is_pro          ?? false,
    // These only come from real data — new profiles show nothing
    photos:      hasRealProfile ? [] : currentUser.photos,
    hired:       hasRealProfile ? 0  : currentUser.hired,
    rating:      hasRealProfile ? 0  : currentUser.rating,
    verified:    hasRealProfile ? false : currentUser.verified,
    secondShooter: hasRealProfile ? false : currentUser.secondShooter,
    available:   hasRealProfile ? false : currentUser.available,
    priceRange:  hasRealProfile ? ''  : currentUser.priceRange,
  }

  const tabs: { key: ProfileTab; icon: typeof Grid3X3; label: string }[] = [
    { key: 'posts', icon: Grid3X3, label: 'Posts' },
    { key: 'liked', icon: Heart, label: 'Liked' },
    { key: 'saved', icon: Bookmark, label: 'Saved' },
  ]

  const tabPhotos = {
    posts:  u.photos,                              // real uploads (empty for new users)
    liked:  hasRealProfile ? [] : likedPhotos,     // blank until real likes are tracked
    saved:  hasRealProfile ? [] : savedPhotos,     // blank until real saves are tracked
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${u.name} on LENZLY`,
        text: u.bio,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Profile link copied!')
    }
  }

  const openPhoto = (src: string) => {
    setMockSelectedPhoto(src)
    setModal('photo')
  }

  const closeModal = () => {
    setModal(null)
    setMockSelectedPhoto(null)
    setSelectedPost(null)
    setPostMenuOpen(false)
  }

  return (
    <PullToRefreshWrapper {...ptr} className="h-[100dvh] bg-lenz-bg">
    <div className="min-h-full pb-24">
      {/* Cover photo */}
      <div className="relative h-48 overflow-hidden bg-lenz-card">
        {u.coverPhoto
          ? <img src={u.coverPhoto} alt="cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#0a0804]" />
        }
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-lenz-bg" />

        {/* Top actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2 safe-top">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white transition-colors"
          >
            <Share2 size={17} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white transition-colors"
          >
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
            <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-lenz-bg bg-lenz-card">
              {u.avatar
                ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white/40">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
              }
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {u.pro ? (
              <button
                onClick={() => navigate('/profile/edit')}
                className="btn-primary text-xs py-2 px-4"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => navigate('/profile/edit')}
                className="btn-ghost text-xs py-2 px-4"
              >
                Edit Profile
              </button>
            )}
            <button
              onClick={() => navigate('/profile/edit')}
              className="w-9 h-9 rounded-full bg-lenz-card border border-lenz-border flex items-center justify-center"
            >
              <Edit3 size={15} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* Name + badges */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white">{u.name}</h2>
            {u.verified && <VerifiedBadge size={15} />}
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
          {u.location && (
            <button
              onClick={() => navigate('/find')}
              className="flex items-center gap-1.5 group"
            >
              <MapPin size={13} className="text-white/30 group-hover:text-gold transition-colors" />
              <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">{u.location}</span>
            </button>
          )}
          {u.website && (
            <button
              onClick={() => {
                const url = u.website!.startsWith('http') ? u.website! : `https://${u.website}`
                window.open(url, '_blank')
              }}
              className="flex items-center gap-1.5 group"
            >
              <ExternalLink size={13} className="text-white/30 group-hover:text-gold transition-colors" />
              <span className="text-sm text-white/50 group-hover:text-gold transition-colors">
                {u.website.replace(/^https?:\/\//, '')}
              </span>
            </button>
          )}
        </div>

        {/* Specialty badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {u.specialty.map(s => (
            <button
              key={s}
              onClick={() => navigate(`/find?specialty=${encodeURIComponent(s)}`)}
              className="flex items-center gap-1 text-[11px] font-medium text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full hover:border-gold/40 hover:text-gold/80 transition-colors"
            >
              <Camera size={9} className="text-white/30" />
              {s}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 py-4 border-t border-b border-lenz-border">
          {[
            { label: 'Posts',     value: u.posts,                    action: () => setActiveTab('posts') },
            { label: 'Followers', value: formatCount(u.followers),   action: () => setModal('followers') },
            { label: 'Following', value: u.following,                action: () => setModal('following') },
          ].map(({ label, value, action }) => (
            <button key={label} onClick={action} className="text-center group">
              <p className="text-base font-bold text-white group-hover:text-gold transition-colors">{value}</p>
              <p className="text-[10px] text-white/30 mt-0.5 tracking-wide group-hover:text-white/50 transition-colors">{label}</p>
            </button>
          ))}
        </div>

        {/* Rating — only show once user has real reviews */}
        {u.rating > 0 && (
          <button
            onClick={() => setModal('reviews')}
            className="flex items-center justify-between py-3 border-b border-lenz-border w-full group"
          >
            <div className="flex items-center gap-2">
              <Star size={16} className="text-gold fill-gold" />
              <span className="text-sm font-semibold text-white group-hover:text-gold transition-colors">{u.rating} Rating</span>
              <span className="text-xs text-white/30">from {u.hired} clients</span>
            </div>
            <div className="flex items-center gap-1">
              {u.priceRange && <span className="text-xs text-gold font-medium">{u.priceRange}</span>}
              <ChevronRight size={13} className="text-white/30 group-hover:text-gold transition-colors" />
            </div>
          </button>
        )}

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
      {activeTab === 'posts' && hasRealProfile ? (
        myPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5 mt-0.5">
            {myPosts.map(post => (
              <button
                key={post.id}
                onClick={() => { setSelectedPost(post); setModal('photo') }}
                className="photo-grid-item relative group overflow-hidden"
              >
                <img src={post.image_url} alt="" loading="lazy" className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Camera size={32} className="text-white/10 mb-3" />
            <p className="text-sm text-white/25">No posts yet</p>
            <button
              onClick={() => navigate('/upload')}
              className="mt-4 text-gold text-xs font-semibold border border-gold/30 rounded-full px-4 py-2 hover:bg-gold/10 transition-colors"
            >
              Share your first photo
            </button>
          </div>
        )
      ) : tabPhotos[activeTab].length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {tabPhotos[activeTab].map((photo, i) => (
            <button
              key={i}
              onClick={() => { setMockSelectedPhoto(photo); setModal('photo') }}
              className="photo-grid-item relative group overflow-hidden"
            >
              <img src={photo} alt="" loading="lazy" className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Camera size={32} className="text-white/10 mb-3" />
          <p className="text-sm text-white/25">No photos yet</p>
        </div>
      )}

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
          <Link href="/brands">
            <button className="btn-primary w-full">Upgrade to LENZLY Pro</button>
          </Link>
          <p className="text-[10px] text-white/20 mt-2">Starting at $5/month</p>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Photo Viewer Modal */}
      {modal === 'photo' && (selectedPost || mockSelectedPhoto) && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => { if (postMenuOpen) { setPostMenuOpen(false) } else { closeModal() } }}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 pt-12 pb-3 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
              onClick={closeModal}
            >
              <X size={18} className="text-white" />
            </button>
            {selectedPost && (
              <div className="relative">
                <button
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
                  onClick={e => { e.stopPropagation(); setPostMenuOpen(o => !o) }}
                >
                  <MoreVertical size={18} className="text-white" />
                </button>
                {postMenuOpen && (
                  <div className="absolute right-0 top-11 w-44 bg-lenz-card border border-lenz-border rounded-xl overflow-hidden shadow-xl shadow-black/50 z-10">
                    <button
                      onClick={e => { e.stopPropagation(); setPostMenuOpen(false); handleArchivePost() }}
                      disabled={archiving}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white/80 hover:bg-white/5 transition-colors border-b border-lenz-border/50 disabled:opacity-50"
                    >
                      <Archive size={15} className="text-white/50" />
                      {archiving ? 'Archiving…' : 'Archive'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setPostMenuOpen(false); handleDeletePost() }}
                      disabled={deleting}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={15} className="text-red-400" />
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
            <img
              src={(selectedPost?.image_url ?? mockSelectedPhoto ?? '').replace('w=400', 'w=800')}
              alt=""
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Engagement bar — only for real posts */}
          {selectedPost && (
            <div
              className="shrink-0 flex items-center justify-around px-6 py-5 border-t border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <Heart size={20} className="text-white/60" />
                <span className="text-sm font-semibold text-white">{selectedPost.likes_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-white/60" />
                <span className="text-sm font-semibold text-white">{selectedPost.comments_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 size={20} className="text-white/60" />
                <span className="text-sm font-semibold text-white">Share</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Followers Modal */}
      {modal === 'followers' && (
        <PeopleModal
          title={`Followers · ${formatCount(u.followers)}`}
          people={photographers.slice(0, 8)}
          onClose={closeModal}
        />
      )}

      {/* Following Modal */}
      {modal === 'following' && (
        <PeopleModal
          title={`Following · ${u.following}`}
          people={photographers.slice(0, 6)}
          onClose={closeModal}
        />
      )}

      {/* Reviews / Hired Modal */}
      {modal === 'reviews' && (
        <ReviewsModal hired={u.hired} rating={u.rating} priceRange={u.priceRange} onClose={closeModal} />
      )}
    </div>
    </PullToRefreshWrapper>
  )
}

// ── People Modal ──────────────────────────────────────────────────────────────
function PeopleModal({ title, people, onClose }: {
  title: string
  people: typeof photographers
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-[430px] mx-auto bg-lenz-bg rounded-t-2xl border-t border-lenz-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-lenz-border">
          <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X size={16} className="text-white/60" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] pb-6">
          {people.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-lenz-border/50 hover:bg-white/3 transition-colors">
              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-lenz-border">
                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  {p.pro && (
                    <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>
                  )}
                </div>
                <p className="text-xs text-white/40 truncate">@{p.username} · {p.location}</p>
              </div>
              <button className="text-xs font-semibold text-gold border border-gold/30 px-3 py-1.5 rounded-full hover:bg-gold/10 transition-colors shrink-0">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Reviews Modal ─────────────────────────────────────────────────────────────
const mockReviews = [
  { id: 1, name: 'Sarah M.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80&auto=format&fit=crop', rating: 5, text: 'Incredible eye for detail. The photos from our brand campaign exceeded every expectation.', date: '2 weeks ago' },
  { id: 2, name: 'James R.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', rating: 5, text: 'Booked for a wedding shoot. Absolutely stunning results. Highly recommend!', date: '1 month ago' },
  { id: 3, name: 'Aisha T.', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80&auto=format&fit=crop', rating: 4, text: 'Great communicator, showed up on time, beautiful portfolio. Will hire again.', date: '2 months ago' },
  { id: 4, name: 'Carlos D.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&auto=format&fit=crop', rating: 5, text: 'Captured the vibe of our restaurant launch perfectly. Very talented.', date: '3 months ago' },
]

function ReviewsModal({ hired, rating, priceRange, onClose }: {
  hired: number
  rating: number
  priceRange: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-[430px] mx-auto bg-lenz-bg rounded-t-2xl border-t border-lenz-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-lenz-border">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-gold fill-gold" />
            <h3 className="text-sm font-bold text-white">{rating} · {hired} Reviews</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X size={16} className="text-white/60" />
          </button>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-lenz-border/50">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={14} className={s <= Math.round(rating) ? 'text-gold fill-gold' : 'text-white/15'} />
            ))}
            <span className="text-xs text-white/50 ml-1">avg. {rating}</span>
          </div>
          <span className="text-xs text-gold font-medium">{priceRange}</span>
        </div>

        {/* Reviews list */}
        <div className="overflow-y-auto max-h-[60vh] pb-6">
          {mockReviews.map(r => (
            <div key={r.id} className="px-4 py-4 border-b border-lenz-border/50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-lenz-border">
                  <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white">{r.name}</p>
                    <span className="text-[10px] text-white/30">{r.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={10} className={s <= r.rating ? 'text-gold fill-gold' : 'text-white/15'} />
                    ))}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{r.text}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Leave a review CTA */}
          <div className="mx-4 mt-4 p-4 rounded-xl bg-lenz-card border border-lenz-border text-center">
            <MessageSquare size={20} className="text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/40 mb-3">Worked with this photographer? Share your experience.</p>
            <button className="btn-primary text-xs py-2 px-5">Leave a Review</button>
          </div>
        </div>
      </div>
    </div>
  )
}
