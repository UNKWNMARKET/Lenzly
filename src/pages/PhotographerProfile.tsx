import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation } from 'wouter'
import {
  ChevronLeft, Star, MapPin, Camera,
  MessageCircle, Share2, X, Globe, AtSign, UserPlus, UserCheck,
  MoreVertical, Ban, ShieldOff, Flag, Lock, ChevronRight
} from 'lucide-react'
import { formatCount } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { haptics } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import { useRealPhotographer } from '@/hooks/useRealPhotographers'
import VerifiedBadge from '@/components/VerifiedBadge'
import ReportSheet from '@/components/ReportSheet'
import Spinner from '@/components/Spinner'
import FeedPostCard, { type FeedPost } from '@/components/FeedPostCard'
import OGBadge from '@/components/OGBadge'
import { getFounderCutoff, isFounderByDate } from '@/lib/founderUtils'

type HireStep = 'idle' | 'form' | 'sent'

function PhotoViewer({ photos, startIndex, onClose }: { photos: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex)
  const [imgLoaded, setImgLoaded] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const stripRef = useRef<HTMLDivElement>(null)

  const prev = () => { setImgLoaded(false); setIdx(i => Math.max(0, i - 1)) }
  const next = () => { if (idx < photos.length - 1) { setImgLoaded(false); setIdx(i => i + 1) } else onClose() }

  useEffect(() => {
    setImgLoaded(false)
  }, [idx])

  useEffect(() => {
    // Keep active thumbnail visible in strip
    if (stripRef.current) {
      const btn = stripRef.current.children[idx] as HTMLElement
      if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [idx])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dy) > 80 && dy > 0) { onClose(); return }
    if (Math.abs(dx) > 40 && Math.abs(dy) < 60) {
      if (dx < 0) next(); else prev()
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 safe-top shrink-0 z-10">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20">
          <X size={18} className="text-white" />
        </button>
        <span className="text-white/50 text-sm font-medium">{idx + 1} / {photos.length}</span>
        <div className="w-9" />
      </div>

      {/* Photo — fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner size="md" />
          </div>
        )}
        <img
          key={idx}
          src={photos[idx]}
          alt=""
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Tap zones */}
        {idx > 0 && (
          <button onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/3" />
        )}
        {idx < photos.length - 1 && (
          <button onClick={next} className="absolute right-0 top-0 bottom-0 w-1/3" />
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div ref={stripRef} className="flex gap-2 px-4 pb-8 safe-bottom overflow-x-auto no-scrollbar shrink-0 pt-3">
          {photos.map((photo, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`shrink-0 rounded-xl overflow-hidden transition-all duration-200 ${i === idx ? 'ring-2 ring-gold scale-105 opacity-100' : 'opacity-35 scale-100'}`}>
              <img src={photo} alt="" className="w-16 h-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PhotographerProfile() {
  const { id } = useParams<{ id: string }>()
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [hireStep, setHireStep] = useState<HireStep>('idle')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [followRequested, setFollowRequested] = useState(false)
  const [hireForm, setHireForm] = useState({
    projectType: '',
    date: '',
    budget: '',
    details: '',
  })
  const [sending, setSending] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [founderCutoffLoaded, setFounderCutoffLoaded] = useState(false)

  useEffect(() => {
    getFounderCutoff().then(() => setFounderCutoffLoaded(true))
  }, [])

  const isUuidId = !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const isSelf = !!user && user.id === id

  // Load this user's posts with full data for FeedPostCard
  useEffect(() => {
    if (!id) return
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) return
    supabase
      .from('posts')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        if (!data || data.length === 0) return
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url, is_pro')
          .eq('id', id)
          .maybeSingle()
        setFeedPosts(data.map(p => ({ ...p, profile: prof ?? null })) as FeedPost[])
      })
  }, [id])

  // Check follow state (accepted = following, pending = requested)
  useEffect(() => {
    if (!user || !id) return
    supabase
      .from('follows')
      .select('id, status')
      .eq('follower_id', user.id)
      .eq('following_id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.status === 'accepted') setIsFollowing(true)
        else if (data?.status === 'pending') setFollowRequested(true)
      })
  }, [user, id])

  // Check if the current user has blocked this person
  useEffect(() => {
    if (!user || !id || !isUuidId) return
    supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', id)
      .maybeSingle()
      .then(({ data }) => setIsBlocked(!!data))
  }, [user, id, isUuidId])

  const toggleBlock = async () => {
    if (!user) { navigate('/auth/login'); return }
    if (!id) return
    setMenuOpen(false)
    setBlockLoading(true)
    if (isBlocked) {
      await supabase.from('blocks').delete()
        .eq('blocker_id', user.id).eq('blocked_id', id)
      setIsBlocked(false)
      toast.success('Unblocked')
    } else {
      const { error } = await supabase.from('blocks').insert({
        blocker_id: user.id,
        blocked_id: id,
      })
      if (!error) {
        setIsBlocked(true)
        setIsFollowing(false) // block removes the follow relationship server-side
        toast.success('Blocked. They can no longer follow you.')
      } else {
        toast.error('Could not block. Try again.')
      }
    }
    setBlockLoading(false)
  }

  const toggleFollow = async () => {
    if (!user) { navigate('/auth/login'); return }
    if (!id) return
    setFollowLoading(true)
    haptics.medium()
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', id)
      setIsFollowing(false)
    } else {
      const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: id,
      })
      if (!error) {
        setIsFollowing(true)
        haptics.success()
        toast.success(`Following ${p?.name.split(' ')[0] ?? ''}`)
        // Notify the person being followed
        supabase.from('notifications').insert({
          user_id: id,
          actor_id: user.id,
          type: 'follow',
          read: false,
        })
      } else {
        haptics.error()
        toast.error('Could not follow. Try again.')
      }
    }
    setFollowLoading(false)
  }

  const requestFollow = async () => {
    if (!user || !id) return
    haptics.medium()
    const { error } = await supabase.from('follows').insert({
      follower_id: user.id,
      following_id: id,
      status: 'pending',
    })
    if (error) { toast.error('Could not send request'); return }
    await supabase.from('notifications').insert({
      user_id: id,
      actor_id: user.id,
      type: 'follow_request',
      message: 'wants to follow you',
      read: false,
    })
    setFollowRequested(true)
    haptics.success()
    toast.success('Follow request sent')
  }

  // Real signed-up users only — no fabricated sample profiles
  const { photographer: realP, loading: realLoading } = useRealPhotographer(id)
  const p = realP

  if (realLoading) return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none bg-lenz-bg">
      <div className="h-56 bg-lenz-card animate-pulse" />
      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-lenz-card animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-lenz-card rounded animate-pulse" />
            <div className="h-3 w-24 bg-lenz-card rounded animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-full bg-lenz-card rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-lenz-card rounded animate-pulse" />
      </div>
    </div>
  )

  if (!p) {
    return (
      <div className="fixed inset-0 overflow-y-auto overscroll-none bg-lenz-bg flex flex-col items-center justify-center gap-4">
        <Camera size={40} className="text-white/10" />
        <p className="text-white/30 text-sm">Photographer not found</p>
        <button onClick={() => window.history.length > 1 ? window.history.back() : navigate('/find')} className="btn-ghost text-sm px-4 py-2">← Back to Find</button>
      </div>
    )
  }

  const handleShare = async () => {
    const profileUrl = `https://lenzly.app/@${p.username}`
    const shareText = p.bio
      ? `Check out ${p.name}'s photography on LENZLY`
      : `Check out @${p.username} on LENZLY`
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({
        title: `${p.name} on LENZLY`,
        text: shareText,
        url: profileUrl,
        dialogTitle: 'Share Profile',
      })
    } catch {
      try {
        await navigator.clipboard.writeText(profileUrl)
        toast.success('Profile link copied!')
      } catch {
        toast.success(`lenzly.app/@${p.username}`)
      }
    }
  }

  const handleMessageStart = async () => {
    if (!user) { navigate('/auth/login'); return }
    // Find-or-create conversation atomically via RPC, then open chat
    const { data: convId, error } = await supabase.rpc('get_or_create_dm', { other_user: p.id })
    if (error || !convId) { toast.error(error?.message ?? 'Could not start conversation'); navigate('/messages'); return }
    navigate(`/chat/${convId}`)
  }

  const handleHireSend = async () => {
    if (!hireForm.projectType.trim()) { toast.error('Project type is required'); return }
    if (!user) { toast.error('Sign in to send hire requests'); return }
    setSending(true)
    try {
      // Find or create conversation FIRST so notification includes conversation_id
      const { data: conversationId } = await supabase.rpc('get_or_create_dm', { other_user: p.id })

      if (conversationId) {
        const proposal = {
          type: 'hire_proposal',
          projectType: hireForm.projectType,
          date: hireForm.date || null,
          budget: hireForm.budget || null,
          details: hireForm.details || null,
          photographerName: p.name,
          sentAt: new Date().toISOString(),
        }
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: JSON.stringify(proposal),
        })
        await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
      }

      // Insert notification WITH conversation_id so recipient can tap directly into chat
      await supabase.from('notifications').insert({
        user_id: p.id,
        actor_id: user.id,
        type: 'hire_request',
        message: `sent you a hire request: ${hireForm.projectType}${hireForm.date ? ' · ' + hireForm.date : ''}${hireForm.details ? ' — ' + hireForm.details.slice(0, 80) : ''}`,
        conversation_id: conversationId,
        read: false,
      })

      setSending(false)
      setHireStep('sent')
      toast.success(`Hire request sent to ${p.name}!`)
    } catch (err) {
      console.error('[handleHireSend]', err)
      setSending(false)
      toast.error('Could not send hire request. Try again.')
    }
  }

  const gridPhotos = feedPosts.length === 0 ? p.photos : []

  // ── Private profile gate ────────────────────────────────────────────────────
  if (p.private_account && !isFollowing && !isSelf) {
    return (
      <div className="min-h-screen bg-lenz-bg pb-8">
        <div className="relative h-56 overflow-hidden bg-lenz-card">
          {p.coverPhoto
            ? <img src={p.coverPhoto} alt="cover" className="w-full h-full object-cover opacity-40 blur-sm" />
            : <div className="w-full h-full bg-gradient-to-br from-[#1c1608] via-[#0d0d0d] to-[#080808]" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-lenz-bg" />
          <div className="absolute top-4 left-4 safe-top">
            <button onClick={() => window.history.length > 1 ? window.history.back() : navigate('/find')} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
              <ChevronLeft size={20} className="text-white" />
            </button>
          </div>
        </div>
        <div className="px-4 -mt-16 relative z-10 flex flex-col items-center text-center">
          <div className="w-[86px] h-[86px] rounded-full overflow-hidden border-[3px] border-lenz-bg bg-lenz-card">
            <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[17px] font-bold text-white mt-3">{p.name}</h1>
          <p className="text-[13px] text-white/40">@{p.username}</p>
          {p.bio && <p className="text-[13px] text-white/55 mt-2 leading-relaxed max-w-xs">{p.bio}</p>}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Lock size={20} className="text-white/40" />
            </div>
            <p className="text-[13px] font-semibold text-white/60">This account is private</p>
            <p className="text-[12px] text-white/30">Follow to see their photos and stories</p>
          </div>
          <button
            onClick={followRequested ? undefined : requestFollow}
            className={`mt-5 px-8 py-3 rounded-full font-bold text-[14px] transition-all active:scale-95 ${
              followRequested
                ? 'bg-lenz-card border border-white/20 text-white/50'
                : 'bg-gold text-lenz-bg shadow-[0_0_16px_rgba(201,168,76,0.35)]'
            }`}
          >
            {followRequested ? 'Requested' : 'Request to Follow'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none bg-lenz-bg" style={{ WebkitOverflowScrolling: 'touch' }}>
    <div className="min-h-full pb-24">
      {/* ── Hero cover — taller, stronger gradient fade into page bg ── */}
      <div className="relative h-56 overflow-hidden bg-lenz-card">
        {p.coverPhoto
          ? <img src={p.coverPhoto} alt="cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#1c1608] via-[#0d0d0d] to-[#080808]" />
        }
        {/* Stronger bottom fade so avatar sits seamlessly on top */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-lenz-bg" />

        {/* Back */}
        <div className="absolute top-4 left-4 safe-top">
          <button onClick={() => window.history.length > 1 ? window.history.back() : navigate('/find')} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </button>
        </div>

        {/* Share + ⋮ */}
        <div className="absolute top-4 right-4 safe-top flex items-center gap-2">
          <button onClick={handleShare} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
            <Share2 size={16} className="text-white" />
          </button>
          {isUuidId && !isSelf && (
            <div className="relative">
              <button onClick={() => setMenuOpen(o => !o)} className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center">
                <MoreVertical size={16} className="text-white" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-lenz-card border border-lenz-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <button onClick={toggleBlock} disabled={blockLoading}
                      className="flex items-center gap-2.5 w-full px-4 py-3.5 text-sm text-left hover:bg-white/5 disabled:opacity-50 border-b border-lenz-border/40">
                      {isBlocked
                        ? <><ShieldOff size={14} className="text-white/50" /><span className="text-white/70">Unblock</span></>
                        : <><Ban size={14} className="text-red-400" /><span className="text-red-400">Block user</span></>}
                    </button>
                    <button onClick={() => { setMenuOpen(false); setReportOpen(true) }}
                      className="flex items-center gap-2.5 w-full px-4 py-3.5 text-sm text-left hover:bg-white/5">
                      <Flag size={14} className="text-red-400" /><span className="text-red-400">Report</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Profile identity ── */}
      <div className="px-4 -mt-16 relative z-10">

        {/* Avatar + quick stats side by side */}
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={p.verified ? 'story-ring' : 'story-ring-seen'} style={{ padding: '3px' }}>
              <div className="w-[86px] h-[86px] rounded-full overflow-hidden border-[3px] border-lenz-bg bg-lenz-card">
                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
              </div>
            </div>
            {p.available && !(founderCutoffLoaded && isFounderByDate((p as any).profile_created_at)) && (
              <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-lenz-bg" />
            )}
            {founderCutoffLoaded && isFounderByDate((p as any).profile_created_at) && (
              <OGBadge size="lg" className="absolute -bottom-1 -right-1 pointer-events-none" />
            )}
          </div>

          {/* Stats — fill remaining width, align bottom with avatar */}
          <div className="flex flex-1 justify-around pb-1">
            {[
              { label: 'Posts',     value: formatCount(p.posts) },
              { label: 'Followers', value: formatCount(p.followers) },
              ...(p.hired > 0 ? [{ label: 'Hired', value: String(p.hired) }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[17px] font-bold text-white leading-none">{value}</p>
                <p className="text-[10px] text-white/35 mt-1 tracking-wide uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Name + badges */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <h1 className="text-[17px] font-bold text-white leading-tight">{p.name}</h1>
          {p.verified && <VerifiedBadge size={14} />}
          {p.pro && <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-2 py-[3px] rounded-full">PRO</span>}
          {p.secondShooter && <span className="text-[9px] font-bold tracking-widest text-gold border border-gold/40 bg-gold/10 px-2 py-[3px] rounded-full">2ND SHOOTER</span>}
        </div>
        <p className="text-[13px] text-white/40 mt-0.5">@{p.username}</p>

        {/* Rating + price inline */}
        {(p.rating > 0 || p.hired > 0 || p.priceRange) && (
        <div className="flex items-center gap-2.5 mt-1.5">
          {p.rating > 0 && (
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={11} className={s <= Math.round(p.rating) ? 'text-gold fill-gold' : 'text-white/15'} />
              ))}
            </div>
          )}
          {(p.rating > 0 || p.hired > 0) && (
            <span className="text-[12px] text-white/40">{p.rating > 0 ? `${p.rating} · ` : ''}{p.hired} bookings</span>
          )}
          {p.priceRange && <span className="text-[12px] text-gold font-semibold">{p.priceRange}</span>}
        </div>
        )}

        {/* Bio */}
        {p.bio && <p className="text-[13px] text-white/65 mt-2.5 leading-relaxed">{p.bio}</p>}

        {/* Meta links */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {p.location && (
            <div className="flex items-center gap-1">
              <MapPin size={11} className="text-white/30 shrink-0" />
              <span className="text-[12px] text-white/45">{p.location}</span>
            </div>
          )}
          {p.portfolio && (
            <button onClick={() => window.open(p.portfolio.startsWith('http') ? p.portfolio : `https://${p.portfolio}`, '_blank')}
              className="flex items-center gap-1 group">
              <Globe size={11} className="text-white/30 group-hover:text-gold transition-colors shrink-0" />
              <span className="text-[12px] text-white/45 group-hover:text-gold transition-colors">{p.portfolio}</span>
            </button>
          )}
          {p.instagram && (
            <div className="flex items-center gap-1">
              <AtSign size={11} className="text-white/30 shrink-0" />
              <span className="text-[12px] text-white/45">{p.instagram}</span>
            </div>
          )}
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {p.specialty.map(s => (
            <span key={s} className="text-[11px] text-white/55 bg-white/5 border border-white/10 px-2.5 py-[5px] rounded-full">
              {s}
            </span>
          ))}
        </div>

        {/* ── CTA buttons — full width, 3 equal pills ── */}
        <div className="flex items-center gap-2.5 mt-4">
          {isBlocked ? (
            <button onClick={toggleBlock} disabled={blockLoading}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold bg-lenz-card border border-red-400/40 text-red-400 disabled:opacity-50 active:scale-95 transition-transform">
              <Ban size={13} />Blocked
            </button>
          ) : (
            <button onClick={toggleFollow} disabled={followLoading}
              className={`flex-1 h-10 flex items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                isFollowing ? 'bg-lenz-card border border-gold/50 text-gold' : 'bg-gold text-lenz-bg shadow-[0_0_16px_rgba(201,168,76,0.35)]'
              }`}>
              {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          <button onClick={handleMessageStart}
            className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold bg-lenz-card border border-lenz-border text-white/70 active:scale-95 transition-transform">
            <MessageCircle size={14} />Message
          </button>
          <button onClick={() => setHireStep('form')}
            className="flex-1 h-10 flex items-center justify-center rounded-full text-[13px] font-bold bg-gold text-lenz-bg shadow-[0_0_16px_rgba(201,168,76,0.35)] active:scale-95 transition-transform">
            Hire
          </button>
        </div>
      </div>

      {/* Feed posts with full interactions */}
      {feedPosts.length > 0 && (
        <div className="mt-2">
          <div className="px-4 py-3 flex items-center gap-2">
            <p className="text-xs font-semibold text-white/30 tracking-wider uppercase">Posts</p>
            <span className="text-[10px] text-white/20">{feedPosts.length} photos</span>
          </div>
          {feedPosts.map(post => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentUserId={user?.id ?? null}
              onDeleted={id => setFeedPosts(prev => prev.filter(p => p.id !== id))}
            />
          ))}
        </div>
      )}

      {/* Fallback static grid (mock data only) */}
      {feedPosts.length === 0 && gridPhotos.length > 0 && (
        <div className="mt-2">
          <div className="px-4 py-3 flex items-center gap-2">
            <p className="text-xs font-semibold text-white/30 tracking-wider uppercase">Portfolio</p>
            <span className="text-[10px] text-white/20">{gridPhotos.length} photos</span>
          </div>
          <div className="grid grid-cols-3 gap-px">
            {gridPhotos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setViewerIndex(i)}
                className="relative overflow-hidden active:opacity-75 active:scale-95 transition-all duration-100"
              >
                <img src={photo} alt="" loading="lazy" className="w-full aspect-square object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {viewerIndex !== null && gridPhotos.length > 0 && (
        <PhotoViewer
          photos={gridPhotos}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {/* Hire modal */}
      {(hireStep === 'form' || hireStep === 'sent') && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setHireStep('idle')}>
          <div className="w-full max-w-[430px] md:max-w-[600px] mx-auto bg-lenz-bg rounded-t-3xl border-t border-lenz-border pb-10 safe-bottom max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-lenz-border">
              <h2 className="text-base font-bold text-white">
                {hireStep === 'sent' ? '✓ Request Sent!' : 'Hire'}
              </h2>
              <button onClick={() => setHireStep('idle')} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10">
                <X size={16} className="text-white/50" />
              </button>
            </div>

            {hireStep === 'sent' ? (
              <div className="px-5 py-8 text-center">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                  <Camera size={28} className="text-lenz-bg" />
                </div>
                <p className="text-white font-semibold text-base mb-2">Your request is on its way!</p>
                <p className="text-white/40 text-sm leading-relaxed">
                  {p.name.split(' ')[0]} will review your request and get back to you via message shortly.
                </p>
                <button
                  onClick={() => { setHireStep('idle'); navigate('/messages') }}
                  className="btn-primary w-full mt-6"
                >
                  Go to Messages
                </button>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3.5">
                {/* Photographer mini header */}
                <div className="flex items-center gap-3 p-3 bg-lenz-card rounded-xl border border-lenz-border">
                  <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <div className="flex items-center gap-1">
                      <Star size={10} className="text-gold fill-gold" />
                      <span className="text-xs text-white/40">
                        {(p as any).rating > 0 ? `${(p as any).rating} · ` : ''}{(p as any).priceRange || 'Rate on request'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Project Type *</label>
                  <input
                    type="text"
                    value={hireForm.projectType}
                    onChange={e => setHireForm(f => ({ ...f, projectType: e.target.value }))}
                    placeholder="e.g. Wedding, Brand Campaign, Portraits"
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Preferred Date</label>
                  <input
                    type="text"
                    value={hireForm.date}
                    onChange={e => setHireForm(f => ({ ...f, date: e.target.value }))}
                    placeholder="e.g. June 15 or flexible"
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Budget</label>
                  <input
                    type="text"
                    value={hireForm.budget}
                    onChange={e => setHireForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="e.g. $500–1000"
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 font-semibold tracking-wider uppercase block mb-1.5">Details</label>
                  <textarea
                    value={hireForm.details}
                    onChange={e => setHireForm(f => ({ ...f, details: e.target.value }))}
                    placeholder="Tell them about your project…"
                    rows={3}
                    className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleHireSend}
                  disabled={sending}
                  className="btn-primary w-full py-3.5 font-bold tracking-wider disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Hire Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {reportOpen && id && (
        <ReportSheet targetType="user" targetId={id} onClose={() => setReportOpen(false)} />
      )}
    </div>
    </div>
  )
}
