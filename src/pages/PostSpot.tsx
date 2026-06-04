import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { MapPin, X, Camera, ChevronLeft, ImagePlus, Send, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import LocationAutocomplete, { type LocationSuggestion } from '@/components/LocationAutocomplete'

const BUCKET = 'photos'

// ── Filters ──────────────────────────────────────────────────────────────────
const FILTERS = [
  { name: 'Original', css: 'none' },
  { name: 'Vivid',    css: 'saturate(1.8) contrast(1.15)' },
  { name: 'Fade',     css: 'contrast(0.85) brightness(1.1) saturate(0.8)' },
  { name: 'Noir',     css: 'grayscale(1) contrast(1.2)' },
  { name: 'Warm',     css: 'sepia(0.4) saturate(1.4) brightness(1.05)' },
  { name: 'Cool',     css: 'hue-rotate(200deg) saturate(1.2) brightness(0.95)' },
  { name: 'Drama',    css: 'contrast(1.4) saturate(1.2) brightness(0.9)' },
  { name: 'Matte',    css: 'contrast(0.9) brightness(1.05) saturate(0.75) sepia(0.15)' },
  { name: 'Golden',   css: 'sepia(0.6) saturate(1.6) brightness(1.1) hue-rotate(-10deg)' },
  { name: 'Moody',    css: 'brightness(0.8) contrast(1.3) saturate(0.6)' },
]

type StoryItem = {
  file: File
  preview: string
  caption: string
  locationName: string
  filterIndex: number
}

// Bake CSS filter onto image using canvas, returns a new File
async function applyFilterToImage(preview: string, filterCss: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.filter = filterCss
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Canvas toBlob failed')); return }
        resolve(new File([blob], 'spot.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    }
    img.onerror = reject
    img.src = preview
  })
}

export default function PostSpot() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<StoryItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [storyDuration, setStoryDuration] = useState(10)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'photo' | 'details'>('photo')

  const activeItem = items[activeIndex] ?? null

  const openCamera = async (source: CameraSource, fallback = true) => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      })
      if (photo.dataUrl) {
        const res = await fetch(photo.dataUrl)
        const blob = await res.blob()
        const file = new File([blob], 'spot.jpg', { type: 'image/jpeg' })
        addItem(file, photo.dataUrl)
      }
    } catch {
      if (fallback && source === CameraSource.Camera) fileInputRef.current?.click()
    }
  }

  const addItem = (file: File, preview: string) => {
    setItems(prev => {
      const next = [...prev, { file, preview, caption: '', locationName: '', filterIndex: 0 }]
      setActiveIndex(next.length - 1)
      setStep('details')
      return next
    })
  }

  useEffect(() => { openCamera(CameraSource.Camera, false) }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => addItem(file, reader.result as string)
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const updateActive = (patch: Partial<StoryItem>) => {
    setItems(prev => prev.map((it, i) => i === activeIndex ? { ...it, ...patch } : it))
  }

  const removeItem = (idx: number) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0) { setStep('photo'); setActiveIndex(0) }
      else setActiveIndex(Math.min(idx, next.length - 1))
      return next
    })
  }

  const handlePost = async () => {
    if (!user || items.length === 0) return
    const untagged = items.findIndex(it => !it.locationName.trim())
    if (untagged !== -1) {
      setActiveIndex(untagged)
      toast.error('Tag a location for every spot')
      return
    }

    setUploading(true)
    let failed = 0
    for (const item of items) {
      try {
        const filterCss = FILTERS[item.filterIndex].css
        // Bake filter into image if not Original
        const fileToUpload = filterCss !== 'none'
          ? await applyFilterToImage(item.preview, filterCss)
          : item.file

        const ext = 'jpg'
        const filePath = `${user.id}/spot_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET).upload(filePath, fileToUpload, { contentType: 'image/jpeg' })
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        const { error: insertError } = await supabase.from('spot_stories').insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: item.caption.trim() || null,
          location_name: item.locationName.trim(),
          expires_at: expiresAt,
          display_seconds: storyDuration,
        })
        if (insertError) throw insertError
      } catch {
        failed++
      }
    }

    setUploading(false)
    if (failed === 0) {
      toast.success(items.length > 1 ? `${items.length} spots shared!` : 'Spot shared!')
      navigate('/')
    } else {
      toast.error(`${failed} of ${items.length} spots failed to upload`)
    }
  }

  // ── Step 1: No photo yet ─────────────────────────────────────────────────
  if (step === 'photo' || items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col safe-top safe-bottom">
        <button onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <X size={18} className="text-white" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
            <Camera size={32} className="text-white/40" />
          </div>
          <div className="text-center">
            <h2 className="text-white text-xl font-bold tracking-wide">Share a Spot</h2>
            <p className="text-white/40 text-sm mt-1">Show photographers where you are</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={() => openCamera(CameraSource.Camera)}
              className="w-full py-4 rounded-2xl bg-gold text-lenz-bg font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Camera size={18} /> Open Camera
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-2xl bg-white/10 text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <ImagePlus size={18} /> Choose from Library
            </button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  const activeFilter = FILTERS[activeItem.filterIndex]

  // ── Step 2: Photos selected ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black flex flex-col safe-top safe-bottom">
      {/* Full screen photo with filter applied */}
      <div className="absolute inset-0">
        <img
          src={activeItem.preview}
          alt="preview"
          className="w-full h-full object-cover"
          style={{ filter: activeFilter.css === 'none' ? undefined : activeFilter.css }}
        />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3">
        <button onClick={() => { setItems([]); setStep('photo') }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <span className="text-white text-sm font-bold tracking-widest uppercase opacity-80">
          {items.length > 1 ? `Spot ${activeIndex + 1} of ${items.length}` : 'Your Spot'}
        </span>
        <button onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="relative z-10 flex gap-2 px-4 mt-3 overflow-x-auto no-scrollbar">
          {items.map((it, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-gold' : 'border-white/20'}`}>
              <img src={it.preview} className="w-full h-full object-cover"
                style={{ filter: FILTERS[it.filterIndex].css === 'none' ? undefined : FILTERS[it.filterIndex].css }} />
              <button onClick={e => { e.stopPropagation(); removeItem(i) }}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                <X size={10} className="text-white" />
              </button>
              {!it.locationName && <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-500/80" />}
            </button>
          ))}
          <button onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
            <Plus size={18} className="text-white/40" />
          </button>
        </div>
      )}

      {/* Filter strip */}
      <div className="absolute left-0 right-0 z-20" style={{ bottom: '320px' }}>
        <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((f, i) => (
            <button
              key={f.name}
              onClick={() => updateActive({ filterIndex: i })}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
            >
              <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${
                activeItem.filterIndex === i ? 'border-gold scale-105 shadow-[0_0_10px_rgba(201,168,76,0.5)]' : 'border-white/20'
              }`}>
                <img
                  src={activeItem.preview}
                  className="w-full h-full object-cover"
                  style={{ filter: f.css === 'none' ? undefined : f.css }}
                />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${
                activeItem.filterIndex === i ? 'text-gold' : 'text-white/50'
              }`}>{f.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-8 space-y-3" style={{ zIndex: 20 }}>
        {/* Location */}
        <div className="[&_input]:bg-transparent [&_input]:border-0 [&_input]:backdrop-blur-none bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl">
          <LocationAutocomplete
            value={activeItem.locationName}
            onChange={v => updateActive({ locationName: v })}
            onSelect={(s: LocationSuggestion) => updateActive({ locationName: s.display })}
            placeholder="Tag your location…"
            dropUp
          />
        </div>

        {/* Caption */}
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
          <input
            value={activeItem.caption}
            onChange={e => updateActive({ caption: e.target.value })}
            placeholder="Add a caption… (optional)"
            maxLength={200}
            className="w-full bg-transparent text-white text-sm placeholder-white/30 outline-none"
          />
        </div>

        {/* Duration picker */}
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
          <p className="text-[10px] text-white/35 font-bold tracking-[0.15em] uppercase mb-2">Story Duration</p>
          <div className="flex gap-2">
            {[5, 10, 15].map(s => (
              <button key={s} onClick={() => setStoryDuration(s)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  storyDuration === s ? 'bg-gold text-lenz-bg' : 'bg-white/8 text-white/50 border border-white/10'
                }`}>
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* Share button */}
        <button onClick={handlePost} disabled={uploading}
          className="w-full py-4 rounded-2xl bg-gold text-lenz-bg font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all">
          {uploading
            ? <span className="animate-pulse">Sharing…</span>
            : <><Send size={17} /> {items.length > 1 ? `Share ${items.length} Spots` : 'Share Spot'}</>}
        </button>

        <p className="text-center text-[11px] text-white/25 tracking-wide">
          Visible to everyone for 24 hours · Not on your profile
        </p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
    </div>
  )
}
