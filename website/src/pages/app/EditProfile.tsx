import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const SPECIALTIES = ['Portrait', 'Wedding', 'Landscape', 'Street', 'Commercial', 'Fashion', 'Travel', 'Nature', 'Event', 'Product', 'Architecture', 'Food', 'Sports', 'Editorial', 'Real Estate']

export default function EditProfile() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: profile?.name ?? '', bio: profile?.bio ?? '', location: profile?.location ?? '',
    website: profile?.website ?? '', price_range: profile?.price_range ?? '',
    available: profile?.available ?? false, second_shooter: profile?.second_shooter ?? false,
  })
  const [specialty, setSpecialty] = useState<string[]>(profile?.specialty ?? [])
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? '')
  const [cover, setCover] = useState(profile?.cover_url ?? '')
  const [saving, setSaving] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  async function upload(file: File, kind: 'avatar' | 'cover') {
    if (!profile) return
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/${kind}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { alert(error.message); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    if (kind === 'avatar') setAvatar(data.publicUrl); else setCover(data.publicUrl)
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      ...form, specialty, avatar_url: avatar || null, cover_url: cover || null,
    }).eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    navigate(`/app/u/${profile.username}`)
  }

  const toggle = (s: string) => setSpecialty(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <button onClick={() => history.back()} className="text-white/60 hover:text-white flex items-center gap-2"><ArrowLeft size={20} /></button>
        <h1 className="text-base font-semibold text-white">Edit Profile</h1>
        <button onClick={save} disabled={saving} className="text-sm font-semibold text-gold disabled:opacity-50 flex items-center gap-1.5">
          {saving && <Loader2 size={14} className="animate-spin" />}Save
        </button>
      </header>

      <div className="pb-12">
        <div className="relative h-36 bg-gradient-to-br from-lenz-card2 to-lenz-bg cursor-pointer" onClick={() => coverRef.current?.click()}>
          {cover && <img src={cover} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Camera size={24} className="text-white/70" /></div>
          <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0], 'cover')} />
        </div>

        <div className="px-4">
          <div className="relative w-24 h-24 rounded-2xl border-4 border-lenz-bg overflow-hidden bg-lenz-card2 -mt-12 mb-6 cursor-pointer" onClick={() => avatarRef.current?.click()}>
            {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gold/40">{form.name?.[0]}</div>}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Camera size={18} className="text-white/70" /></div>
            <input ref={avatarRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0], 'avatar')} />
          </div>

          <div className="space-y-4">
            {[['name', 'Name', 'Your name'], ['location', 'Location', 'City, Country'], ['website', 'Website', 'yoursite.com'], ['price_range', 'Price Range', '$500–1500']].map(([k, label, ph]) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">{label}</label>
                <input value={(form as any)[k]} onChange={set(k)} placeholder={ph}
                  className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold/40" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Bio</label>
              <textarea value={form.bio} onChange={set('bio')} rows={3} placeholder="Tell clients about your work…"
                className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-gold/40 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Specialties</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <button key={s} onClick={() => toggle(s)} type="button"
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${specialty.includes(s) ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-lenz-card border-lenz-border text-white/40 hover:text-white/70'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {[['available', 'Available for hire'], ['second_shooter', 'Available as 2nd shooter']].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setForm(f => ({ ...f, [k]: !(f as any)[k] }))}
                  className="flex items-center gap-3 w-full">
                  <div className={`w-11 h-6 rounded-full transition-all relative ${(form as any)[k] ? 'bg-gold' : 'bg-lenz-card2'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${(form as any)[k] ? 'left-[22px]' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm text-white/70">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
