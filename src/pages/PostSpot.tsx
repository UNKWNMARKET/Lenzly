import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { MapPin, X, Camera, ChevronLeft, Loader, ImagePlus } from 'lucide-react'
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
      }
    } catch {
      if (source === CameraSource.Camera) {
        fileInputRef.current?.click()
      }
    }
  }

  useEffect(() => { openCamera(CameraSource.Camera) }, [])

  const pickPhoto = () => openCamera(CameraSource.Photos)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handlePost = async () => {
    if (!imageFile || !user) return
    if (!locationName.trim()) { toast.error('Add a location to share your spot'); return }

    setUploading(true)
    try {
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const filePath = `spots/${user.id}/${Date.now()}.${ext}`
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
      toast.error(err.message ?? 'Something went wrong. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-lenz-border/30">
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 active:bg-white/10 transition-colors">
          <ChevronLeft size={20} className="text-white/70" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold tracking-widest uppercase text-white">Your Spot</h1>
          <p className="text-[10px] text-white/30 mt-0.5">Visible to everyone · 24 hrs</p>
        </div>
        <button
          onClick={handlePost}
          disabled={!imageFile || !locationName.trim() || uploading}
          className="min-w-[64px] h-9 px-4 rounded-full bg-gold text-lenz-bg text-sm font-bold disabled:opacity-35 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          {uploading ? <Loader size={15} className="animate-spin" /> : 'Share'}
        </button>
      </header>

      <div className="flex-1 flex flex-col">
        {/* Full-width photo — takes up most of the screen */}
        <div className="relative w-full bg-black" style={{ aspectRatio: '4/5' }}>
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              {/* Gradient overlay at bottom for controls */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
              <button
                onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
              >
                <X size={15} className="text-white" />
              </button>
              <button
                onClick={pickPhoto}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold"
              >
                <ImagePlus size={13} /> Change
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-5 bg-lenz-card">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Camera size={28} className="text-white/30" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => openCamera(CameraSource.Camera)}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-gold text-lenz-bg text-sm font-bold active:scale-95 transition-transform"
                >
                  <Camera size={16} /> Camera
                </button>
                <button
                  onClick={pickPhoto}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 text-white text-sm font-semibold active:scale-95 transition-transform"
                >
                  <ImagePlus size={16} /> Library
                </button>
              </div>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* Location + Caption — compact below photo */}
        <div className="px-4 pt-4 pb-6 space-y-3">
          <LocationAutocomplete
            value={locationName}
            onChange={setLocationName}
            onSelect={(s: LocationSuggestion) => setLocationName(s.display)}
            placeholder="📍  Tag your location..."
          />

          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption… (optional)"
            maxLength={200}
            rows={2}
            className="w-full bg-lenz-card/60 border border-lenz-border/50 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40 transition-colors resize-none"
          />

          <p className="text-center text-[11px] text-white/20 tracking-wide">
            Disappears after 24 hours · Not posted to your feed
          </p>
        </div>
      </div>
    </div>
  )
}
