import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, MapPin, Loader2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const CATS = ['Portrait', 'Landscape', 'Street', 'Wedding', 'Commercial', 'Fashion', 'Travel', 'Nature', 'Event', 'Other']
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']

export default function Upload() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('Portrait')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function pick(f: File) {
    if (!ALLOWED.includes(f.type)) { alert('Unsupported file type. Please select a photo.'); return }
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  async function publish() {
    if (!user || !file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('photos').upload(path, file)
    if (upErr) { alert(upErr.message); setUploading(false); return }
    const { data: pub } = supabase.storage.from('photos').getPublicUrl(path)
    const { data, error } = await supabase.from('posts').insert({
      user_id: user.id, image_url: pub.publicUrl, caption: caption.trim() || null,
      location_name: location.trim() || null, category,
    }).select('id').single()
    setUploading(false)
    if (error) { alert(error.message); return }
    if (data) navigate(`/app/post/${data.id}`)
  }

  return (
    <div className="max-w-xl mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <button onClick={() => history.back()} className="text-white/60 hover:text-white"><ArrowLeft size={20} /></button>
        <h1 className="text-base font-semibold text-white">New Post</h1>
        <button onClick={publish} disabled={!file || uploading} className="text-sm font-semibold text-gold disabled:opacity-40 flex items-center gap-1.5">
          {uploading && <Loader2 size={14} className="animate-spin" />}Share
        </button>
      </header>

      <div className="px-4 py-5 space-y-5">
        {!preview ? (
          <button onClick={() => inputRef.current?.click()} className="w-full aspect-square rounded-2xl border-2 border-dashed border-lenz-border flex flex-col items-center justify-center gap-3 text-white/30 hover:border-gold/30 hover:text-gold/60 transition-all">
            <ImagePlus size={40} />
            <span className="text-sm font-medium">Tap to select a photo</span>
          </button>
        ) : (
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-black">
            <img src={preview} className="w-full h-full object-contain" />
            <button onClick={() => { setFile(null); setPreview('') }} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white"><X size={18} /></button>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && pick(e.target.files[0])} />

        <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} placeholder="Write a caption…"
          className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40 resize-none" />

        <div className="relative">
          <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Add location"
            className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40" />
        </div>

        <div>
          <p className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATS.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${category === c ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-lenz-card border-lenz-border text-white/40 hover:text-white/70'}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
