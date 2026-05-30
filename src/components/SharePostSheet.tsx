import { useState, useEffect } from 'react'
import { X, Search, Send, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useLocation } from 'wouter'

type UserRow = { id: string; username: string | null; name: string | null; avatar_url: string | null }

export default function SharePostSheet({
  postId,
  imageUrl,
  caption,
  onClose,
}: {
  postId: string
  imageUrl: string
  caption: string | null
  onClose: () => void
}) {
  const { user } = useAuth()
  const [, navigate] = useLocation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserRow[]>([])
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 1) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url')
        .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
        .neq('id', user?.id ?? '')
        .limit(10)
      setResults((data ?? []) as UserRow[])
    }, 250)
    return () => clearTimeout(timer)
  }, [query, user])

  // Load suggested users (followers/following) when sheet opens
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(id, username, name, avatar_url)')
        .eq('follower_id', user.id)
        .limit(12)
      const profiles = (data ?? [])
        .map((f: any) => f.profiles)
        .filter(Boolean) as UserRow[]
      setResults(profiles)
    })()
  }, [user])

  const sendTo = async (recipient: UserRow) => {
    if (!user || sending) return
    setSending(recipient.id)

    // Find or create a conversation with this user
    let convId: string | null = null
    const { data: myConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)

    if (myConvs && myConvs.length > 0) {
      const { data: shared } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', recipient.id)
        .in('conversation_id', myConvs.map(c => c.conversation_id))
        .limit(1)
      if (shared && shared[0]) convId = shared[0].conversation_id
    }

    if (!convId) {
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({ created_by: user.id, bg: '#0A0804' })
        .select()
        .single()
      if (error || !conv) { setSending(null); toast.error('Could not share'); return }
      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: recipient.id },
      ])
      convId = conv.id
    }

    // Send the post as a message with a link + preview caption
    const postUrl = `${window.location.origin}/post/${postId}`
    const msgText = caption ? `📸 ${caption}\n${postUrl}` : `📸 Check this out\n${postUrl}`

    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      text: msgText,
    })
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId)

    setSent(prev => new Set([...prev, recipient.id]))
    setSending(null)
    toast.success(`Sent to ${recipient.username || recipient.name}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-lenz-bg rounded-t-3xl border-t border-lenz-border max-h-[75vh] flex flex-col"
        style={{ maxWidth: 430, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-lenz-border shrink-0">
          <h3 className="text-sm font-bold text-white tracking-wide">Share Post</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X size={16} className="text-white/60" />
          </button>
        </div>

        {/* Post preview strip */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-lenz-border/50 shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-lenz-card shrink-0">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <p className="text-sm text-white/60 truncate flex-1">{caption || 'Photo'}</p>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search by username…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-lenz-card border border-lenz-border rounded-full pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40"
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className="overflow-y-auto flex-1 pb-6">
          {results.length === 0 && (
            <p className="text-center text-white/25 text-sm py-8">
              {query.length > 0 ? 'No users found' : 'Type a name to search'}
            </p>
          )}
          {results.map(u => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-lenz-border/30 last:border-0">
              <div className="w-10 h-10 rounded-full bg-lenz-card border border-lenz-border overflow-hidden shrink-0">
                {u.avatar_url
                  ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-sm">{(u.name || '?')[0].toUpperCase()}</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                <p className="text-xs text-white/40 truncate">@{u.username}</p>
              </div>
              <button
                onClick={() => sendTo(u)}
                disabled={sending === u.id || sent.has(u.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  sent.has(u.id)
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gold text-lenz-bg hover:bg-gold/90 disabled:opacity-50'
                }`}
              >
                {sent.has(u.id) ? <><Check size={13} /> Sent</> : sending === u.id ? 'Sending…' : <><Send size={12} /> Send</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
