import { useState, useRef } from 'react'
import { Building2, MapPin, Globe, Briefcase, Users, Camera, Pencil, Check, X, Image as ImageIcon, Trash2, Send } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useBusinessPage, type BusinessProfile } from '../../hooks/useBusinessPage'

const INDUSTRIES = ['Fashion', 'Beauty', 'Hospitality', 'Real Estate', 'Food & Beverage', 'Retail', 'Tech', 'Events', 'Agency', 'Other']

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function BusinessPage() {
  const { user } = useAuth()
  const { biz, posts, loading, saveProfile, addPost, deletePost, uploadImage } = useBusinessPage(user?.id)
  const [editing, setEditing] = useState(false)

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-7 h-7 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <CompanyHeader biz={biz} editing={editing} setEditing={setEditing} saveProfile={saveProfile} uploadImage={uploadImage} />
      <Composer addPost={addPost} uploadImage={uploadImage} company={biz?.company} logo={biz?.logo_url} />
      <Feed posts={posts} deletePost={deletePost} company={biz?.company} logo={biz?.logo_url} />
    </div>
  )
}

/* ---------------------------------------------------------------- Header */
function CompanyHeader({ biz, editing, setEditing, saveProfile, uploadImage }: {
  biz: BusinessProfile | null
  editing: boolean
  setEditing: (v: boolean) => void
  saveProfile: (p: Partial<BusinessProfile>) => Promise<void>
  uploadImage: (f: File, folder: string) => Promise<string | null>
}) {
  const [form, setForm] = useState<Partial<BusinessProfile>>({})
  const [saving, setSaving] = useState(false)
  const logoInput = useRef<HTMLInputElement>(null)
  const coverInput = useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = useState(biz?.logo_url ?? null)
  const [coverUrl, setCoverUrl] = useState(biz?.cover_url ?? null)

  const v = (k: keyof BusinessProfile) => (form[k] ?? biz?.[k] ?? '') as string

  function start() {
    setForm({})
    setLogoUrl(biz?.logo_url ?? null)
    setCoverUrl(biz?.cover_url ?? null)
    setEditing(true)
  }

  async function handleImage(file: File, kind: 'logo' | 'cover') {
    const url = await uploadImage(file, kind)
    if (!url) return
    if (kind === 'logo') setLogoUrl(url); else setCoverUrl(url)
    setForm(f => ({ ...f, [`${kind}_url`]: url }))
  }

  async function save() {
    setSaving(true)
    await saveProfile(form)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="card overflow-hidden mb-6">
      {/* Cover */}
      <div className="relative h-36 md:h-44 bg-gradient-to-br from-gold/10 to-lenz-card2">
        {coverUrl && <img src={coverUrl} className="w-full h-full object-cover" />}
        {editing && (
          <button onClick={() => coverInput.current?.click()}
            className="absolute top-3 right-3 flex items-center gap-1.5 text-xs bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-lg hover:bg-black/80 transition-colors">
            <ImageIcon size={12} /> Cover
          </button>
        )}
        <input ref={coverInput} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleImage(e.target.files[0], 'cover')} />
      </div>

      <div className="px-6 pb-6">
        {/* Logo */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl border-4 border-lenz-card bg-lenz-card2 overflow-hidden flex items-center justify-center">
              {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <Building2 size={28} className="text-gold/40" />}
            </div>
            {editing && (
              <button onClick={() => logoInput.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold text-lenz-bg flex items-center justify-center shadow-lg">
                <Camera size={13} />
              </button>
            )}
            <input ref={logoInput} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleImage(e.target.files[0], 'logo')} />
          </div>

          {!editing ? (
            <button onClick={start} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-gold border border-white/10 hover:border-gold/30 rounded-lg px-3 py-2 transition-colors">
              <Pencil size={12} /> Edit Page
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 text-xs text-white/50 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/5">
                <X size={12} /> Cancel
              </button>
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 text-xs bg-gold text-lenz-bg font-semibold rounded-lg px-3 py-2 hover:opacity-90 disabled:opacity-50">
                <Check size={12} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Identity */}
        {editing ? (
          <div className="space-y-3">
            <input value={v('company')} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-base font-semibold text-white placeholder-white/25 outline-none focus:border-gold/40" />
            <input value={v('tagline')} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Tagline (e.g. Luxury fashion house)"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40" />
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input value={v('location')} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location"
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40" />
              </div>
              <div className="relative">
                <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                <input value={v('website')} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="Website"
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40" />
              </div>
            </div>
            <select value={v('industry')} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40">
              <option value="">Select industry</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <textarea value={v('description')} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="About your business…" rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40 resize-none" />
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-white">{biz?.company || 'Your Company'}</h1>
            {biz?.tagline && <p className="text-sm text-gold/70 mt-0.5">{biz.tagline}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-white/40">
              {biz?.industry && <span className="flex items-center gap-1.5"><Briefcase size={12} /> {biz.industry}</span>}
              {biz?.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {biz.location}</span>}
              {biz?.team_size && <span className="flex items-center gap-1.5"><Users size={12} /> {biz.team_size}</span>}
              {biz?.website && <a href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gold/60 hover:text-gold"><Globe size={12} /> Website</a>}
            </div>
            {biz?.description && <p className="text-sm text-white/55 leading-relaxed mt-4">{biz.description}</p>}
            {!biz?.description && !biz?.company && (
              <p className="text-sm text-white/30 mt-3">Add your company details so photographers know who you are. Tap <span className="text-gold/60">Edit Page</span>.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Composer */
function Composer({ addPost, uploadImage, company, logo }: {
  addPost: (c: string, img: string | null) => Promise<void>
  uploadImage: (f: File, folder: string) => Promise<string | null>
  company: string | null | undefined
  logo: string | null | undefined
}) {
  const [content, setContent] = useState('')
  const [img, setImg] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const url = await uploadImage(file, 'post')
    if (url) setImg(url)
  }

  async function submit() {
    if (!content.trim()) return
    setPosting(true)
    await addPost(content, img)
    setContent(''); setImg(null); setPosting(false)
  }

  return (
    <div className="card p-4 mb-6">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-lenz-card2 overflow-hidden flex items-center justify-center shrink-0">
          {logo ? <img src={logo} className="w-full h-full object-cover" /> : <Building2 size={18} className="text-gold/40" />}
        </div>
        <div className="flex-1">
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={2}
            placeholder={`Share an update${company ? ` from ${company}` : ''}…`}
            className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none resize-none" />
          {img && (
            <div className="relative mt-2 rounded-xl overflow-hidden">
              <img src={img} className="w-full max-h-64 object-cover" />
              <button onClick={() => setImg(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><X size={14} /></button>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <button onClick={() => fileInput.current?.click()} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-gold transition-colors">
              <ImageIcon size={15} /> Photo
            </button>
            <input ref={fileInput} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button onClick={submit} disabled={!content.trim() || posting}
              className="flex items-center gap-1.5 text-xs bg-gold text-lenz-bg font-semibold rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-40 transition-opacity">
              <Send size={13} /> {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Feed */
function Feed({ posts, deletePost, company, logo }: {
  posts: { id: string; content: string; image_url: string | null; created_at: string }[]
  deletePost: (id: string) => Promise<void>
  company: string | null | undefined
  logo: string | null | undefined
}) {
  if (posts.length === 0) return (
    <div className="card p-10 text-center">
      <Building2 size={28} className="text-white/10 mx-auto mb-3" />
      <p className="text-sm text-white/30">No posts yet</p>
      <p className="text-xs text-white/20 mt-1">Share updates, campaigns, or news about your business.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {posts.map(p => (
        <div key={p.id} className="card p-4 group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-lenz-card2 overflow-hidden flex items-center justify-center shrink-0">
              {logo ? <img src={logo} className="w-full h-full object-cover" /> : <Building2 size={16} className="text-gold/40" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{company || 'Your Company'}</p>
              <p className="text-[11px] text-white/30">{timeAgo(p.created_at)}</p>
            </div>
            <button onClick={() => deletePost(p.id)} className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={14} />
            </button>
          </div>
          <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{p.content}</p>
          {p.image_url && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <img src={p.image_url} className="w-full object-cover" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
