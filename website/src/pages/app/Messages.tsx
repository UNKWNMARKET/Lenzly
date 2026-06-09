import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { timeAgo } from '../../lib/utils'

interface Conv { id: string; updated_at: string; other?: { id: string; username: string; name: string; avatar_url: string | null }; last?: string | null }

export default function Messages() {
  const { user } = useAuth()
  const [convs, setConvs] = useState<Conv[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function loadConvs() {
      const { data: parts } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', user!.id)
      const ids = (parts ?? []).map(p => p.conversation_id)
      if (!ids.length) { setConvs([]); setLoading(false); return }
      const { data: convData } = await supabase.from('conversations').select('id, updated_at').in('id', ids).order('updated_at', { ascending: false })
      const result: Conv[] = []
      for (const c of convData ?? []) {
        // conversation_participants.user_id → auth.users, so fetch the profile separately
        const { data: others } = await supabase.from('conversation_participants').select('user_id').eq('conversation_id', c.id).neq('user_id', user!.id)
        const otherId = others?.[0]?.user_id
        let other
        if (otherId) {
          const { data: prof } = await supabase.from('profiles').select('id, username, name, avatar_url').eq('id', otherId).single()
          other = prof ?? undefined
        }
        const { data: lastMsg } = await supabase.from('messages').select('content, image_url').eq('conversation_id', c.id).order('sent_at', { ascending: false }).limit(1)
        result.push({ id: c.id, updated_at: c.updated_at, other, last: lastMsg?.[0]?.content ?? (lastMsg?.[0]?.image_url ? '📷 Photo' : null) })
      }
      setConvs(result); setLoading(false)
    }

    loadConvs()

    // Live realtime — new/updated messages refresh the conversation list
    const channel = supabase
      .channel('messages-list-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadConvs())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center">
        <h1 className="text-lg font-bold text-white">Messages</h1>
      </header>
      <div className="px-2 py-2">
        {loading ? <p className="text-center text-white/30 text-sm py-10">Loading…</p> :
          convs.length === 0 ? (
            <div className="text-center py-24"><MessageCircle size={32} className="text-white/10 mx-auto mb-3" /><p className="text-white/30 text-sm">No conversations yet</p><Link to="/app/search" className="btn-gold mt-5 inline-flex">Find photographers</Link></div>
          ) : convs.map(c => (
            <Link key={c.id} to={`/app/messages/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-13 h-13 w-[52px] h-[52px] rounded-full overflow-hidden bg-lenz-card2 border border-white/10 shrink-0">
                {c.other?.avatar_url ? <img src={c.other.avatar_url} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-gold/50 font-bold">{c.other?.name?.[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{c.other?.name ?? 'Unknown'}</p>
                <p className="text-xs text-white/40 truncate">{c.last ?? 'Say hello 👋'}</p>
              </div>
              <span className="text-xs text-white/25 shrink-0">{timeAgo(c.updated_at)}</span>
            </Link>
          ))}
      </div>
    </div>
  )
}
