import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  ArrowLeft, Send, Palette, RotateCcw, Check, X, ImagePlus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'

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

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
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
    if (!convId) return
    const ch = supabase.channel(`chat_${convId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        payload => {
          setMessages(prev => [...prev, { ...(payload.new as Message), reactions: [] }])
          if (user) supabase.from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', convId).eq('user_id', user.id)
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        payload => setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...payload.new as Message, reactions: m.reactions } : m)))
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        () => fetchConv())
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        () => fetchConv())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [convId, user, fetchConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    if (!user || !convId || sending) return
    setSending(true)
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      content: content || '',
      image_url: imageUrl ?? null,
    }).select().single()

    if (error) { toast.error('Failed to send'); setSending(false); return }
    if (data) {
      setUnsendMap(prev => new Map(prev).set(data.id, { sentAt: Date.now() }))
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId)
      if (otherUser?.id) {
        supabase.from('notifications').insert({ user_id: otherUser.id, actor_id: user.id, type: 'message', read: false })
      }
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const content = input.trim()
    setInput('')
    await sendMessage(content)
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''
    setUploadingImage(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/msg_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, file, { contentType: file.type })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      await sendMessage('', publicUrl)
    } catch (err: any) {
      toast.error(err.message ?? 'Could not send image')
    }
    setUploadingImage(false)
  }

  const handleReact = async (msgId: string, emoji: string) => {
    if (!user) return
    setReactionPickerMsgId(null)
    haptics.light()
    // Toggle: if already reacted with this emoji, remove it
    const msg = messages.find(m => m.id === msgId)
    const existing = msg?.reactions?.find(r => r.emoji === emoji && r.mine)
    if (existing) {
      await supabase.from('message_reactions').delete()
        .eq('message_id', msgId).eq('user_id', user.id).eq('emoji', emoji)
    } else {
      await supabase.from('message_reactions').insert({ message_id: msgId, user_id: user.id, emoji })
    }
  }

  const handleLongPressStart = (e: React.PointerEvent, msgId: string) => {
    // Capture the pointer so we get pointerup even if finger drifts
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    longPressTimer.current = setTimeout(() => {
      haptics.medium()
      setReactionPickerMsgId(msgId)
    }, 400)
  }

  const handleLongPressEnd = (e: React.PointerEvent) => {
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
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

  const bgStyle: React.CSSProperties = isBg(bg) ? { background: bg } : { backgroundColor: bg }

  return (
    <div className="flex flex-col overflow-hidden" style={{ ...bgStyle, height: '100%' }}>
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
        </button>
        <button onClick={() => setShowBgPicker(true)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <Palette size={18} className="text-white/50" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overscroll-none px-4 py-4 space-y-3">
        {loading && (
          <div className="flex justify-center pt-12">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
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

          return (
            <div key={msg.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
              <div
                className={cn('max-w-[75%] rounded-2xl text-sm leading-relaxed relative',
                  msg.unsent ? 'px-4 py-2.5 bg-white/5 text-white/30 italic border border-white/10 text-xs'
                    : msg.image_url ? 'overflow-hidden p-0'
                    : isMine ? 'px-4 py-2.5 bg-gold text-lenz-bg font-medium rounded-br-sm'
                    : 'px-4 py-2.5 bg-white/10 text-white/90 rounded-bl-sm backdrop-blur-sm'
                )}
                onPointerDown={e => !msg.unsent && handleLongPressStart(e, msg.id)}
                onPointerUp={handleLongPressEnd}
                onPointerCancel={handleLongPressEnd}
                style={{ touchAction: 'manipulation', userSelect: 'none' }}
              >
                {msg.unsent ? '🚫 Message unsent'
                  : msg.image_url ? (
                    <img
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
            ? <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
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
            ? <div className="w-4 h-4 border-2 border-lenz-bg/40 border-t-lenz-bg rounded-full animate-spin" />
            : <Send size={16} className={input.trim() ? 'text-lenz-bg' : 'text-white/30'} />}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />

      {/* Reaction picker */}
      {reactionPickerMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setReactionPickerMsgId(null)}>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 flex gap-3 shadow-2xl shadow-black/60"
            onClick={e => e.stopPropagation()}>
            {REACTION_EMOJIS.map(emoji => {
              const msg = messages.find(m => m.id === reactionPickerMsgId)
              const isActive = msg?.reactions?.some(r => r.emoji === emoji && r.mine)
              return (
                <button
                  key={emoji}
                  onClick={() => handleReact(reactionPickerMsgId, emoji)}
                  className={cn(
                    'text-2xl w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-75',
                    isActive ? 'bg-gold/20 scale-110' : 'hover:bg-white/10'
                  )}
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
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
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
