import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  ArrowLeft, Send, Palette, RotateCcw, Check, X, ImagePlus, Lock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { deriveConvKey, encryptBlob, clearDecryptedCache } from '@/lib/crypto'
import EncryptedImage from '@/components/EncryptedImage'
import Spinner from '@/components/Spinner'

// ── Hire proposal card ───────────────────────────────────────────────────────
function safeStr(v: unknown): string { return typeof v === 'string' ? v.slice(0, 500) : '' }

function HireProposalCard({ content, isMine }: { content: string; isMine: boolean }) {
  let raw: unknown = {}
  try { raw = JSON.parse(content) } catch { return <span className="text-white/50 text-xs">Proposal (unreadable)</span> }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return <span className="text-white/50 text-xs">Proposal (invalid)</span>
  const proposal = {
    projectType: safeStr((raw as any).projectType),
    date: safeStr((raw as any).date),
    budget: safeStr((raw as any).budget),
    details: safeStr((raw as any).details),
    photographerName: safeStr((raw as any).photographerName),
  }

  return (
    <div className="w-[260px] rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#1a1200 0%,#2b1e00 100%)', border: '1px solid rgba(201,168,76,0.35)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gold/20"
        style={{ background: 'linear-gradient(135deg,rgba(201,168,76,0.18) 0%,rgba(201,168,76,0.06) 100%)' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full gold-gradient flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-lenz-bg">
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gold/80">Hire Opportunity</span>
        </div>
        <p className="text-white font-bold text-[15px] leading-snug">{proposal.projectType}</p>
      </div>

      {/* Fields */}
      <div className="px-4 py-3 space-y-2.5">
        {proposal.date && (
          <div className="flex items-start gap-2">
            <span className="text-[9px] font-bold tracking-widest uppercase text-gold/50 w-14 pt-0.5 flex-shrink-0">Date</span>
            <span className="text-[13px] text-white/80 leading-snug">{proposal.date}</span>
          </div>
        )}
        {proposal.budget && (
          <div className="flex items-start gap-2">
            <span className="text-[9px] font-bold tracking-widest uppercase text-gold/50 w-14 pt-0.5 flex-shrink-0">Budget</span>
            <span className="text-[13px] text-white/80 leading-snug">{proposal.budget}</span>
          </div>
        )}
        {proposal.details && (
          <div className="flex items-start gap-2">
            <span className="text-[9px] font-bold tracking-widest uppercase text-gold/50 w-14 pt-0.5 flex-shrink-0">Details</span>
            <span className="text-[13px] text-white/70 leading-snug">{proposal.details}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gold/15"
        style={{ background: 'rgba(201,168,76,0.04)' }}>
        <p className="text-[10px] text-gold/50 font-medium">
          {isMine ? `Sent to ${proposal.photographerName}` : 'Reply to discuss availability'}
        </p>
      </div>
    </div>
  )
}

const BG_PRESETS = [
  { label: 'Dark',       value: '#0A0804',   preview: '#0A0804' },
  { label: 'Midnight',   value: 'linear-gradient(135deg,#0A0804 0%,#1a0a2e 100%)', preview: '#0f0619' },
  { label: 'Ocean',      value: 'linear-gradient(135deg,#021220 0%,#0d2847 100%)', preview: '#081c33' },
  { label: 'Ember',      value: 'linear-gradient(135deg,#1a0500 0%,#3d1000 100%)', preview: '#2b0b00' },
  { label: 'Forest',     value: 'linear-gradient(135deg,#030f03 0%,#0d2b0d 100%)', preview: '#081908' },
  { label: 'Gold',       value: 'linear-gradient(135deg,#150e00 0%,#2b1e00 100%)', preview: '#1e1500' },
  { label: 'Purple',     value: 'linear-gradient(135deg,#10001a 0%,#2a0040 100%)', preview: '#1a0028' },
  { label: 'Slate',      value: 'linear-gradient(135deg,#0d1117 0%,#1c2128 100%)', preview: '#15191e' },
  { label: 'Rose',       value: 'linear-gradient(135deg,#1a0610 0%,#2b0f1a 100%)', preview: '#220a14' },
  { label: 'Teal',       value: 'linear-gradient(135deg,#001a1a 0%,#002b2b 100%)', preview: '#001f1f' },
  { label: 'Coffee',     value: 'linear-gradient(135deg,#1a1008 0%,#2b1a0a 100%)', preview: '#221506' },
  { label: 'Night Sky',  value: 'linear-gradient(180deg,#040812 0%,#0a0a20 60%,#0A0804 100%)', preview: '#07091a' },
  { label: 'Dusk',       value: 'linear-gradient(180deg,#1a0a00 0%,#0a0010 100%)', preview: '#120508' },
  { label: 'Gunmetal',   value: 'linear-gradient(135deg,#111418 0%,#1c2128 100%)', preview: '#17191d' },
  { label: 'Cherry',     value: 'linear-gradient(135deg,#1a0008 0%,#3d0015 100%)', preview: '#2b000f' },
]

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏', '📸', '🎯']

type Reaction = { emoji: string; count: number; mine: boolean }

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  image_url?: string | null
  unsent: boolean
  sent_at: string
  reactions?: Reaction[]
}

type OtherUser = { id: string; username: string; avatar_url: string | null }
type UnsendEntry = { sentAt: number }

function isBg(value: string) {
  return value.startsWith('linear-gradient')
}

export default function Chat() {
  const params = useParams<{ id: string }>()
  const convId = params.id
  const [, navigate] = useLocation()
  const { user } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [bg, setBg] = useState('#0A0804')
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#0A0804')
  const [unsendMap, setUnsendMap] = useState<Map<string, UnsendEntry>>(new Map())
  const [nowTick, setNowTick] = useState(Date.now())
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [convKey, setConvKey] = useState<CryptoKey | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Track keyboard height via visualViewport (iOS WKWebView)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardOffset(offset)
      // Scroll to bottom when keyboard opens
      if (offset > 0) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    return () => { vv.removeEventListener('resize', onResize); vv.removeEventListener('scroll', onResize) }
  }, [])

  const fetchConv = useCallback(async () => {
    if (!user || !convId) return
    const { data: conv } = await supabase.from('conversations').select('bg').eq('id', convId).single()
    if (conv) setBg(conv.bg)

    const { data: parts } = await supabase
      .from('conversation_participants').select('user_id')
      .eq('conversation_id', convId).neq('user_id', user.id).limit(1)
    if (parts?.[0]) {
      const { data: prof } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', parts[0].user_id).single()
      if (prof) setOtherUser(prof)
    }

    const { data: msgs } = await supabase
      .from('messages').select('*').eq('conversation_id', convId)
      .order('sent_at', { ascending: true }).limit(100)
    if (!msgs) { setLoading(false); return }

    // Load reactions for all messages
    const msgIds = msgs.map(m => m.id)
    const { data: rxRows } = await supabase
      .from('message_reactions').select('message_id, emoji, user_id')
      .in('message_id', msgIds)

    const messagesWithRx = msgs.map(m => ({
      ...m,
      reactions: buildReactions(rxRows ?? [], m.id, user.id),
    }))
    setMessages(messagesWithRx as Message[])
    setLoading(false)
  }, [user, convId])

  useEffect(() => { fetchConv() }, [fetchConv])

  useEffect(() => {
    if (!convId || !user) return
    supabase.from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', convId).eq('user_id', user.id)
  }, [convId, user])

  useEffect(() => {
    if (!convId || !user) return
    // Verify user is a participant before subscribing to this conversation's messages
    supabase.from('conversation_participants')
      .select('id').eq('conversation_id', convId).eq('user_id', user.id).single()
      .then(({ data }) => { if (!data) navigate('/messages') })
    const ch = supabase.channel(`chat_${convId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        payload => {
          const incoming = payload.new as Message
          // Skip if already added optimistically
          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev
            return [...prev, { ...incoming, reactions: [] }]
          })
          if (user) supabase.from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', convId).eq('user_id', user.id)
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        payload => setMessages(prev => prev.map(m =>
          m.id === payload.new.id ? { ...payload.new as Message, reactions: m.reactions } : m
        )))
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        ({ new: row }: any) => {
          setMessages(prev => prev.map(m => {
            if (m.id !== row.message_id) return m
            const existing = m.reactions ?? []
            const already = existing.findIndex(r => r.emoji === row.emoji)
            if (already >= 0) {
              const updated = [...existing]
              updated[already] = { ...updated[already], count: updated[already].count + 1, mine: updated[already].mine || row.user_id === user?.id }
              return { ...m, reactions: updated }
            }
            return { ...m, reactions: [...existing, { emoji: row.emoji, count: 1, mine: row.user_id === user?.id }] }
          }))
        })
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        ({ old: row }: any) => {
          setMessages(prev => prev.map(m => {
            if (m.id !== row.message_id) return m
            const updated = (m.reactions ?? [])
              .map(r => r.emoji === row.emoji ? { ...r, count: r.count - 1, mine: r.emoji === row.emoji && row.user_id === user?.id ? false : r.mine } : r)
              .filter(r => r.count > 0)
            return { ...m, reactions: updated }
          }))
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [convId, user])

  // Derive conversation encryption key + clean up decrypted blobs on unmount
  useEffect(() => {
    if (!convId) return
    deriveConvKey(convId).then(setConvKey)
    return () => { clearDecryptedCache() }
  }, [convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length <= 1 ? 'instant' : 'smooth' } as ScrollIntoViewOptions)
  }, [messages])

  function buildReactions(rows: any[], msgId: string, myId: string): Reaction[] {
    const map = new Map<string, { count: number; mine: boolean }>()
    for (const r of rows) {
      if (r.message_id !== msgId) continue
      const cur = map.get(r.emoji) ?? { count: 0, mine: false }
      map.set(r.emoji, { count: cur.count + 1, mine: cur.mine || r.user_id === myId })
    }
    return Array.from(map.entries()).map(([emoji, v]) => ({ emoji, ...v }))
  }

  const sendMessage = async (content: string, imageUrl?: string) => {
    if (!user || !convId) return
    setSending(true)

    // Optimistic insert — shows immediately without waiting for real-time
    const tempId = `temp_${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      conversation_id: convId,
      sender_id: user.id,
      content: content || '',
      image_url: imageUrl ?? null,
      unsent: false,
      sent_at: new Date().toISOString(),
      reactions: [],
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      content: content || '',
      image_url: imageUrl ?? null,
    }).select().single()

    if (error) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId))
      toast.error('Failed to send')
      setSending(false)
      return
    }

    if (data) {
      // Replace temp with real message
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, reactions: [] } : m))
      setUnsendMap(prev => new Map(prev).set(data.id, { sentAt: Date.now() }))
      supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId)
      if (otherUser?.id) {
        supabase.from('notifications').insert({ user_id: otherUser.id, actor_id: user.id, type: 'message', read: false })
      }
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleSend = () => {
    if (!input.trim()) return
    const content = input.trim()
    setInput('')
    sendMessage(content)
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''
    setUploadingImage(true)
    try {
      const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
      const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']
      const rawExt = (file.name.split('.').pop() ?? '').toLowerCase()
      // Validate both MIME type (harder to spoof) and extension
      if (!ALLOWED_MIME.includes(file.type) || !ALLOWED_EXTS.includes(rawExt)) throw new Error('Unsupported file type')

      // Encrypt before upload — ciphertext stored in storage, not plaintext
      const key = convKey ?? await deriveConvKey(convId!)
      const encrypted = await encryptBlob(file, key)
      // Random filename — never expose user ID or timestamp in path
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
      const path = `${rand}.enc`
      const { error: upErr } = await supabase.storage
        .from('chat-photos').upload(path, encrypted, { contentType: 'application/octet-stream' })
      if (upErr) throw upErr
      // Store the storage path — not a public URL (bucket is private)
      const storageRef = `chat-photos/${path}`
      await sendMessage('', storageRef)
    } catch (err: any) {
      toast.error(err.message ?? 'Could not send image')
    }
    setUploadingImage(false)
  }

  const handleReact = async (msgId: string, emoji: string) => {
    if (!user) return
    setReactionPickerMsgId(null)
    haptics.light()
    const msg = messages.find(m => m.id === msgId)
    const existing = msg?.reactions?.find(r => r.emoji === emoji && r.mine)
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const rxns = m.reactions ?? []
      if (existing) {
        const updated = rxns.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r).filter(r => r.count > 0)
        return { ...m, reactions: updated }
      } else {
        const idx = rxns.findIndex(r => r.emoji === emoji)
        if (idx >= 0) {
          const updated = [...rxns]
          updated[idx] = { ...updated[idx], count: updated[idx].count + 1, mine: true }
          return { ...m, reactions: updated }
        }
        return { ...m, reactions: [...rxns, { emoji, count: 1, mine: true }] }
      }
    }))
    if (existing) {
      await supabase.from('message_reactions').delete()
        .eq('message_id', msgId).eq('user_id', user.id).eq('emoji', emoji)
    } else {
      await supabase.from('message_reactions').insert({ message_id: msgId, user_id: user.id, emoji })
    }
  }

  const handleLongPressStart = (msgId: string) => {
    longPressTimer.current = setTimeout(() => {
      haptics.medium()
      setReactionPickerMsgId(msgId)
    }, 400)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
  }

  const unsendMessage = async (msgId: string) => {
    const entry = unsendMap.get(msgId)
    if (!entry) return
    if (nowTick - entry.sentAt > 15000) { toast.error('Unsend window expired'); return }
    await supabase.from('messages').update({ unsent: true }).eq('id', msgId)
    setUnsendMap(prev => { const m = new Map(prev); m.delete(msgId); return m })
    toast.success('Message unsent')
  }

  const saveBg = async (value: string) => {
    setBg(value)
    setShowBgPicker(false)
    await supabase.from('conversations').update({ bg: value }).eq('id', convId)
  }

  const unsendRemaining = (msgId: string) => {
    const entry = unsendMap.get(msgId)
    if (!entry) return 0
    return Math.max(0, 15 - Math.floor((nowTick - entry.sentAt) / 1000))
  }

  const canUnsend = (msgId: string) => unsendRemaining(msgId) > 0

  const safeBg = BG_PRESETS.some(p => p.value === bg) || /^#[0-9a-fA-F]{6}$/.test(bg) ? bg : '#0A0804'
  const bgStyle: React.CSSProperties = isBg(safeBg) ? { background: safeBg } : { backgroundColor: safeBg }

  return (
    <div className="flex flex-col" style={{ ...bgStyle, position: 'fixed', inset: 0, paddingBottom: keyboardOffset, zIndex: 10 }}>
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 safe-top flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => window.history.length > 1 ? window.history.back() : navigate('/messages')}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
          <ArrowLeft size={20} className="text-white/80" />
        </button>
        <button className="w-9 h-9 rounded-full bg-lenz-card border border-white/10 overflow-hidden flex-shrink-0 active:opacity-70"
          onClick={() => otherUser && navigate(`/photographer/${otherUser.id}`)}>
          {otherUser?.avatar_url
            ? <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white/30 font-bold text-sm">{otherUser?.username?.[0]?.toUpperCase() ?? '?'}</div>}
        </button>
        <button className="flex-1 min-w-0 text-left" onClick={() => otherUser && navigate(`/photographer/${otherUser.id}`)}>
          <p className="text-sm font-semibold text-white/90 truncate">{otherUser ? `@${otherUser.username}` : 'Loading…'}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Lock size={8} className="text-gold/60" />
            <span className="text-[9px] text-gold/60 font-medium tracking-wide">End-to-end encrypted</span>
          </div>
        </button>
        <button onClick={() => setShowBgPicker(true)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <Palette size={18} className="text-white/50" />
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-none px-4 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {loading && (
          <div className="flex justify-center pt-12">
            <Spinner size="md" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 gap-3">
            <p className="text-white/20 text-sm">Say hello 👋</p>
          </div>
        )}

        {messages.map(msg => {
          const isMine = msg.sender_id === user?.id
          const remaining = canUnsend(msg.id) ? unsendRemaining(msg.id) : 0
          const hasReactions = (msg.reactions?.length ?? 0) > 0
          const isProposal = !msg.unsent && !msg.image_url && msg.content.startsWith('{"type":"hire_proposal"')

          return (
            <div key={msg.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
              <div
                className={cn('rounded-2xl text-sm leading-relaxed relative',
                  msg.unsent ? 'px-4 py-2.5 bg-white/5 text-white/30 italic border border-white/10 text-xs max-w-[75%]'
                    : isProposal ? ''
                    : msg.image_url ? 'overflow-hidden p-0 max-w-[75%]'
                    : isMine ? 'px-4 py-2.5 bg-gold text-lenz-bg font-medium rounded-br-sm max-w-[75%]'
                    : 'px-4 py-2.5 bg-white/10 text-white/90 rounded-bl-sm backdrop-blur-sm max-w-[75%]'
                )}
                onTouchStart={() => !msg.unsent && handleLongPressStart(msg.id)}
                onTouchEnd={handleLongPressEnd}
                onTouchMove={handleLongPressEnd}
                style={{ touchAction: 'manipulation', userSelect: 'none' }}
              >
                {msg.unsent ? '🚫 Message unsent'
                  : isProposal ? <HireProposalCard content={msg.content} isMine={isMine} />
                  : msg.image_url ? (
                    msg.image_url.endsWith('.enc')
                      ? <EncryptedImage src={msg.image_url} convKey={convKey} />
                      : <img
                          src={msg.image_url}
                          alt="photo"
                          className="max-w-[240px] max-h-[300px] object-cover rounded-2xl"
                          onLoad={() => bottomRef.current?.scrollIntoView()}
                        />
                  ) : msg.content}
              </div>

              {/* Reactions bubble */}
              {hasReactions && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {msg.reactions!.map(r => (
                    <button
                      key={r.emoji}
                      onClick={() => handleReact(msg.id, r.emoji)}
                      className={cn(
                        'flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-all',
                        r.mine
                          ? 'bg-gold/20 border-gold/40 text-white'
                          : 'bg-white/8 border-white/10 text-white/70'
                      )}
                    >
                      <span>{r.emoji}</span>
                      {r.count > 1 && <span className="text-[10px] ml-0.5">{r.count}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Unsend countdown */}
              {isMine && !msg.unsent && remaining > 0 && (
                <button onClick={() => unsendMessage(msg.id)}
                  className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-black/40 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/30 transition-all group">
                  <RotateCcw size={10} className="text-white/40 group-hover:text-rose-400 transition-colors" />
                  <span className="text-[10px] text-white/40 group-hover:text-rose-400 transition-colors">Unsend · {remaining}s</span>
                  <div className="w-8 h-0.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-white/40 group-hover:bg-rose-400 transition-colors rounded-full"
                      style={{ width: `${(remaining / 15) * 100}%`, transition: 'width 1s linear' }} />
                  </div>
                </button>
              )}
              <span className="text-[9px] text-white/15 mt-0.5 px-1">
                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 safe-bottom flex items-center gap-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
        >
          {uploadingImage
            ? <Spinner size="sm" className="border-white/20 border-t-white/60" />
            : <ImagePlus size={18} className="text-white/50" />}
        </button>
        <div className="flex-1 flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
            input.trim() && !sending ? 'gold-gradient shadow-lg shadow-gold/20' : 'bg-white/5 opacity-50'
          )}
        >
          {sending
            ? <Spinner size="sm" className="border-lenz-bg/40 border-t-lenz-bg" />
            : <Send size={16} className={input.trim() ? 'text-lenz-bg' : 'text-white/30'} />}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

      {/* Reaction picker */}
      {reactionPickerMsgId && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 200 }}
          onTouchEnd={() => setReactionPickerMsgId(null)}
          onClick={() => setReactionPickerMsgId(null)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative flex items-center px-2 py-2 rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(22,22,22,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
            onTouchEnd={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            {REACTION_EMOJIS.map(emoji => {
              const msg = messages.find(m => m.id === reactionPickerMsgId)
              const isActive = msg?.reactions?.some(r => r.emoji === emoji && r.mine)
              const pid = reactionPickerMsgId
              return (
                <button
                  key={emoji}
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-[26px] transition-transform',
                    isActive ? 'scale-125 bg-gold/20' : ''
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  onTouchEnd={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleReact(pid, emoji)
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    handleReact(pid, emoji)
                  }}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Background Picker */}
      {showBgPicker && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowBgPicker(false)}>
          <div className="w-full max-w-[430px] md:max-w-[600px] mx-auto bg-lenz-card rounded-t-3xl pb-10 safe-bottom">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-lenz-border">
              <h2 className="text-sm font-bold text-white">Chat Background</h2>
              <button onClick={() => setShowBgPicker(false)} className="p-1 rounded-full hover:bg-white/5">
                <X size={16} className="text-white/50" />
              </button>
            </div>
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Presets</p>
              <div className="grid grid-cols-5 gap-2">
                {BG_PRESETS.map(preset => (
                  <button key={preset.label} onClick={() => saveBg(preset.value)} className="flex flex-col items-center gap-1.5 group">
                    <div className={cn('w-12 h-12 rounded-2xl border-2 transition-all',
                        bg === preset.value ? 'border-gold scale-105' : 'border-white/10 group-hover:border-white/25')}
                      style={isBg(preset.value) ? { background: preset.value } : { backgroundColor: preset.preview }}>
                      {bg === preset.value && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check size={14} className="text-gold" />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-white/30 group-hover:text-white/50">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 pt-3 pb-2 border-t border-lenz-border mt-2">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Custom Color</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl border border-lenz-border overflow-hidden relative" style={{ backgroundColor: customColor }}>
                  <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/60 mb-1">Tap the swatch to pick</p>
                  <p className="text-[10px] text-white/25 font-mono">{customColor.toUpperCase()}</p>
                </div>
                <button onClick={() => saveBg(customColor)}
                  className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold text-xs font-semibold hover:bg-gold/20 transition-colors">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
