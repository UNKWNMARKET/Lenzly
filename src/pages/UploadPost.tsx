import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { MapPin, X, Image, ChevronDown, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import LocationAutocomplete from '@/components/LocationAutocomplete'
import { haptics } from '@/lib/haptics'

const CATEGORIES = ['Portrait', 'Landscape', 'Street', 'Wedding', 'Concert', 'Commercial', 'Travel', 'Nature', 'Fashion', 'Other']

const RATIOS = [
  { label: '1:1', w: 1, h: 1 },
  { label: '4:5', w: 4, h: 5 },
  { label: '16:9', w: 16, h: 9 },
]

// ── Crop Editor ───────────────────────────────────────────────────────────────
function CropEditor({ src, onConfirm, onCancel }: {
  src: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}) {
  const [ratioIdx, setRatioIdx] = useState(0)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [natSize, setNatSize] = useState({ w: 0, h: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  // Touch tracking refs (don't need re-renders)
  const lastTouchesRef = useRef<{ x: number; y: number }[]>([])
  const baseOffsetRef = useRef({ x: 0, y: 0 })
  const baseScaleRef = useRef(1)
  const basePinchRef = useRef(0)

  const ratio = RATIOS[ratioIdx]

  // Crop box dimensions — capped so it always fits on screen
  const screenW = window.innerWidth
  const availH = window.innerHeight - 180 // header + ratio picker
  const rawCropH = Math.round(screenW * ratio.h / ratio.w)
  const cropH = Math.min(rawCropH, availH)
  const cropW = Math.round(cropH * ratio.w / ratio.h)

  // Scale at which image exactly covers the crop box (cover)
  const fitScale = natSize.w > 0
    ? Math.max(cropW / natSize.w, cropH / natSize.h)
    : 1

  // Current display dimensions
  const displayW = natSize.w * fitScale * scale
  const displayH = natSize.h * fitScale * scale

  // Clamp offset so no black bars appear inside the crop box
  const clamp = (ox: number, oy: number, sc: number) => {
    const dw = natSize.w * fitScale * sc
    const dh = natSize.h * fitScale * sc
    const maxX = Math.max(0, (dw - cropW) / 2)
    const maxY = Math.max(0, (dh - cropH) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }

  const onImgLoad = () => {
    const img = imgRef.current!
    setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  // Reset position when ratio changes
  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [ratioIdx])

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    lastTouchesRef.current = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))
    baseOffsetRef.current = offset
    baseScaleRef.current = scale
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      basePinchRef.current = Math.sqrt(dx * dx + dy * dy)
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchesRef.current[0].x
      const dy = e.touches[0].clientY - lastTouchesRef.current[0].y
      setOffset(clamp(baseOffsetRef.current.x + dx, baseOffsetRef.current.y + dy, baseScaleRef.current))
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const newScale = Math.max(1, Math.min(6, baseScaleRef.current * (dist / basePinchRef.current)))
      setScale(newScale)
      setOffset(clamp(baseOffsetRef.current.x, baseOffsetRef.current.y, newScale))
    }
  }

  const confirmCrop = () => {
    if (!natSize.w || !imgRef.current) return
    const outW = 1080
    const outH = Math.round(outW * ratio.h / ratio.w)
    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d')!

    // Where is the top-left of the image in crop-box coords?
    const sc = fitScale * scale
    const imgLeft = (cropW - natSize.w * sc) / 2 + offset.x
    const imgTop  = (cropH - natSize.h * sc) / 2 + offset.y

    // Convert crop-box [0,0,cropW,cropH] to source-image coords
    const srcX = -imgLeft / sc
    const srcY = -imgTop  / sc
    const srcW = cropW / sc
    const srcH = cropH / sc

    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, outW, outH)
    onConfirm(canvas.toDataURL('image/jpeg', 0.92))
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 safe-top shrink-0">
        <button onClick={onCancel} className="text-white/55 text-sm font-medium active:text-white transition-colors">
          Cancel
        </button>
        <p className="text-white text-[13px] font-bold tracking-widest uppercase">Crop</p>
        <button onClick={confirmCrop} className="text-gold font-semibold text-sm active:opacity-70 transition-opacity">
          Done
        </button>
      </div>

      {/* Crop viewport */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div
          className="relative overflow-hidden bg-black"
          style={{ width: cropW, height: cropH, touchAction: 'none' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { lastTouchesRef.current = [] }}
        >
          {/* The image */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={onImgLoad}
            draggable={false}
            style={{
              position: 'absolute',
              width: displayW || cropW,
              height: displayH || cropH,
              left: natSize.w ? (cropW - displayW) / 2 + offset.x : 0,
              top:  natSize.h ? (cropH - displayH) / 2 + offset.y : 0,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />

          {/* Rule-of-thirds grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: [
                `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)`,
                `linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
              ].join(','),
              backgroundSize: `${cropW / 3}px ${cropH / 3}px`,
            }}
          />

          {/* Corner markers */}
          {[
            'top-0 left-0 border-t-2 border-l-2 rounded-tl',
            'top-0 right-0 border-t-2 border-r-2 rounded-tr',
            'bottom-0 left-0 border-b-2 border-l-2 rounded-bl',
            'bottom-0 right-0 border-b-2 border-r-2 rounded-br',
          ].map((cls, i) => (
            <div key={i} className={`absolute w-5 h-5 border-white pointer-events-none ${cls}`} />
          ))}
        </div>
      </div>

      {/* Aspect ratio picker */}
      <div className="shrink-0 pb-10 safe-bottom pt-5">
        <div className="flex justify-center gap-8">
          {RATIOS.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRatioIdx(i)}
              className={`flex flex-col items-center gap-2 transition-opacity ${i === ratioIdx ? 'opacity-100' : 'opacity-30'}`}
            >
              <div
                className={`border-[2px] rounded-sm transition-colors ${i === ratioIdx ? 'border-gold' : 'border-white'}`}
                style={{
                  width:  r.w >= r.h ? 28 : Math.round(28 * r.w / r.h),
                  height: r.h >= r.w ? 28 : Math.round(28 * r.h / r.w),
                }}
              />
              <span className={`text-[11px] font-bold tracking-wide ${i === ratioIdx ? 'text-gold' : 'text-white'}`}>
                {r.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-white/20 mt-4">Pinch to zoom · drag to reposition</p>
      </div>
    </div>
  )
}

// ── Main Upload Page ──────────────────────────────────────────────────────────
export default function UploadPost() {
  const { user } = useAuth()
  const [, navigate] = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rawSrc, setRawSrc] = useState<string | null>(null)        // raw image before crop
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [locationName, setLocationName] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [category, setCategory] = useState('Portrait')
  const [tags, setTags] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Pick photo from camera or library
  const pickPhoto = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
        })
        if (photo.dataUrl) setRawSrc(photo.dataUrl)
      } catch {
        // user cancelled
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRawSrc(reader.result as string)
    reader.readAsDataURL(file)
    // reset input so the same file can be repicked
    e.target.value = ''
  }

  const handleCropConfirm = async (croppedDataUrl: string) => {
    setImagePreview(croppedDataUrl)
    setRawSrc(null)
    // Convert dataUrl → File for upload
    const res = await fetch(croppedDataUrl)
    const blob = await res.blob()
    setImageFile(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
  }

  // Get current GPS location
  const getLocation = async () => {
    setGettingLocation(true)
    try {
      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true })
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        toast.success('Location captured!')
      } else {
        navigator.geolocation.getCurrentPosition(
          pos => {
            setLat(pos.coords.latitude)
            setLng(pos.coords.longitude)
            toast.success('Location captured!')
          },
          () => toast.error('Could not get location')
        )
      }
    } catch {
      toast.error('Could not get location. Please enter manually.')
    }
    setGettingLocation(false)
  }

  const handleUpload = async () => {
    if (!imageFile || !user) return
    if (!caption.trim()) {
      toast.error('Please add a caption')
      return
    }
    setUploading(true)

    try {
      // 1. Upload image to Supabase Storage
      const filePath = `${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, imageFile, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath)

      // 3. Parse tags
      const parsedTags = tags
        .split(/[\s,]+/)
        .filter(t => t.startsWith('#'))
        .map(t => t.toLowerCase())

      // 4. Insert post record
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption.trim(),
        location_name: locationName.trim() || null,
        lat,
        lng,
        tags: parsedTags,
        category,
      }).select().single()
      if (insertError) throw insertError

      // 5. Auto-save location to photo_spots
      if (locationName.trim() && lat && lng) {
        const locParts = locationName.trim().split(',').map(p => p.trim())
        const cityState = locParts[locParts.length - 1] ?? ''
        const cityStateParts = cityState.split(' ').filter(Boolean)
        const state = cityStateParts[cityStateParts.length - 1] ?? ''
        const city = cityStateParts.slice(0, -1).join(' ') || (locParts[0] ?? '')

        const { data: existing } = await supabase
          .from('photo_spots')
          .select('id, photo_count, cover_image_url')
          .ilike('name', `%${locationName.trim().split(',')[0]}%`)
          .limit(1)

        if (existing && existing.length > 0) {
          await supabase.from('photo_spots').update({
            photo_count: (existing[0].photo_count ?? 0) + 1,
            cover_image_url: existing[0].cover_image_url || publicUrl,
            updated_at: new Date().toISOString(),
          }).eq('id', existing[0].id)
        } else {
          await supabase.from('photo_spots').insert({
            name: locationName.trim().split(',')[0],
            lat, lng,
            city: city || null,
            state: state || null,
            location_name: locationName.trim(),
            category,
            cover_image_url: publicUrl,
            photo_count: 1,
            contributor_count: 1,
            ai_score: 50,
            tags: parsedTags,
          })
        }
      }

      haptics.success()
      toast.success('Photo posted!')
      navigate('/profile')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    }
    setUploading(false)
  }

  // ── Crop editor shown as fullscreen overlay ──────────────────────────────
  if (rawSrc) {
    return (
      <CropEditor
        src={rawSrc}
        onConfirm={handleCropConfirm}
        onCancel={() => setRawSrc(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-lenz-bg pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center justify-between safe-top">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <X size={20} className="text-white/60" />
        </button>
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">New Post</h2>
        <button
          onClick={handleUpload}
          disabled={!imageFile || uploading}
          className="text-gold font-semibold text-sm disabled:opacity-30"
        >
          {uploading ? 'Posting...' : 'Share'}
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Image preview / picker */}
        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden bg-lenz-card">
            <img src={imagePreview} alt="preview" className="w-full object-cover" />
            <div className="absolute top-3 right-3 flex gap-2">
              {/* Re-crop button */}
              <button
                onClick={() => setRawSrc(imagePreview)}
                className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm active:bg-black/80"
              >
                Adjust Crop
              </button>
              {/* Remove button */}
              <button
                onClick={() => { setImagePreview(null); setImageFile(null) }}
                className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center active:bg-black/80"
              >
                <X size={15} className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={pickPhoto}
            className="w-full aspect-square rounded-2xl bg-lenz-card border-2 border-dashed border-lenz-border flex flex-col items-center justify-center gap-3 hover:border-gold/40 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <Image size={26} className="text-white/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/50">Tap to add photo</p>
              <p className="text-xs text-white/20 mt-0.5">Camera or library</p>
            </div>
          </button>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* Caption */}
        <textarea
          placeholder="Write a caption..."
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={3}
          className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors resize-none"
        />

        {/* Location */}
        <div className="space-y-2">
          <LocationAutocomplete value={locationName} onChange={setLocationName} />
          <div className="flex items-start gap-1.5 px-1">
            <Info size={11} className="text-gold/50 mt-0.5 shrink-0" />
            <p className="text-[10px] text-white/30 leading-relaxed">
              Add the <span className="text-white/50">city &amp; state</span> (e.g. "Wynwood Walls, Miami FL") so others can find this spot when they search that area.
            </p>
          </div>
          <button
            onClick={getLocation}
            disabled={gettingLocation}
            className="flex items-center gap-2 text-xs text-gold/80 hover:text-gold transition-colors disabled:opacity-50"
          >
            <MapPin size={13} />
            {gettingLocation ? 'Getting location...' : lat ? `GPS: ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : 'Use current GPS location'}
          </button>
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-gold/50 appearance-none"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        {/* Tags */}
        <input
          type="text"
          placeholder="Tags: #portrait #nyc #goldenhour"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
        />
      </div>
    </div>
  )
}
