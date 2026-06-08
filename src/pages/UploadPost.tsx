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

// w:h = 0:0 signals free-form mode
const RATIOS = [
  { label: 'Free', w: 0,  h: 0  },
  { label: '1:1',  w: 1,  h: 1  },
  { label: '4:5',  w: 4,  h: 5  },
  { label: '16:9', w: 16, h: 9  },
]

type FreeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'move'
type Box = { x: number; y: number; w: number; h: number }

// ── Crop Editor ───────────────────────────────────────────────────────────────
function CropEditor({ src, onConfirm, onCancel }: {
  src: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}) {
  const [ratioIdx, setRatioIdx] = useState(2) // default to 4:5 to match feed
  const [natSize, setNatSize] = useState({ w: 0, h: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const ratio = RATIOS[ratioIdx]
  const isFree = ratio.w === 0

  // ── Dimensions ──────────────────────────────────────────────────────────────
  const screenW = window.innerWidth
  const availH  = window.innerHeight - 180   // leave room for header + picker

  // Preset: crop box = fixed aspect ratio, capped to available height
  const presetH = isFree ? availH : Math.min(Math.round(screenW * ratio.h / ratio.w), availH)
  const presetW = isFree ? screenW : Math.round(presetH * ratio.w / ratio.h)

  // Container is always full-width × availH; preset box is centered within it
  const containerW = screenW
  const containerH = availH

  // ── Preset mode state ────────────────────────────────────────────────────────
  const [scale,  setScale]  = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Scale that makes image cover the preset crop box
  const fitScale = natSize.w > 0
    ? Math.max(presetW / natSize.w, presetH / natSize.h)
    : 1
  const displayW = natSize.w * fitScale * scale
  const displayH = natSize.h * fitScale * scale

  const clampPreset = (ox: number, oy: number, sc: number) => {
    const dw = natSize.w * fitScale * sc
    const dh = natSize.h * fitScale * sc
    const maxX = Math.max(0, (dw - presetW) / 2)
    const maxY = Math.max(0, (dh - presetH) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }

  // Preset touch refs
  const lastTouchRef  = useRef<{ x: number; y: number }[]>([])
  const baseOffsetRef = useRef({ x: 0, y: 0 })
  const baseScaleRef  = useRef(1)
  const basePinchRef  = useRef(0)

  // ── Free-form mode state ─────────────────────────────────────────────────────
  const [freeBox, setFreeBox] = useState<Box>({ x: 0, y: 0, w: 100, h: 100 })

  // Scale that fits the entire image inside the container (contain)
  const freeFitScale = natSize.w > 0
    ? Math.min(containerW / natSize.w, containerH / natSize.h)
    : 1
  const freeImgW = natSize.w * freeFitScale
  const freeImgH = natSize.h * freeFitScale
  const freeImgX = (containerW - freeImgW) / 2
  const freeImgY = (containerH - freeImgH) / 2

  const clampFree = (box: Box): Box => {
    const MIN = 40
    let { x, y, w, h } = box
    x = Math.max(freeImgX, x)
    y = Math.max(freeImgY, y)
    w = Math.max(MIN, Math.min(freeImgX + freeImgW - x, w))
    h = Math.max(MIN, Math.min(freeImgY + freeImgH - y, h))
    return { x, y, w, h }
  }

  const activeHandleRef = useRef<FreeHandle | null>(null)
  const freeStartRef    = useRef({ tx: 0, ty: 0, box: { x: 0, y: 0, w: 0, h: 0 } })

  // ── Image load ───────────────────────────────────────────────────────────────
  const onImgLoad = () => {
    const img = imgRef.current!
    setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
  }

  // Reset preset state when ratio changes (also covers init)
  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [ratioIdx])

  // Init free box when entering free mode or after image loads
  useEffect(() => {
    if (!isFree || !natSize.w) return
    setFreeBox({ x: freeImgX, y: freeImgY, w: freeImgW, h: freeImgH })
  }, [isFree, natSize.w, natSize.h])

  // ── Preset touch handlers ────────────────────────────────────────────────────
  const onPresetTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    lastTouchRef.current = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))
    baseOffsetRef.current = offset
    baseScaleRef.current  = scale
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      basePinchRef.current = Math.sqrt(dx * dx + dy * dy)
    }
  }

  const onPresetTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouchRef.current[0]?.x
      const dy = e.touches[0].clientY - lastTouchRef.current[0]?.y
      setOffset(clampPreset(baseOffsetRef.current.x + dx, baseOffsetRef.current.y + dy, baseScaleRef.current))
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const newScale = Math.max(1, Math.min(6, baseScaleRef.current * (dist / basePinchRef.current)))
      setScale(newScale)
      setOffset(clampPreset(baseOffsetRef.current.x, baseOffsetRef.current.y, newScale))
    }
  }

  // ── Free touch handlers ──────────────────────────────────────────────────────
  const onFreeTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const tx = e.touches[0].clientX - rect.left
    const ty = e.touches[0].clientY - rect.top
    const { x, y, w, h } = freeBox
    const ZONE = 32

    let handle: FreeHandle | null = null
    if      (Math.abs(tx - x)     <= ZONE && Math.abs(ty - y)     <= ZONE) handle = 'nw'
    else if (Math.abs(tx - (x+w)) <= ZONE && Math.abs(ty - y)     <= ZONE) handle = 'ne'
    else if (Math.abs(tx - x)     <= ZONE && Math.abs(ty - (y+h)) <= ZONE) handle = 'sw'
    else if (Math.abs(tx - (x+w)) <= ZONE && Math.abs(ty - (y+h)) <= ZONE) handle = 'se'
    else if (tx > x && tx < x+w && ty > y && ty < y+h)                     handle = 'move'

    if (!handle) return
    activeHandleRef.current = handle
    freeStartRef.current = { tx, ty, box: { ...freeBox } }
  }

  const onFreeTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const handle = activeHandleRef.current
    if (!handle) return
    const rect = containerRef.current!.getBoundingClientRect()
    const tx = e.touches[0].clientX - rect.left
    const ty = e.touches[0].clientY - rect.top
    const dx = tx - freeStartRef.current.tx
    const dy = ty - freeStartRef.current.ty
    const s  = freeStartRef.current.box
    const MIN = 40

    let newBox = { ...s }
    if (handle === 'move') {
      newBox.x = s.x + dx
      newBox.y = s.y + dy
    } else if (handle === 'nw') {
      const nx = Math.min(s.x + dx, s.x + s.w - MIN)
      const ny = Math.min(s.y + dy, s.y + s.h - MIN)
      newBox = { x: nx, y: ny, w: s.w - (nx - s.x), h: s.h - (ny - s.y) }
    } else if (handle === 'ne') {
      const ny = Math.min(s.y + dy, s.y + s.h - MIN)
      newBox = { x: s.x, y: ny, w: Math.max(MIN, s.w + dx), h: s.h - (ny - s.y) }
    } else if (handle === 'sw') {
      const nx = Math.min(s.x + dx, s.x + s.w - MIN)
      newBox = { x: nx, y: s.y, w: s.w - (nx - s.x), h: Math.max(MIN, s.h + dy) }
    } else if (handle === 'se') {
      newBox = { x: s.x, y: s.y, w: Math.max(MIN, s.w + dx), h: Math.max(MIN, s.h + dy) }
    }

    setFreeBox(clampFree(newBox))
  }

  const onFreeTouchEnd = () => { activeHandleRef.current = null }

  // ── Export ───────────────────────────────────────────────────────────────────
  const confirmCrop = () => {
    if (!natSize.w || !imgRef.current) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const MAX = 2048   // cap longest side to keep file size practical

    let srcX: number, srcY: number, srcW: number, srcH: number

    if (isFree) {
      const sc = freeFitScale
      srcX = (freeBox.x - freeImgX) / sc
      srcY = (freeBox.y - freeImgY) / sc
      srcW = freeBox.w / sc
      srcH = freeBox.h / sc
    } else {
      // Preset: image covers crop box with pan/zoom
      const sc      = fitScale * scale
      const imgLeft = (presetW - natSize.w * sc) / 2 + offset.x
      const imgTop  = (presetH - natSize.h * sc) / 2 + offset.y
      srcX = -imgLeft / sc
      srcY = -imgTop  / sc
      srcW = presetW  / sc
      srcH = presetH  / sc
    }

    // Clamp to image bounds
    srcX = Math.max(0, srcX)
    srcY = Math.max(0, srcY)
    srcW = Math.min(natSize.w - srcX, srcW)
    srcH = Math.min(natSize.h - srcY, srcH)

    // Output at native resolution, capped at 2048px on longest side
    const downScale = Math.min(1, MAX / Math.max(srcW, srcH))
    canvas.width  = Math.round(srcW * downScale)
    canvas.height = Math.round(srcH * downScale)

    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)
    // WebP at 0.95 gives better quality than JPEG at 0.95 with smaller file size
    const webpUrl = canvas.toDataURL('image/webp', 0.95)
    // Fall back to high-quality JPEG on browsers without WebP canvas support
    onConfirm(webpUrl.startsWith('data:image/webp') ? webpUrl : canvas.toDataURL('image/jpeg', 0.97))
  }

  // ── Computed image position for current mode ─────────────────────────────────
  const imgStyle: React.CSSProperties = isFree
    ? {
        position: 'absolute',
        width: freeImgW,
        height: freeImgH,
        left: freeImgX,
        top: freeImgY,
        pointerEvents: 'none',
        userSelect: 'none',
      }
    : {
        position: 'absolute',
        width: displayW || presetW,
        height: displayH || presetH,
        left: natSize.w ? (presetW - displayW) / 2 + offset.x + (containerW - presetW) / 2 : (containerW - presetW) / 2,
        top:  natSize.h ? (presetH - displayH) / 2 + offset.y + (containerH - presetH) / 2 : (containerH - presetH) / 2,
        pointerEvents: 'none',
        userSelect: 'none',
      }

  // Preset box position within container (centered)
  const presetBoxLeft = (containerW - presetW) / 2
  const presetBoxTop  = (containerH - presetH) / 2

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 safe-top shrink-0">
        <button onClick={onCancel} className="text-white/55 text-sm font-medium active:text-white">Cancel</button>
        <p className="text-white text-[13px] font-bold tracking-widest uppercase">Crop</p>
        <button onClick={confirmCrop} className="text-gold font-semibold text-sm active:opacity-70">Done</button>
      </div>

      {/* Crop container */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ touchAction: 'none' }}
          onTouchStart={isFree ? onFreeTouchStart : onPresetTouchStart}
          onTouchMove={isFree  ? onFreeTouchMove  : onPresetTouchMove}
          onTouchEnd={isFree   ? onFreeTouchEnd   : () => { lastTouchRef.current = [] }}
        >
          {/* Image */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={onImgLoad}
            draggable={false}
            style={imgStyle}
          />

          {isFree ? (
            /* ── Free mode: dim outside + crop handles ── */
            <>
              {/* Dark overlay — boxShadow with a huge spread creates a "hole" effect */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: freeBox.x,
                  top:  freeBox.y,
                  width:  freeBox.w,
                  height: freeBox.h,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.60)',
                  border: '1px solid rgba(255,255,255,0.55)',
                  // Rule of thirds
                  backgroundImage: [
                    'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
                    'linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  ].join(','),
                  backgroundSize: `${freeBox.w / 3}px ${freeBox.h / 3}px`,
                }}
              />
              {/* Corner handles */}
              {(['nw', 'ne', 'sw', 'se'] as const).map(c => {
                const isW = c[1] === 'w'
                const isN = c[0] === 'n'
                return (
                  <div
                    key={c}
                    className="absolute"
                    style={{
                      left: isW ? freeBox.x - 1 : freeBox.x + freeBox.w - 13,
                      top:  isN ? freeBox.y - 1  : freeBox.y + freeBox.h - 13,
                      width: 14, height: 14,
                      borderTop:    isN ? '3px solid white' : undefined,
                      borderBottom: !isN ? '3px solid white' : undefined,
                      borderLeft:   isW ? '3px solid white' : undefined,
                      borderRight:  !isW ? '3px solid white' : undefined,
                      borderTopLeftRadius:     (isN && isW) ? 2 : undefined,
                      borderTopRightRadius:    (isN && !isW) ? 2 : undefined,
                      borderBottomLeftRadius:  (!isN && isW) ? 2 : undefined,
                      borderBottomRightRadius: (!isN && !isW) ? 2 : undefined,
                    }}
                  />
                )
              })}
            </>
          ) : (
            /* ── Preset mode: dim outside box + grid + corners ── */
            <>
              {/* Top dim */}
              <div className="absolute bg-black/50 pointer-events-none"
                style={{ top: 0, left: 0, right: 0, height: presetBoxTop }} />
              {/* Bottom dim */}
              <div className="absolute bg-black/50 pointer-events-none"
                style={{ bottom: 0, left: 0, right: 0, height: presetBoxTop }} />
              {/* Left dim */}
              <div className="absolute bg-black/50 pointer-events-none"
                style={{ top: presetBoxTop, left: 0, width: presetBoxLeft, height: presetH }} />
              {/* Right dim */}
              <div className="absolute bg-black/50 pointer-events-none"
                style={{ top: presetBoxTop, right: 0, width: presetBoxLeft, height: presetH }} />
              {/* Crop box border + grid */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: presetBoxLeft, top: presetBoxTop,
                  width: presetW, height: presetH,
                  border: '1px solid rgba(255,255,255,0.55)',
                  backgroundImage: [
                    'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
                    'linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  ].join(','),
                  backgroundSize: `${presetW / 3}px ${presetH / 3}px`,
                }}
              />
              {/* Corner brackets */}
              {[
                { l: presetBoxLeft - 1,          t: presetBoxTop - 1,          bT: '3px solid white', bL: '3px solid white' },
                { l: presetBoxLeft + presetW - 13, t: presetBoxTop - 1,         bT: '3px solid white', bR: '3px solid white' },
                { l: presetBoxLeft - 1,           t: presetBoxTop + presetH - 13, bB: '3px solid white', bL: '3px solid white' },
                { l: presetBoxLeft + presetW - 13, t: presetBoxTop + presetH - 13, bB: '3px solid white', bR: '3px solid white' },
              ].map((c, i) => (
                <div key={i} className="absolute pointer-events-none" style={{
                  left: c.l, top: c.t, width: 14, height: 14,
                  borderTop: (c as any).bT, borderBottom: (c as any).bB,
                  borderLeft: (c as any).bL, borderRight: (c as any).bR,
                  borderRadius: 2,
                }} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Ratio / mode picker */}
      <div className="shrink-0 pb-10 safe-bottom pt-4">
        <div className="flex justify-center gap-6">
          {RATIOS.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRatioIdx(i)}
              className={`flex flex-col items-center gap-2 transition-opacity ${i === ratioIdx ? 'opacity-100' : 'opacity-30'}`}
            >
              {r.w === 0 ? (
                /* Free icon: plain dashed rectangle */
                <div className={`border-[2px] border-dashed rounded-sm ${i === ratioIdx ? 'border-gold' : 'border-white'}`}
                  style={{ width: 24, height: 22 }} />
              ) : (
                <div
                  className={`border-[2px] rounded-sm ${i === ratioIdx ? 'border-gold' : 'border-white'}`}
                  style={{
                    width:  r.w >= r.h ? 28 : Math.round(28 * r.w / r.h),
                    height: r.h >= r.w ? 28 : Math.round(28 * r.h / r.w),
                  }}
                />
              )}
              <span className={`text-[11px] font-bold tracking-wide ${i === ratioIdx ? 'text-gold' : 'text-white'}`}>
                {r.label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-white/25 mt-3">
          {isFree ? 'Drag corners to crop · drag inside to move' : 'Pinch to zoom · drag to reposition'}
        </p>
      </div>
    </div>
  )
}

// ── Main Upload Page ──────────────────────────────────────────────────────────
export default function UploadPost() {
  const { user } = useAuth()
  const [, navigate] = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rawSrc, setRawSrc] = useState<string | null>(null)
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

  const pickPhoto = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await CapCamera.getPhoto({
          quality: 100,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
        })
        if (photo.dataUrl) setRawSrc(photo.dataUrl)
      } catch { /* user cancelled */ }
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
    e.target.value = ''
  }

  const handleCropConfirm = async (croppedDataUrl: string) => {
    setImagePreview(croppedDataUrl)
    setRawSrc(null)
    const res = await fetch(croppedDataUrl)
    const blob = await res.blob()
    const isWebP = blob.type === 'image/webp' || croppedDataUrl.startsWith('data:image/webp')
    const ext = isWebP ? 'webp' : 'jpg'
    setImageFile(new File([blob], `photo.${ext}`, { type: isWebP ? 'image/webp' : 'image/jpeg' }))
  }

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
          pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); toast.success('Location captured!') },
          () => toast.error('Could not get location')
        )
      }
    } catch { toast.error('Could not get location. Please enter manually.') }
    setGettingLocation(false)
  }

  const handleUpload = async () => {
    if (!imageFile || !user) return
    if (!caption.trim()) { toast.error('Please add a caption'); return }
    setUploading(true)
    try {
      const ext = imageFile.type === 'image/webp' ? 'webp' : 'jpg'
      const filePath = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('photos').upload(filePath, imageFile, { contentType: imageFile.type })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath)

      const parsedTags = tags.split(/[\s,]+/).filter(t => t.startsWith('#')).map(t => t.toLowerCase())

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id, image_url: publicUrl,
        caption: caption.trim(), location_name: locationName.trim() || null,
        lat, lng, tags: parsedTags, category,
      }).select().single()
      if (insertError) throw insertError

      if (locationName.trim() && lat && lng) {
        const locParts = locationName.trim().split(',').map(p => p.trim())
        const cityState = locParts[locParts.length - 1] ?? ''
        const parts = cityState.split(' ').filter(Boolean)
        const state = parts[parts.length - 1] ?? ''
        const city  = parts.slice(0, -1).join(' ') || (locParts[0] ?? '')
        const { data: existing } = await supabase.from('photo_spots')
          .select('id, photo_count, cover_image_url')
          .ilike('name', `%${locationName.trim().split(',')[0]}%`).limit(1)
        if (existing && existing.length > 0) {
          await supabase.from('photo_spots').update({
            photo_count: (existing[0].photo_count ?? 0) + 1,
            cover_image_url: existing[0].cover_image_url || publicUrl,
            updated_at: new Date().toISOString(),
          }).eq('id', existing[0].id)
        } else {
          await supabase.from('photo_spots').insert({
            name: locationName.trim().split(',')[0], lat, lng,
            city: city || null, state: state || null,
            location_name: locationName.trim(), category,
            cover_image_url: publicUrl, photo_count: 1,
            contributor_count: 1, ai_score: 50, tags: parsedTags,
          })
        }
      }

      haptics.success()
      toast.success('Photo posted!')
      navigate('/profile')
    } catch (err: any) { toast.error(err.message || 'Upload failed') }
    setUploading(false)
  }

  if (rawSrc) {
    return <CropEditor src={rawSrc} onConfirm={handleCropConfirm} onCancel={() => setRawSrc(null)} />
  }

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none">
    <div className="min-h-full bg-lenz-bg pb-8">
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center justify-between safe-top">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <X size={20} className="text-white/60" />
        </button>
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">New Post</h2>
        <button onClick={handleUpload} disabled={!imageFile || uploading}
          className="text-gold font-semibold text-sm disabled:opacity-30">
          {uploading ? 'Posting...' : 'Share'}
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/5]">
            <img src={imagePreview} alt="preview" className="w-full h-full object-cover object-center" />
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={() => setRawSrc(imagePreview)}
                className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm active:bg-black/80">
                Adjust Crop
              </button>
              <button onClick={() => { setImagePreview(null); setImageFile(null) }}
                className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center active:bg-black/80">
                <X size={15} className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={pickPhoto}
            className="w-full aspect-square rounded-2xl bg-lenz-card border-2 border-dashed border-lenz-border flex flex-col items-center justify-center gap-3 hover:border-gold/40 transition-colors">
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

        <textarea placeholder="Write a caption..." value={caption} onChange={e => setCaption(e.target.value)}
          rows={3}
          className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors resize-none" />

        <div className="space-y-2">
          <LocationAutocomplete value={locationName} onChange={setLocationName} />
          <div className="flex items-start gap-1.5 px-1">
            <Info size={11} className="text-gold/50 mt-0.5 shrink-0" />
            <p className="text-[10px] text-white/30 leading-relaxed">
              Add the <span className="text-white/50">city &amp; state</span> (e.g. "Wynwood Walls, Miami FL") so others can find this spot.
            </p>
          </div>
          <button onClick={getLocation} disabled={gettingLocation}
            className="flex items-center gap-2 text-xs text-gold/80 hover:text-gold transition-colors disabled:opacity-50">
            <MapPin size={13} />
            {gettingLocation ? 'Getting location...' : lat ? `GPS: ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : 'Use current GPS location'}
          </button>
        </div>

        <div className="relative">
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-gold/50 appearance-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        <input type="text" placeholder="Tags: #portrait #nyc #goldenhour" value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors" />
      </div>
    </div>
    </div>
  )
}
