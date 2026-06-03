import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useParams } from 'wouter'
import {
  ArrowLeft, Send, Palette, RotateCcw, Check, X, Image as ImageIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ── Background presets ────────────────────────────────────────────────────────
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

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  unsent: boolean
  sent_at: string
}

type OtherUser = { id: string; username: string; avatar_url: string | null }

// Track unsend window client-side
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

  // Unsend tracking: msgId → { sentAt }
  const [unsendMap, setUnsendMap] = useState<Map<string, UnsendEntry>>(new Map())
  const [nowTick, setNowTick] = useState(Date.now())

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tick every second to update countdown
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Load conversation
  const fetchConv = useCallback(async () => {
    if (!user || !convId) return

    const { data: conv } = await supabase.from('conversations').select('bg').eq('id', convId).single()
    if (conv) setBg(conv.bg)

    // Get other participant
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', convId)
      .neq('user_id', user.id)
      .limit(1)

    if (parts?.[0]) {
      const { data: prof } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', parts[0].user_id).single()
      if (prof) setOtherUser(prof)
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('sent_at', { ascending: true })
      .limit(100)

    if (msgs) setMessages(msgs as Message[])
    setLoading(false)
  }, [user, convId])

  useEffect(() => {
    fetchConv()
  }, [fetchConv])

  // Real-time new messages
  useEffect(() => {
    if (!convId) return
    const ch = supabase
      .channel(`chat_${convId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        payload => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        payload => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as Message : m))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [convId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !user || !convId || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      content,
    }).select().single()

    if (error) {
      toast.error('Failed to send')
    } else if (data) {
      // Track for 15s unsend window
      setUnsendMap(prev => new Map(prev).set(data.id, { sentAt: Date.now() }))
      // Update conversation updated_at
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId)
    }
    setSending(false)
    inputRef.current?.focus()
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

  const unsendRemaining = (msgId: string): number => {
    const entry = unsendMap.get(msgId)
    if (!entry) return 0
    return Math.max(0, 15 - Math.floor((nowTick - entry.sentAt) / 1000))
  }

  const canUnsend = (msgId: string) => unsendRemaining(msgId) > 0

  // Apply background style
  const bgStyle: React.CSSProperties = isBg(bg)
    ? { background: bg }
    : { backgroundColor: bg }

  return (
    <div className="flex flex-col min-h-screen" style={bgStyle}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 safe-top"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)' }}
      >
        <button onClick={() => navigate('/messages')} className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
          <ArrowLeft size={20} className="text-white/80" />
        </button>
        <button
          className="w-9 h-9 rounded-full bg-lenz-card border border-white/10 overflow-hidden flex-shrink-0 active:opacity-70 transition-opacity"
          onClick={() => otherUser && navigate(`/photographer/${otherUser.id}`)}
        >
          {otherUser?.avatar_url
            ? <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white/30 font-bold text-sm">
                {otherUser?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
          }
        </button>
        <button className="flex-1 min-w-0 text-left" onClick={() => otherUser && navigate(`/photographer/${otherUser.id}`)}>
          <p className="text-sm font-semibold text-white/90 truncate">
            {otherUser ? `@${otherUser.username}` : 'Loading…'}
          </p>
        </button>
        <button
          onClick={() => setShowBgPicker(true)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Customize background"
        >
          <Palette size={18} className="text-white/50" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
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

          return (
            <div key={msg.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.unsent
                  ? 'bg-white/5 text-white/30 italic border border-white/10 text-xs'
                  : isMine
                    ? 'bg-gold text-lenz-bg font-medium rounded-br-sm'
                    : 'bg-white/10 text-white/90 rounded-bl-sm backdrop-blur-sm'
              )}>
                {msg.unsent ? '🚫 Message unsent' : msg.content}
              </div>

              {/* Unsend countdown bar */}
              {isMine && !msg.unsent && remaining > 0 && (
                <button
                  onClick={() => unsendMessage(msg.id)}
                  className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-black/40 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/30 transition-all group"
                >
                  <RotateCcw size={10} className="text-white/40 group-hover:text-rose-400 transition-colors" />
                  <span className="text-[10px] text-white/40 group-hover:text-rose-400 transition-colors">
                    Unsend · {remaining}s
                  </span>
                  {/* Progress bar */}
                  <div className="w-8 h-0.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-white/40 group-hover:bg-rose-400 transition-colors rounded-full"
                      style={{ width: `${(remaining / 15) * 100}%`, transition: 'width 1s linear' }}
                    />
                  </div>
                </button>
              )}

              {/* Timestamp */}
              <span className="text-[9px] text-white/15 mt-0.5 px-1">
                {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="sticky bottom-0 px-4 py-3 safe-bottom flex items-center gap-3"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex-1 flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-4 py-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
          />
        </div>
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
            input.trim() && !sending
              ? 'gold-gradient shadow-lg shadow-gold/20 scale-100'
              : 'bg-white/5 scale-95 opacity-50'
          )}
        >
          {sending
            ? <div className="w-4 h-4 border-2 border-lenz-bg/40 border-t-lenz-bg rounded-full animate-spin" />
            : <Send size={16} className={input.trim() ? 'text-lenz-bg' : 'text-white/30'} />
          }
        </button>
      </div>

      {/* Background Picker Sheet */}
      {showBgPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowBgPicker(false)}
        >
          <div className="w-full max-w-[430px] md:max-w-[600px] mx-auto bg-lenz-card rounded-t-3xl pb-10 safe-bottom">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-lenz-border">
              <h2 className="text-sm font-bold text-white">Chat Background</h2>
              <button onClick={() => setShowBgPicker(false)} className="p-1 rounded-full hover:bg-white/5">
                <X size={16} className="text-white/50" />
              </button>
            </div>

            {/* Preset grid */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Presets</p>
              <div className="grid grid-cols-5 gap-2">
                {BG_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => saveBg(preset.value)}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl border-2 transition-all',
                        bg === preset.value ? 'border-gold scale-105' : 'border-white/10 group-hover:border-white/25'
                      )}
                      style={isBg(preset.value) ? { background: preset.value } : { backgroundColor: preset.preview }}
                    >
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

            {/* Custom color */}
            <div className="px-4 pt-3 pb-2 border-t border-lenz-border mt-2">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Custom Color</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl border border-lenz-border overflow-hidden relative"
                  style={{ backgroundColor: customColor }}
                >
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => setCustomColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/60 mb-1">Tap the swatch to pick</p>
                  <p className="text-[10px] text-white/25 font-mono">{customColor.toUpperCase()}</p>
                </div>
                <button
                  onClick={() => saveBg(customColor)}
                  className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold text-xs font-semibold hover:bg-gold/20 transition-colors"
                >
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
