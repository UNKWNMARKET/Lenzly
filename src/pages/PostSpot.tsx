import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { MapPin, X, Camera, ChevronLeft, ImagePlus, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import LocationAutocomplete, { type LocationSuggestion } from '@/components/LocationAutocomplete'

const BUCKET = 'photos'

export default function PostSpot() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [locationName, setLocationName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'photo' | 'details'>('photo')

  const openCamera = async (source: CameraSource) => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      })
      if (photo.dataUrl) {
        setImagePreview(photo.dataUrl)
        const res = await fetch(photo.dataUrl)
        const blob = await res.blob()
        setImageFile(new File([blob], 'spot.jpg', { type: 'image/jpeg' }))
        setStep('details')
      }
    } catch {
      if (source === CameraSource.Camera) fileInputRef.current?.click()
    }
  }

  useEffect(() => { openCamera(CameraSource.Camera) }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
      setStep('details')
    }
    reader.readAsDataURL(file)
  }

  const handlePost = async () => {
    if (!imageFile || !user) return
    if (!locationName.trim()) { toast.error('Tag a location to share your spot'); return }

    setUploading(true)
    try {
      const ext = imageFile.name.split('.').pop() || 'jpg'
      // Path structured as user_id/filename so storage policies match
      const filePath = `${user.id}/spot_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, imageFile, { contentType: imageFile.type })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { error: insertError } = await supabase.from('spot_stories').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption.trim() || null,
        location_name: locationName.trim(),
        expires_at: expiresAt,
      })
      if (insertError) throw insertError

      toast.success('Spot shared!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.message ?? 'Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  // ── Step 1: No photo yet — full screen picker ────────────────────────────
  if (step === 'photo' || !imagePreview) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col safe-top safe-bottom">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
        >
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
            <button
              onClick={() => openCamera(CameraSource.Camera)}
              className="w-full py-4 rounded-2xl bg-gold text-lenz-bg font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Camera size={18} /> Open Camera
            </button>
            <button
              onClick={() => openCamera(CameraSource.Photos)}
              className="w-full py-4 rounded-2xl bg-white/10 text-white font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ImagePlus size={18} /> Choose from Library
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  // ── Step 2: Photo selected — full screen preview + bottom sheet ──────────
  return (
    <div className="fixed inset-0 bg-black flex flex-col safe-top safe-bottom">
      {/* Full screen photo */}
      <div className="absolute inset-0">
        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
        {/* Dark gradient at top and bottom */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3">
        <button
          onClick={() => { setImageFile(null); setImagePreview(null); setStep('photo') }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        <span className="text-white text-sm font-bold tracking-widest uppercase opacity-80">Your Spot</span>
        <button
          onClick={() => openCamera(CameraSource.Photos)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <ImagePlus size={18} className="text-white" />
        </button>
      </div>

      {/* Bottom sheet — inputs over the photo */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-8 space-y-3">
        {/* Location */}
        <div className="[&_input]:bg-transparent [&_input]:border-0 [&_input]:backdrop-blur-none bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <LocationAutocomplete
            value={locationName}
            onChange={setLocationName}
            onSelect={(s: LocationSuggestion) => setLocationName(s.display)}
            placeholder="Tag your location…"
            dropUp
          />
        </div>

        {/* Caption */}
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3">
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption… (optional)"
            maxLength={200}
            className="w-full bg-transparent text-white text-sm placeholder-white/30 outline-none"
          />
        </div>

        {/* Share button */}
        <button
          onClick={handlePost}
          disabled={!locationName.trim() || uploading}
          className="w-full py-4 rounded-2xl bg-gold text-lenz-bg font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
        >
          {uploading
            ? <span className="animate-pulse">Sharing…</span>
            : <><Send size={17} /> Share Spot</>}
        </button>

        <p className="text-center text-[11px] text-white/25 tracking-wide">
          Visible to everyone for 24 hours · Not on your profile
        </p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
