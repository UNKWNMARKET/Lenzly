import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Bell, Camera } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { timeAgo } from '../../lib/utils'

interface Notif { id: string; type: string; message: string | null; read: boolean; created_at: string; post_id: string | null; actor?: { username: string; name: string; avatar_url: string | null } }

const icon = (t: string) => {
  if (t.includes('like')) return <Heart size={15} className="text-red-500 fill-red-500" />
  if (t.includes('comment')) return <MessageCircle size={15} className="text-blue-400" />
  if (t.includes('follow')) return <UserPlus size={15} className="text-green-400" />
  if (t.includes('hire')) return <Camera size={15} className="text-gold" />
  return <Bell size={15} className="text-gold" />
}
const label = (t: string) => {
  if (t === 'like') return 'liked your post'
  if (t === 'comment') return 'commented on your post'
  if (t === 'follow') return 'started following you'
  if (t === 'hire_request') return 'sent you a hire request'
  if (t === 'message') return 'sent you a message'
  return t.replace(/_/g, ' ')
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // notifications.actor_id → auth.users, so fetch actor profiles separately and merge
    async function attachActors(rows: any[]): Promise<Notif[]> {
      if (!rows.length) return []
      const actorIds = [...new Set(rows.map(r => r.actor_id).filter(Boolean))]
      const map: Record<string, any> = {}
      if (actorIds.length) {
        const { data: profs } = await supabase.from('profiles').select('id, username, name, avatar_url').in('id', actorIds)
        for (const p of profs ?? []) map[p.id] = p
      }
      return rows.map(r => ({ ...r, actor: map[r.actor_id] ?? undefined })) as Notif[]
    }

    async function loadNotifs() {
      const { data } = await supabase.from('notifications')
        .select('id, type, message, read, created_at, post_id, actor_id')
        .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50)
      setNotifs(await attachActors(data ?? []))
      setLoading(false)
    }

    loadNotifs()
    supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false).then(() => {})

    // Live realtime — new notifications appear instantly, like the iOS app
    const channel = supabase
      .channel('notifications-live')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const [notif] = await attachActors([payload.new])
          setNotifs(prev => prev.some(n => n.id === notif.id) ? prev : [notif, ...prev])
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center">
        <h1 className="text-lg font-bold text-white">Notifications</h1>
      </header>
      <div className="px-2 py-2">
        {loading ? <p className="text-center text-white/30 text-sm py-10">Loading…</p> :
          notifs.length === 0 ? (
            <div className="text-center py-24"><Bell size={32} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No notifications yet</p></div>
          ) : notifs.map(n => (
            <Link key={n.id} to={n.post_id ? `/app/post/${n.post_id}` : '#'} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-lenz-card2 border border-white/10">
                  {n.actor?.avatar_url ? <img src={n.actor.avatar_url} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-gold/50 font-bold text-sm">{n.actor?.name?.[0] ?? '?'}</div>}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-lenz-bg border border-lenz-border flex items-center justify-center">{icon(n.type)}</div>
              </div>
              <p className="flex-1 text-sm text-white/80 leading-snug">
                <span className="font-semibold text-white">{n.actor?.username ?? 'Someone'}</span> {label(n.type)}
                <span className="text-white/30 ml-1.5 text-xs">{timeAgo(n.created_at)}</span>
              </p>
              {!n.read && <div className="w-2 h-2 rounded-full bg-gold shrink-0" />}
            </Link>
          ))}
      </div>
    </div>
  )
}
