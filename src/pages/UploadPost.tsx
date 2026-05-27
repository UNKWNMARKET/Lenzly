import { useState, useRef } from 'react'
import { useLocation } from 'wouter'
import { Camera, MapPin, X, Image, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'

const CATEGORIES = ['Portrait', 'Landscape', 'Street', 'Wedding', 'Concert', 'Commercial', 'Travel', 'Nature', 'Fashion', 'Other']

export default function UploadPost() {
  const { user } = useAuth()
  const [, navigate] = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        if (photo.dataUrl) {
          setImagePreview(photo.dataUrl)
          // Convert dataUrl to File
          const res = await fetch(photo.dataUrl)
          const blob = await res.blob()
          setImageFile(new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
        }
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
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Get current GPS location
  const getLocation = async () => {
    setGettingLocation(true)
    try {
      if (Capacitor.isNativePlatform()) {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true })
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
      } else {
        // Browser geolocation fallback
        navigator.geolocation.getCurrentPosition(
          pos => {
            setLat(pos.coords.latitude)
            setLng(pos.coords.longitude)
            toast.success('Location captured!')
          },
          () => toast.error('Could not get location')
        )
      }
      toast.success('Location captured!')
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
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const filePath = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, imageFile, { contentType: imageFile.type })

      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

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
      })

      if (insertError) throw insertError

      toast.success('Photo posted!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    }
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-lenz-bg pb-24 safe-top">
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
        {/* Image picker */}
        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden aspect-square bg-lenz-card">
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
            <button
              onClick={() => { setImagePreview(null); setImageFile(null) }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
            >
              <X size={15} className="text-white" />
            </button>
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
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Location name (e.g. Brooklyn Bridge, NYC)"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              className="w-full bg-lenz-card border border-lenz-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
            />
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
