import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Edit2, Search, MessageCircle, X, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import Spinner from '@/components/Spinner'

type Participant = { username: string; name: string | null; avatar_url: string | null }

type Conversation = {
  id: string
  bg: string
  updated_at: string
  other_user: Participant | null
  last_message: string | null
  unread: boolean
}

type ProfileRow = { id: string; username: string; name: string | null; avatar_url: string | null }

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function Messages() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProfileRow[]>([])
  const [searching, setSearching] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    if (!user) return
    // Get all conversation IDs the user is in (with last_read_at)
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)

    if (!participations || participations.length === 0) {
      setConversations([])
      setLoading(false)
      return
    }

    const ids = participations.map(p => p.conversation_id)
    const lastReadMap: Record<string, string | null> = {}
    for (const p of participations) lastReadMap[p.conversation_id] = p.last_read_at

    // Get conversations
    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .in('id', ids)
      .order('updated_at', { ascending: false })

    if (!convos) { setLoading(false); return }

    // For each conversation, get the other participant and last message
    const enriched = await Promise.all(convos.map(async (c) => {
      const { data: parts } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', c.id)
        .neq('user_id', user.id)
        .limit(1)

      let other: Participant | null = null
      if (parts && parts[0]) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('username, name, avatar_url')
          .eq('id', parts[0].user_id)
          .single()
        if (prof) other = prof
      }

      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('content, unsent, sent_at, sender_id')
        .eq('conversation_id', c.id)
        .order('sent_at', { ascending: false })
        .limit(1)

      const lm = lastMsgs?.[0]
      const rawContent = lm?.content ?? ''
      const lastMessage = lm
        ? lm.unsent
          ? '🚫 Message unsent'
          : rawContent.startsWith('{"type":"hire_proposal"')
            ? '📋 Hire Opportunity'
            : rawContent
        : null

      // Unread = last message not sent by me, not unsent, and newer than last_read_at
      const myLastRead = lastReadMap[c.id]
      const unread = !!(lm && lm.sender_id !== user.id && !lm.unsent &&
        (!myLastRead || new Date(lm.sent_at) > new Date(myLastRead)))

      return { id: c.id, bg: c.bg, updated_at: c.updated_at, other_user: other, last_message: lastMessage, unread } as Conversation
    }))

    setConversations(enriched)
    setLoading(false)
  }, [user])

  const ptr = usePullToRefresh({ onRefresh: fetchConversations })

  useEffect(() => {
    fetchConversations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Live updates — listen on conversations table (updated_at bumps on each new message)
  // and on conversation_participants (last_read_at changes clear the unread dot)
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel('messages_list_live')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => fetchConversations())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' },
        () => fetchConversations())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` },
        () => fetchConversations())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user, fetchConversations])

  // User search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user?.id ?? '')
        .limit(8)
      setSearchResults((data as ProfileRow[]) ?? [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, user])

  const startConversation = async (otherUser: ProfileRow) => {
    if (!user) return

    // Find-or-create atomically via SECURITY DEFINER RPC (avoids participant RLS)
    const { data: convId, error } = await supabase.rpc('get_or_create_dm', { other_user: otherUser.id })
    if (error || !convId) { toast.error(error?.message ?? 'Could not start conversation'); return }

    setShowNewModal(false)
    navigate(`/chat/${convId}`)
  }

  const deleteConversation = async (id: string) => {
    if (!user) return
    // Verify user is a participant before deleting
    const { data: participation } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', id)
      .eq('user_id', user.id)
      .single()
    if (!participation) { toast.error('Unauthorized'); return }
    setDeleting(null)
    await supabase.from('messages').delete().eq('conversation_id', id)
    await supabase.from('conversation_participants').delete().eq('conversation_id', id)
    await supabase.from('conversations').delete().eq('id', id)
    setConversations(prev => prev.filter(c => c.id !== id))
    toast.success('Conversation deleted')
  }

  return (
    <PullToRefreshWrapper {...ptr} className="h-full bg-lenz-bg">
    <div className="min-h-full pb-6">
      <header className="sticky top-0 z-40 glass-dark px-4 pb-3 flex items-center justify-between safe-top">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center">
            <ArrowLeft size={20} className="text-white/70" />
          </button>
          <h1 className="text-base font-bold text-white tracking-wide">Messages</h1>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="w-9 h-9 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center"
        >
          <Edit2 size={18} className="text-gold" />
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col gap-1 p-4 mt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-lenz-card animate-pulse">
              <div className="w-12 h-12 rounded-full bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="h-2.5 bg-white/5 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 gap-4 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-lenz-card flex items-center justify-center">
            <MessageCircle size={24} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No messages yet</p>
          <p className="text-white/20 text-xs">Start a conversation with another photographer.</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="mt-2 px-5 py-2.5 rounded-full gold-gradient text-lenz-bg text-sm font-bold"
          >
            New Message
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 p-4 mt-1">
          {conversations.map(c => (
            <div
              key={c.id}
              className={cn('flex items-center rounded-2xl bg-lenz-bg', c.unread ? 'bg-white/5' : '')}
            >
              {/* Tap anywhere on the row to open the chat */}
              <button
                onClick={() => navigate(`/chat/${c.id}`)}
                className="flex items-center gap-3 p-3 flex-1 min-w-0 text-left"
              >
                {/* Avatar */}
                <div className={cn(
                  'w-12 h-12 rounded-full flex-shrink-0 overflow-hidden',
                  c.unread
                    ? 'ring-2 ring-gold/60 bg-lenz-card'
                    : 'bg-lenz-card border border-lenz-border'
                )}>
                  {c.other_user?.avatar_url
                    ? <img src={c.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-white/30 text-lg font-bold">
                        {c.other_user?.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn('text-sm font-semibold truncate', c.unread ? 'text-white' : 'text-white/90')}>
                      {c.other_user?.name || c.other_user?.username || 'Unknown'}
                    </p>
                    <span className="text-[10px] text-white/25 flex-shrink-0 ml-2">{timeAgo(c.updated_at)}</span>
                  </div>
                  <p className={cn('text-xs truncate mt-0.5', c.unread ? 'text-white/60 font-medium' : 'text-white/35')}>
                    {c.last_message ?? 'Start the conversation…'}
                  </p>
                </div>
                {c.unread && <span className="w-2.5 h-2.5 rounded-full bg-gold flex-shrink-0" />}
              </button>
              {/* Explicit delete button — no swipe gymnastics */}
              <button
                onClick={() => setDeleting(c.id)}
                className="p-3 mr-1 text-white/20 hover:text-rose-400 transition-colors flex-shrink-0"
                aria-label="Delete conversation"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation — fixed & centered, never tied to a row's position */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-8"
          onClick={() => setDeleting(null)}>
          <div className="w-full max-w-xs bg-lenz-card border border-lenz-border rounded-2xl p-5 text-center" onClick={e => e.stopPropagation()}>
            <p className="text-white font-semibold text-sm mb-1">Delete conversation?</p>
            <p className="text-white/40 text-xs mb-5">This removes the chat and its messages for you.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 rounded-xl bg-lenz-bg border border-lenz-border text-white/60 text-sm font-medium">Cancel</button>
              <button onClick={() => { const id = deleting; if (id) deleteConversation(id) }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowNewModal(false)}
        >
          <div className="w-full max-w-[430px] md:max-w-[600px] mx-auto bg-lenz-card rounded-t-3xl pb-10 safe-bottom">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-lenz-border">
              <h2 className="text-base font-bold text-white">New Message</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1 rounded-full hover:bg-white/5">
                <X size={18} className="text-white/50" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center gap-2 bg-lenz-bg rounded-xl px-3 py-2.5 border border-lenz-border">
                <Search size={15} className="text-white/30 flex-shrink-0" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by username…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}><X size={13} className="text-white/30" /></button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="px-4 max-h-72 overflow-y-auto">
              {searching && (
                <div className="flex justify-center py-6">
                  <Spinner size="sm" />
                </div>
              )}
              {!searching && searchQuery && searchResults.length === 0 && (
                <p className="text-center text-white/30 text-sm py-6">No users found</p>
              )}
              {!searching && searchResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => startConversation(u)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-lenz-bg border border-lenz-border overflow-hidden flex-shrink-0">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/30 font-bold">
                          {u.username[0].toUpperCase()}
                        </div>
                    }
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white/90">{u.name || `@${u.username}`}</p>
                    {u.name && <p className="text-xs text-white/40">@{u.username}</p>}
                  </div>
                  <ChevronRight size={14} className="text-white/20" />
                </button>
              ))}
              {!searchQuery && (
                <p className="text-center text-white/20 text-xs py-6">Type a username to search</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </PullToRefreshWrapper>
  )
}
