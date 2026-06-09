import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Globe, CheckCircle, Bookmark, BookmarkCheck, Send, X } from 'lucide-react'
import { supabase, type Profile, type Post } from '../../lib/supabase'
import { useShortlist, useHireRequests } from '../../hooks/useBusiness'
import { useAuth } from '../../contexts/AuthContext'
import { formatCount } from '../../lib/utils'

const PROJECT_TYPES = ['Editorial', 'Commercial', 'Event', 'Product', 'Fashion', 'Campaign', 'Wedding', 'Portrait']

export default function BusinessPhotographer() {
  const { id } = useParams<{ id: string }>()
  const { user, profile: me } = useAuth()
  const { has, toggle } = useShortlist()
  const { add } = useHireRequests()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showHire, setShowHire] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ projectType: 'Commercial', budget: '', date: '', message: '' })

  useEffect(() => {
    if (!id) return
    supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => { setProfile(data as Profile); setLoading(false) })
    supabase.from('posts').select('id, image_url, likes_count, created_at, user_id').eq('user_id', id).order('created_at', { ascending: false }).limit(12).then(({ data }) => setPosts((data ?? []) as Post[]))
  }, [id])

  async function submitHire(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!user) { setError('Please sign in to your brand account to send hire requests.'); return }
    if (user.id === profile.id) { setError("You can't send a hire request to yourself."); return }
    setError('')
    setSending(true)

    try {
      // Find or create a conversation between the brand and the photographer
      const { data: mine } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', user.id)
      const myConvs = (mine ?? []).map(c => c.conversation_id)
      let convId: string | null = null
      if (myConvs.length) {
        const { data: shared } = await supabase.from('conversation_participants')
          .select('conversation_id').eq('user_id', profile.id).in('conversation_id', myConvs)
        convId = shared?.[0]?.conversation_id ?? null
      }
      if (!convId) {
        const { data: conv, error: convErr } = await supabase.from('conversations').insert({ created_by: user.id }).select('id').single()
        if (convErr || !conv) throw convErr ?? new Error('Could not start conversation')
        convId = conv.id
        const { error: partErr } = await supabase.from('conversation_participants')
          .insert([{ conversation_id: convId, user_id: user.id }, { conversation_id: convId, user_id: profile.id }])
        if (partErr) throw partErr
      }

      // Compose the hire request as a real message they receive in-app
      const brandName = me?.name || 'A brand'
      const lines = [
        `📸 New Hire Request from ${brandName}`,
        ``,
        `Project: ${form.projectType}`,
        form.budget ? `Budget: ${form.budget}` : '',
        form.date ? `Date: ${form.date}` : '',
        ``,
        form.message,
      ].filter(l => l !== undefined && l !== null)

      const { error: msgErr } = await supabase.from('messages')
        .insert({ conversation_id: convId, sender_id: user.id, content: lines.join('\n').trim() })
      if (msgErr) throw msgErr

      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId)

      // Best-effort: also drop a hire_request notification (ignored if RLS blocks it)
      await supabase.from('notifications')
        .insert({ user_id: profile.id, actor_id: user.id, type: 'hire_request', message: `${brandName} sent you a hire request` })
        .then(() => {}, () => {})

      // Keep a local copy for the brand's own Hire Requests tracker
      add({ photographerId: profile.id, photographerName: profile.name, photographerAvatar: profile.avatar_url, ...form })

      setSent(true)
      setTimeout(() => { setShowHire(false); setSent(false); setForm({ projectType: 'Commercial', budget: '', date: '', message: '' }) }, 1800)
    } catch (err: any) {
      setError(err?.message || 'Failed to send hire request. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-7 h-7 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>
  if (!profile) return <div className="text-center py-24 text-white/30">Photographer not found</div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="px-4 md:px-8 py-5">
        <Link to="/business/discover" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-5"><ArrowLeft size={16} /> Back to discovery</Link>
      </div>

      <div className="relative h-48 md:h-60 bg-gradient-to-br from-lenz-card2 to-lenz-bg mx-4 md:mx-8 rounded-2xl overflow-hidden">
        {profile.cover_url && <img src={profile.cover_url} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-lenz-bg/80 to-transparent" />
      </div>

      <div className="px-4 md:px-8">
        <div className="flex items-end justify-between -mt-14 mb-5">
          <div className="w-28 h-28 rounded-2xl border-4 border-lenz-bg overflow-hidden bg-lenz-card2">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gold/40">{profile.name?.[0]}</div>}
          </div>
          <div className="flex gap-2 mb-2">
            <button onClick={() => toggle(profile.id)} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${has(profile.id) ? 'bg-gold text-lenz-bg' : 'border border-lenz-border text-white/60 hover:text-gold'}`}>
              {has(profile.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
            <button onClick={() => setShowHire(true)} className="btn-gold text-sm py-2.5 px-6"><Send size={15} /> Send Hire Request</button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
          {profile.is_pro && <><CheckCircle size={17} className="text-gold" /><span className="text-[10px] font-black text-lenz-bg bg-gold px-2 py-0.5 rounded-full">PRO</span></>}
          {profile.available && <span className="text-[10px] font-bold text-green-400 bg-green-950/30 border border-green-500/20 px-2 py-0.5 rounded-full">Available</span>}
        </div>
        <p className="text-sm text-white/40 mb-3">@{profile.username}</p>
        {profile.bio && <p className="text-sm text-white/70 leading-relaxed mb-4 max-w-xl">{profile.bio}</p>}

        <div className="flex flex-wrap gap-2 mb-4">
          {(profile.specialty ?? []).map(s => <span key={s} className="text-xs text-gold/70 bg-gold/8 border border-gold/12 px-3 py-1 rounded-full">{s}</span>)}
        </div>
        <div className="flex flex-wrap gap-5 text-sm mb-6">
          {profile.location && <span className="flex items-center gap-1.5 text-white/40"><MapPin size={14} />{profile.location}</span>}
          {profile.website && <a href={`https://${profile.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gold/70 hover:text-gold"><Globe size={14} />{profile.website}</a>}
          {profile.price_range && <span className="text-gold font-semibold">{profile.price_range}</span>}
        </div>
        <div className="flex gap-8 mb-8 pb-6 border-b border-white/5">
          {[['Posts', profile.posts_count ?? posts.length], ['Followers', profile.followers_count], ['Following', profile.following_count]].map(([l, v]) => (
            <div key={l as string}><span className="text-lg font-bold text-white">{formatCount(v as number)}</span><span className="text-sm text-white/35 ml-1.5">{l}</span></div>
          ))}
        </div>

        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Portfolio ({posts.length})</p>
        {posts.length === 0 ? <p className="text-sm text-white/25 py-8 text-center">No portfolio posts yet</p> : (
          <div className="grid grid-cols-3 gap-2 pb-8">
            {posts.map(p => <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-lenz-card"><img src={p.image_url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>)}
          </div>
        )}
      </div>

      {/* Hire modal */}
      {showHire && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowHire(false)}>
          <div className="w-full max-w-md card-premium p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-2xl bg-green-950/30 border border-green-500/20 flex items-center justify-center mx-auto mb-4"><CheckCircle size={28} className="text-green-400" /></div>
                <h3 className="text-xl font-bold text-white mb-2">Request Sent!</h3>
                <p className="text-sm text-white/40">{profile.name} will be notified of your hire request.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white">Hire {profile.name.split(' ')[0]}</h3>
                  <button onClick={() => setShowHire(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={submitHire} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Project Type</label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_TYPES.map(t => <button key={t} type="button" onClick={() => setForm(f => ({ ...f, projectType: t }))} className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.projectType === t ? 'bg-gold/15 border-gold/40 text-gold' : 'border-lenz-border text-white/40'}`}>{t}</button>)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Budget</label><input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="$2,000" required className="input-dark py-2.5 text-sm" /></div>
                    <div><label className="block text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="input-dark py-2.5 text-sm" /></div>
                  </div>
                  <div><label className="block text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Message</label><textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Describe your project…" required className="input-dark resize-none text-sm" /></div>
                  {error && <div className="bg-red-950/30 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
                  <button type="submit" disabled={sending} className="w-full btn-gold justify-center py-3 disabled:opacity-50"><Send size={15} /> {sending ? 'Sending…' : 'Send Hire Request'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
