import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Heart, MessageCircle, UserPlus, Bell, Aperture, CheckCheck, Clapperboard, Lock, UserCheck, X as XIcon, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { toast } from 'sonner'

type Notif = {
  id: string
  type: string
  actor_id: string | null
  post_id: string | null
  message: string | null
  read: boolean
  created_at: string
  actor?: { username: string; avatar_url: string | null } | null
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

const typeIcon = (type: string) => {
  switch (type) {
    case 'like':    return <Heart size={14} className="fill-rose-500 text-rose-500" />
    case 'comment': return <MessageCircle size={14} className="text-blue-400" />
    case 'follow':  return <UserPlus size={14} className="text-green-400" />
    case 'mention':      return <Aperture size={14} className="text-gold" />
    case 'story_share':    return <Clapperboard size={14} className="text-amber-400" />
    case 'follow_request': return <Lock size={14} className="text-amber-400" />
    case 'follow_accepted':return <UserCheck size={14} className="text-green-400" />
    case 'follow_declined':return <XIcon size={14} className="text-rose-400" />
    case 'hire_request':    return <Camera size={14} className="text-gold" />
    case 'story_like':      return <Heart size={14} className="fill-rose-500 text-rose-500" />
    case 'story_comment':   return <MessageCircle size={14} className="text-purple-400" />
    default:               return <Bell size={14} className="text-white/50" />
  }
}

const typeLabel = (type: string, actor?: string | null): string => {
  const name = actor ?? 'Someone'
  switch (type) {
    case 'like':    return `${name} liked your photo`
    case 'comment': return `${name} commented on your photo`
    case 'follow':  return `${name} started following you`
    case 'mention':      return `${name} mentioned you in a comment`
    case 'story_share':     return `${name} shared your photo to their story`
    case 'follow_request':  return `${name} wants to follow you`
    case 'follow_accepted': return `${name} accepted your follow request`
    case 'follow_declined': return `${name} declined your follow request`
    case 'hire_request':    return `${name} sent you a hire request`
    case 'story_like':      return `${name} liked your story`
    case 'story_comment':   return `${name} replied to your story`
    default:                return 'New notification'
  }
}

export default function Notifications() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [followBackDone, setFollowBackDone] = useState<Set<string>>(new Set())
  const [requestDone, setRequestDone] = useState<Set<string>>(new Set())

  const fetchNotifs = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const { data: rows, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(60)

    if (error) {
      toast.error('Notifications error: ' + error.message)
      setLoading(false)
      return
    }

    const safeRows = rows ?? []

    // Batch-fetch actor profiles
    const actorIds = [...new Set(safeRows.map((r: any) => r.actor_id).filter(Boolean))]
    const profileMap: Record<string, { username: string; avatar_url: string | null }> = {}
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', actorIds)
      if (profiles) {
        for (const p of profiles) profileMap[p.id] = { username: p.username, avatar_url: p.avatar_url }
      }
    }

    const merged = safeRows.map((r: any) => ({
      ...r,
      actor: r.actor_id ? (profileMap[r.actor_id] ?? null) : null,
    }))
    setNotifs(merged as Notif[])
    setLoading(false)
  }, [user])

  const ptr = usePullToRefresh({ onRefresh: fetchNotifs })

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchNotifs()
    const ch = supabase
      .channel('notifs_live')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => fetchNotifs())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, fetchNotifs])

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleConfirmFollow = async (n: Notif) => {
    if (!n.actor_id || !user) return
    await supabase.from('follows').upsert(
      { follower_id: n.actor_id, following_id: user.id, status: 'accepted' },
      { onConflict: 'follower_id,following_id' }
    )
    // Notify the requester that they were accepted
    await supabase.from('notifications').insert({
      user_id: n.actor_id,
      actor_id: user.id,
      type: 'follow_accepted',
      message: 'accepted your follow request',
      read: false,
    })
    setRequestDone(prev => new Set(prev).add(n.id))
    toast.success(`${n.actor?.username ?? 'User'} can now follow you`)
    markRead(n.id)
  }

  const handleDenyFollow = async (n: Notif) => {
    if (!n.actor_id || !user) return
    await supabase.from('follows').delete().eq('follower_id', n.actor_id).eq('following_id', user.id)
    // Notify the requester that they were declined
    await supabase.from('notifications').insert({
      user_id: n.actor_id,
      actor_id: user.id,
      type: 'follow_declined',
      message: 'declined your follow request',
      read: false,
    })
    setRequestDone(prev => new Set(prev).add(n.id))
    toast.success('Request declined')
    markRead(n.id)
  }

  const handleFollowBack = async (n: Notif) => {
    if (!n.actor_id || !user) return
    await supabase.from('follows').upsert(
      { follower_id: user.id, following_id: n.actor_id },
      { onConflict: 'follower_id,following_id' }
    )
    setFollowBackDone(prev => new Set(prev).add(n.id))
    toast.success(`Following @${n.actor?.username ?? 'user'}`)
    markRead(n.id)
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <PullToRefreshWrapper {...ptr} className="h-[100dvh] bg-lenz-bg">
    <div className="min-h-full pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft size={20} className="text-white/70" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">Notifications</h1>
            {unread > 0 && <p className="text-[10px] text-gold/70">{unread} unread</p>}
          </div>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-gold/80 hover:text-gold transition-colors px-3 py-1.5 rounded-full border border-gold/20 hover:border-gold/40">
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex flex-col gap-3 p-4 mt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-lenz-card animate-pulse">
              <div className="w-11 h-11 rounded-full bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-3/4" />
                <div className="h-2.5 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 gap-4 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-lenz-card flex items-center justify-center">
            <Bell size={24} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No notifications yet</p>
          <p className="text-white/20 text-xs">When people like or comment on your photos, you'll see it here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 p-4 mt-1">
          {notifs.map(n => (
            <div
              key={n.id}
              role="button"
              onClick={() => markRead(n.id)}
              className={cn(
                'flex flex-col p-3 rounded-2xl transition-all cursor-pointer',
                n.read ? 'bg-transparent hover:bg-white/5' : 'bg-white/5 hover:bg-white/7'
              )}
            >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-lenz-card overflow-hidden border border-lenz-border">
                  {n.actor?.avatar_url
                    ? <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white/20 text-lg font-bold">
                        {n.actor?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                  }
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-lenz-bg flex items-center justify-center">
                  {typeIcon(n.type)}
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm leading-snug', n.read ? 'text-white/50' : 'text-white/90')}>
                  {n.message ?? typeLabel(n.type, n.actor?.username)}
                </p>
                <p className="text-[11px] text-white/25 mt-0.5">{timeAgo(n.created_at)}</p>
              </div>

              {/* Unread dot */}
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
              )}
            </div>

            {(n.type === 'follow' || n.type === 'follow_request') && !requestDone.has(n.id) && (
              <div className="flex gap-2 mt-2 ml-14">
                {n.type === 'follow_request' ? (
                  <>
                    <button onClick={e => { e.stopPropagation(); handleConfirmFollow(n) }}
                      className="px-3 py-1 rounded-xl bg-gold text-lenz-bg text-xs font-bold active:scale-95 transition-transform">
                      Confirm
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDenyFollow(n) }}
                      className="px-3 py-1 rounded-xl bg-white/10 text-white/60 text-xs font-semibold active:scale-95 transition-transform">
                      Delete
                    </button>
                  </>
                ) : !followBackDone.has(n.id) ? (
                  <button onClick={e => { e.stopPropagation(); handleFollowBack(n) }}
                    className="px-3 py-1 rounded-xl border border-lenz-border text-white/70 text-xs font-semibold active:scale-95 transition-transform hover:border-gold/40 hover:text-gold/80">
                    Follow Back
                  </button>
                ) : (
                  <span className="text-xs text-white/30 ml-1">Following ✓</span>
                )}
              </div>
            )}
            </div>
          ))}
        </div>
      )}
    </div>
    </PullToRefreshWrapper>
  )
}
