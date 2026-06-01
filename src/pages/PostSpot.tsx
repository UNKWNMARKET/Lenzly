import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { MapPin, X, Camera, ChevronLeft, Loader, ImagePlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import LocationAutocomplete, { type LocationSuggestion } from '@/components/LocationAutocomplete'

const BUCKET = 'spot-stories'

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
        quality: 85,
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

  // Auto-open camera when page loads
  useEffect(() => {
    openCamera(CameraSource.Camera)
  }, [])

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
    if (!locationName.trim()) { toast.error('Please tag a location'); return }

    setUploading(true)
    try {
      // Upload image
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const filePath = `spots/${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, imageFile, { contentType: imageFile.type })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

      // Insert spot story (expires in 24h)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { error: insertError } = await supabase.from('spot_stories').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption.trim() || null,
        location_name: locationName.trim(),
        expires_at: expiresAt,
      })
      if (insertError) throw insertError

      toast.success('Spot posted! Visible for 24 hours.')
      navigate('/')
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-lenz-bg flex flex-col safe-top safe-bottom">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-lenz-border/40">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ChevronLeft size={22} className="text-white/70" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-bold tracking-widest uppercase text-white">Post a Spot</h1>
          <p className="text-[10px] text-white/30 tracking-wide">Visible to everyone · 24 hours</p>
        </div>
        <button
          onClick={handlePost}
          disabled={!imageFile || !locationName.trim() || uploading}
          className="px-4 py-2 rounded-xl bg-gold text-lenz-bg text-sm font-bold disabled:opacity-40 transition-opacity"
        >
          {uploading ? <Loader size={16} className="animate-spin" /> : 'Post'}
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-4 p-4">
        {/* Photo picker */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-lenz-card border border-lenz-border flex items-center justify-center">
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X size={16} className="text-white" />
              </button>
              <button
                onClick={pickPhoto}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 text-white text-xs font-medium"
              >
                <ImagePlus size={13} /> Change
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/30">
              <Camera size={40} />
              <p className="text-sm text-white/40">No photo selected</p>
              <div className="flex gap-3">
                <button
                  onClick={() => openCamera(CameraSource.Camera)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold text-lenz-bg text-sm font-semibold"
                >
                  <Camera size={15} /> Camera
                </button>
                <button
                  onClick={pickPhoto}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold"
                >
                  <ImagePlus size={15} /> Library
                </button>
              </div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* Location — required */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gold" />
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Location <span className="text-gold">*</span></p>
          </div>
          <LocationAutocomplete
            value={locationName}
            onChange={setLocationName}
            onSelect={(s: LocationSuggestion) => setLocationName(s.display)}
            placeholder="Tag your location..."
          />
        </div>

        {/* Caption — optional */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider pl-0.5">Caption (optional)</p>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="What's the vibe here?"
            maxLength={200}
            rows={3}
            className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors resize-none"
          />
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 bg-gold/5 border border-gold/15 rounded-xl px-4 py-3">
          <MapPin size={14} className="text-gold/60 mt-0.5 shrink-0" />
          <p className="text-xs text-white/40 leading-relaxed">
            Spot stories are visible to all LENZLY users for <span className="text-white/60">24 hours</span>. They appear in the stories bar and on the map. They don't post to your profile feed.
          </p>
        </div>
      </div>
    </div>
  )
}
