import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface Msg { id: string; sender_id: string; content: string | null; image_url: string | null; sent_at: string; unsent: boolean }

function HireProposalCard({ content, isMine, onRespond }: { content: string; isMine: boolean; onRespond?: (accepted: boolean) => void }) {
  const [responded, setResponded] = useState<null | boolean>(null)
  let p: any = {}
  try { p = JSON.parse(content) } catch { return <span className="text-white/50 text-xs">Proposal (unreadable)</span> }
  const field = (label: string, value?: string | null) => value ? (
    <div className="flex items-start gap-2">
      <span className="text-[9px] font-bold tracking-widest uppercase text-gold/50 w-14 pt-0.5 shrink-0">{label}</span>
      <span className="text-[13px] text-white/80 leading-snug">{value}</span>
    </div>
  ) : null
  const respond = (accepted: boolean) => { if (responded !== null) return; setResponded(accepted); onRespond?.(accepted) }
  return (
    <div className="w-[260px] rounded-2xl overflow-hidden border border-gold/35"
      style={{ background: 'linear-gradient(135deg,#1a1200 0%,#2b1e00 100%)' }}>
      <div className="px-4 pt-4 pb-3 border-b border-gold/20"
        style={{ background: 'linear-gradient(135deg,rgba(236,200,92,0.18) 0%,rgba(236,200,92,0.06) 100%)' }}>
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-gold/80">📋 Hire Opportunity</span>
        <p className="text-white font-bold text-[15px] leading-snug mt-1">{p.projectType ?? 'Project'}</p>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {field('Date', p.date)}
        {field('Budget', p.budget)}
        {field('Brief', p.details)}
        {field('From', p.brandName)}
      </div>
      {!isMine && (
        responded !== null ? (
          <div className="px-4 py-2.5 border-t border-gold/15">
            <p className={`text-[11px] font-bold ${responded ? 'text-green-400' : 'text-rose-400'}`}>{responded ? '✓ Accepted' : '✕ Declined'}</p>
          </div>
        ) : (
          <div className="px-3 py-3 border-t border-gold/15 flex gap-2">
            <button onClick={() => respond(false)} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-bold">Decline</button>
            <button onClick={() => respond(true)} className="flex-1 py-2 rounded-xl bg-gold text-[#181203] text-xs font-bold">Accept</button>
          </div>
        )
      )}
    </div>
  )
}

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [other, setOther] = useState<{ username: string; name: string; avatar_url: string | null } | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id || !user) return
    supabase.from('messages').select('id, sender_id, content, image_url, sent_at, unsent').eq('conversation_id', id).order('sent_at', { ascending: true })
      .then(({ data }) => setMsgs((data ?? []) as Msg[]))
    // conversation_participants.user_id → auth.users, so fetch the profile separately
    supabase.from('conversation_participants').select('user_id').eq('conversation_id', id).neq('user_id', user.id)
      .then(async ({ data }) => {
        const otherId = data?.[0]?.user_id
        if (!otherId) return
        const { data: prof } = await supabase.from('profiles').select('username, name, avatar_url').eq('id', otherId).single()
        setOther(prof ?? null)
      })

    const ch = supabase.channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        payload => setMsgs(m => m.some(x => x.id === (payload.new as Msg).id) ? m : [...m, payload.new as Msg]))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id, user])

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function sendText(body: string) {
    if (!user || !body.trim() || !id) return
    const { data } = await supabase.from('messages').insert({ conversation_id: id, sender_id: user.id, content: body.trim() }).select().single()
    if (data) setMsgs(m => m.some(x => x.id === data.id) ? m : [...m, data as Msg])
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const body = text.trim(); setText('')
    await sendText(body)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-screen md:h-screen">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center gap-3">
        <Link to="/app/messages" className="text-white/60 hover:text-white"><ArrowLeft size={20} /></Link>
        <Link to={`/app/u/${other?.username}`} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-lenz-card2 border border-white/10">
            {other?.avatar_url ? <img src={other.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gold/50 font-bold text-sm">{other?.name?.[0]}</div>}
          </div>
          <div><p className="text-sm font-semibold text-white">{other?.name}</p><p className="text-xs text-white/35">@{other?.username}</p></div>
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {msgs.map(m => {
          const mine = m.sender_id === user?.id
          const isProposal = !m.unsent && !m.image_url && (m.content ?? '').startsWith('{"type":"hire_proposal"')
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={isProposal ? '' : `max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? 'bg-gold text-lenz-bg' : 'bg-lenz-card2 text-white'}`}>
                {m.unsent ? <span className="italic opacity-50 text-sm">Unsent</span> :
                  isProposal ? <HireProposalCard content={m.content!} isMine={mine}
                    onRespond={(accepted) => sendText(accepted
                      ? `✅ Hire request accepted — let's lock in the details!`
                      : `❌ Hire request declined. Thanks for reaching out.`)} /> :
                  m.image_url ? <img src={m.image_url} className="rounded-lg max-w-full" /> :
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>}
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="glass border-t border-white/5 px-3 py-3 flex items-center gap-2" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Message…"
          className="flex-1 bg-lenz-card border border-lenz-border rounded-full px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40" />
        <button type="submit" disabled={!text.trim()} className="w-10 h-10 rounded-full bg-gold flex items-center justify-center disabled:opacity-30 shrink-0"><Send size={16} className="text-lenz-bg" /></button>
      </form>
    </div>
  )
}
