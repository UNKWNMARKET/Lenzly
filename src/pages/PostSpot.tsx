import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'wouter'
import { X, ChevronLeft, ImagePlus, Send, Plus, RefreshCw, RotateCcw, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import LocationAutocomplete, { type LocationSuggestion } from '@/components/LocationAutocomplete'
import { uploadWithProgress } from '@/lib/uploadWithProgress'
import UploadProgressBar from '@/components/UploadProgressBar'

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

// ── Layouts ───────────────────────────────────────────────────────────────────
type Slot = { x: number; y: number; w: number; h: number }
type LayoutDef = { id: string; label: string; slots: Slot[] }

const GAP = 0.008

const LAYOUTS: LayoutDef[] = [
  { id: 'full',      label: 'Full',  slots: [{ x: 0, y: 0, w: 1, h: 1 }] },
  { id: 'side',      label: 'Side',  slots: [{ x: 0, y: 0, w: 0.5 - GAP/2, h: 1 }, { x: 0.5 + GAP/2, y: 0, w: 0.5 - GAP/2, h: 1 }] },
  { id: 'stack',     label: 'Stack', slots: [{ x: 0, y: 0, w: 1, h: 0.5 - GAP/2 }, { x: 0, y: 0.5 + GAP/2, w: 1, h: 0.5 - GAP/2 }] },
  { id: 'top-split', label: 'Top+',  slots: [{ x: 0, y: 0, w: 1, h: 0.5 - GAP/2 }, { x: 0, y: 0.5 + GAP/2, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }, { x: 0.5 + GAP/2, y: 0.5 + GAP/2, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }] },
  { id: 'bot-split', label: 'Bot+',  slots: [{ x: 0, y: 0, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }, { x: 0.5 + GAP/2, y: 0, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }, { x: 0, y: 0.5 + GAP/2, w: 1, h: 0.5 - GAP/2 }] },
  { id: 'grid',      label: 'Grid',  slots: [{ x: 0, y: 0, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }, { x: 0.5 + GAP/2, y: 0, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }, { x: 0, y: 0.5 + GAP/2, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }, { x: 0.5 + GAP/2, y: 0.5 + GAP/2, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }] },
  { id: 'left-main', label: 'Left+', slots: [{ x: 0, y: 0, w: 0.5 - GAP/2, h: 1 }, { x: 0.5 + GAP/2, y: 0, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }, { x: 0.5 + GAP/2, y: 0.5 + GAP/2, w: 0.5 - GAP/2, h: 0.5 - GAP/2 }] },
]

function LayoutIcon({ layout, size = 36 }: { layout: LayoutDef; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {layout.slots.map((s, i) => (
        <rect key={i} x={s.x * 100 + 1} y={s.y * 100 + 1} width={s.w * 100 - 2} height={s.h * 100 - 2} rx={4} fill="currentColor" opacity={0.9} />
      ))}
    </svg>
  )
}

// ── CropEditor ────────────────────────────────────────────────────────────────
// Full-screen professional crop modal.
// slotAspect = (slot.w * 1080) / (slot.h * 1920) — the pixel aspect of this slot.
// onDone returns a JPEG data URL cropped to exactly the slot's dimensions.
function CropEditor({
  src, slotAspect, outputW, outputH, onDone, onCancel,
}: {
  src: string
  slotAspect: number
  outputW: number
  outputH: number
  onDone: (dataUrl: string) => void
  onCancel: () => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 })
  const [frameSize, setFrameSize] = useState({ w: 390, h: 692 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [userScale, setUserScale] = useState(1) // 1 = pure cover, user zooms up
  const [showGrid, setShowGrid] = useState(false)
  const touchRef = useRef<{
    type: 'pan' | 'pinch'
    x0: number; y0: number
    ox: number; oy: number
    dist0: number; scale0: number
  } | null>(null)

  // Frame fills available screen area at the target aspect ratio
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth
      const availH = window.innerHeight - 130 // header + footer
      let fw = vw
      let fh = fw / slotAspect
      if (fh > availH) { fh = availH; fw = fh * slotAspect }
      setFrameSize({ w: Math.round(fw), h: Math.round(fh) })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [slotAspect])

  // Cover scale: minimum scale at which image fully covers the frame
  const coverScale = useMemo(() => {
    if (!imgSize.w || !imgSize.h) return 1
    return Math.max(frameSize.w / imgSize.w, frameSize.h / imgSize.h)
  }, [imgSize, frameSize])

  const dispScale = userScale * coverScale

  // Clamp offset: image must always fully cover the frame
  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    const maxX = Math.max(0, (imgSize.w * s - frameSize.w) / 2)
    const maxY = Math.max(0, (imgSize.h * s - frameSize.h) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }, [imgSize, frameSize])

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
    setOffset({ x: 0, y: 0 })
    setUserScale(1)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setShowGrid(true)
    if (e.touches.length === 1) {
      touchRef.current = { type: 'pan', x0: e.touches[0].clientX, y0: e.touches[0].clientY, ox: offset.x, oy: offset.y, dist0: 0, scale0: userScale }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchRef.current = { type: 'pinch', dist0: Math.hypot(dx, dy), scale0: userScale, x0: 0, y0: 0, ox: offset.x, oy: offset.y }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!touchRef.current) return
    if (touchRef.current.type === 'pan' && e.touches.length >= 1) {
      const dx = e.touches[0].clientX - touchRef.current.x0
      const dy = e.touches[0].clientY - touchRef.current.y0
      setOffset(clampOffset(touchRef.current.ox + dx, touchRef.current.oy + dy, dispScale))
    } else if (touchRef.current.type === 'pinch' && e.touches.length >= 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newUserScale = Math.min(5, Math.max(1, touchRef.current.scale0 * (Math.hypot(dx, dy) / touchRef.current.dist0)))
      const newDispScale = newUserScale * coverScale
      setUserScale(newUserScale)
      setOffset(clampOffset(touchRef.current.ox, touchRef.current.oy, newDispScale))
    }
  }

  const onTouchEnd = () => { touchRef.current = null; setShowGrid(false) }

  const handleReset = () => { setOffset({ x: 0, y: 0 }); setUserScale(1) }

  // Render the cropped region to canvas → data URL
  const handleDone = () => {
    const img = imgRef.current
    if (!img) return
    const s = dispScale
    // Image top-left in frame coords
    const imgLeft = frameSize.w / 2 - imgSize.w * s / 2 + offset.x
    const imgTop  = frameSize.h / 2 - imgSize.h * s / 2 + offset.y
    // Visible crop rect in image-natural coords
    const srcX = (0 - imgLeft) / s
    const srcY = (0 - imgTop)  / s
    const srcW = frameSize.w   / s
    const srcH = frameSize.h   / s
    const canvas = document.createElement('canvas')
    canvas.width  = outputW
    canvas.height = outputH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH)
    onDone(canvas.toDataURL('image/jpeg', 0.93))
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col select-none">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 6px)', paddingBottom: 12 }}
      >
        <button onClick={onCancel} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors">
          <X size={18} className="text-white" />
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm tracking-wide">Crop Photo</p>
          <p className="text-white/30 text-[10px] mt-0.5">Drag to reposition · Pinch to zoom</p>
        </div>
        <button
          onClick={handleDone}
          className="w-10 h-10 rounded-full bg-gold flex items-center justify-center active:scale-90 transition-transform"
        >
          <Check size={18} className="text-lenz-bg" strokeWidth={2.5} />
        </button>
      </div>

      {/* Crop frame */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="relative overflow-hidden bg-black"
          style={{ width: frameSize.w, height: frameSize.h, touchAction: 'none' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          {/* The image — centered, scaled */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={handleImgLoad}
            draggable={false}
            className="absolute pointer-events-none"
            style={{
              width: imgSize.w,
              height: imgSize.h,
              left: '50%',
              top: '50%',
              marginLeft: -imgSize.w / 2,
              marginTop: -imgSize.h / 2,
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${dispScale})`,
              transformOrigin: 'center center',
            }}
          />

          {/* Rule-of-thirds grid — fades in on touch */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-150"
            style={{ opacity: showGrid ? 1 : 0 }}
          >
            {/* Thirds lines */}
            <div className="absolute top-0 bottom-0 border-r border-white/25" style={{ left: '33.33%', width: 0 }} />
            <div className="absolute top-0 bottom-0 border-r border-white/25" style={{ left: '66.66%', width: 0 }} />
            <div className="absolute left-0 right-0 border-b border-white/25" style={{ top: '33.33%', height: 0 }} />
            <div className="absolute left-0 right-0 border-b border-white/25" style={{ top: '66.66%', height: 0 }} />
          </div>

          {/* Frame border */}
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' }} />

          {/* Corner L-brackets */}
          {([
            'top-0 left-0 border-t-2 border-l-2 rounded-tl',
            'top-0 right-0 border-t-2 border-r-2 rounded-tr',
            'bottom-0 left-0 border-b-2 border-l-2 rounded-bl',
            'bottom-0 right-0 border-b-2 border-r-2 rounded-br',
          ] as const).map(cls => (
            <div key={cls} className={`absolute w-7 h-7 border-white pointer-events-none ${cls}`} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 8px)', paddingTop: 12 }}
      >
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/15 active:bg-white/20 transition-colors"
        >
          <RotateCcw size={13} className="text-white/60" />
          <span className="text-white/60 text-xs font-semibold">Reset</span>
        </button>
      </div>
    </div>
  )
}

// ── Story item ────────────────────────────────────────────────────────────────
type StoryItem = {
  files: (File | null)[]
  previews: (string | null)[]
  croppedPreviews: (string | null)[]   // produced by CropEditor — used for display and upload
  caption: string
  locationName: string
  filterIndex: number
  layoutId: string
}

function makeItem(layoutId = 'full'): StoryItem {
  const layout = LAYOUTS.find(l => l.id === layoutId) ?? LAYOUTS[0]
  const n = layout.slots.length
  return {
    files: Array(n).fill(null),
    previews: Array(n).fill(null),
    croppedPreviews: Array(n).fill(null),
    caption: '',
    locationName: '',
    filterIndex: 0,
    layoutId,
  }
}

// Slot pixel dimensions in the 1080×1920 canvas
function slotCanvas(slot: Slot) {
  return { w: Math.round(slot.w * 1080), h: Math.round(slot.h * 1920) }
}

// Compose a story item to a single File ready to upload.
// Uses croppedPreview (if available) or raw preview per slot.
async function composeStory(item: StoryItem): Promise<File> {
  const layout = LAYOUTS.find(l => l.id === item.layoutId) ?? LAYOUTS[0]
  const filterCss = FILTERS[item.filterIndex].css
  const W = 1080, H = 1920

  // Fast path: single slot, no filter, already cropped to right aspect → reuse blob
  if (layout.slots.length === 1 && filterCss === 'none' && item.croppedPreviews[0]) {
    const res = await fetch(item.croppedPreviews[0])
    const blob = await res.blob()
    return new File([blob], 'spot.jpg', { type: 'image/jpeg' })
  }
  // Fast path: single slot, no filter, no crop → return original file
  if (layout.slots.length === 1 && filterCss === 'none' && item.files[0]) {
    return item.files[0]
  }

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < layout.slots.length; i++) {
    const src = item.croppedPreviews[i] ?? item.previews[i]
    if (!src) continue
    const slot = layout.slots[i]
    const sx = slot.x * W, sy = slot.y * H, sw = slot.w * W, sh = slot.h * H

    await new Promise<void>((res, rej) => {
      const img = new Image()
      img.onload = () => {
        ctx.save()
        ctx.beginPath()
        ctx.rect(sx, sy, sw, sh)
        ctx.clip()
        if (filterCss !== 'none') ctx.filter = filterCss

        if (item.croppedPreviews[i]) {
          // Cropped image already has the right aspect — just fill the slot
          ctx.drawImage(img, sx, sy, sw, sh)
        } else {
          // Raw image: object-cover fit
          const ia = img.naturalWidth / img.naturalHeight
          const sa = sw / sh
          let dw: number, dh: number
          if (ia > sa) { dh = sh; dw = dh * ia }
          else          { dw = sw; dh = dw / ia }
          ctx.drawImage(img, sx + (sw - dw) / 2, sy + (sh - dh) / 2, dw, dh)
        }
        ctx.restore()
        res()
      }
      img.onerror = rej
      img.crossOrigin = 'anonymous'
      img.src = src
    })
  }

  return new Promise((res, rej) => {
    canvas.toBlob(blob => {
      if (!blob) { rej(new Error('Canvas toBlob failed')); return }
      res(new File([blob], 'spot.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PostSpot() {
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const slotToFill = useRef<{ itemIdx: number; slotIdx: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [items, setItems] = useState<StoryItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [step, setStep] = useState<'photo' | 'details'>('photo')
  const [editTab, setEditTab] = useState<'filters' | 'layout' | 'none'>('none')
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraReady, setCameraReady] = useState(false)
  const [capturing, setCapturing] = useState(false)
  // Crop editor state: which slot is being cropped
  const [cropTarget, setCropTarget] = useState<{ itemIdx: number; slotIdx: number } | null>(null)

  const activeItem = items[activeIndex] ?? null

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraReady(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setCameraReady(true) }
      }
    } catch { setCameraReady(false) }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraReady(false)
  }, [])

  useEffect(() => {
    if (step === 'photo') startCamera(facingMode)
    else stopCamera()
    return () => stopCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const flipCamera = () => { const next = facingMode === 'environment' ? 'user' : 'environment'; setFacingMode(next); startCamera(next) }

  const capturePhoto = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !cameraReady) return
    setCapturing(true)
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) { setCapturing(false); return }
      fillSlotOrAddItem(new File([blob], 'spot.jpg', { type: 'image/jpeg' }), canvas.toDataURL('image/jpeg', 0.92))
      setCapturing(false)
    }, 'image/jpeg', 0.92)
  }

  const fillSlotOrAddItem = (file: File, preview: string) => {
    const target = slotToFill.current
    slotToFill.current = null
    if (target !== null) {
      setItems(prev => prev.map((it, i) => {
        if (i !== target.itemIdx) return it
        const files = [...it.files]; files[target.slotIdx] = file
        const previews = [...it.previews]; previews[target.slotIdx] = preview
        const croppedPreviews = [...it.croppedPreviews]; croppedPreviews[target.slotIdx] = null
        return { ...it, files, previews, croppedPreviews }
      }))
      // Immediately open crop editor for the newly filled slot
      setCropTarget(target)
    } else {
      setItems(prev => {
        const newItem = makeItem('full')
        newItem.files[0] = file
        newItem.previews[0] = preview
        const next = [...prev, newItem]
        setActiveIndex(next.length - 1)
        setStep('details')
        // Open crop editor for the first slot
        setTimeout(() => setCropTarget({ itemIdx: next.length - 1, slotIdx: 0 }), 50)
        return next
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const target = slotToFill.current
    slotToFill.current = null
    Promise.all(files.map(file => new Promise<{ file: File; preview: string }>(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve({ file, preview: reader.result as string })
      reader.readAsDataURL(file)
    }))).then(results => {
      if (target !== null && results.length === 1) {
        setItems(prev => prev.map((it, i) => {
          if (i !== target.itemIdx) return it
          const fs = [...it.files]; fs[target.slotIdx] = results[0].file
          const ps = [...it.previews]; ps[target.slotIdx] = results[0].preview
          const cs = [...it.croppedPreviews]; cs[target.slotIdx] = null
          return { ...it, files: fs, previews: ps, croppedPreviews: cs }
        }))
        setCropTarget(target)
      } else {
        setItems(prev => {
          const newItems = results.map(r => {
            const it = makeItem('full')
            it.files[0] = r.file
            it.previews[0] = r.preview
            return it
          })
          const next = [...prev, ...newItems]
          setActiveIndex(next.length - 1)
          setStep('details')
          setTimeout(() => setCropTarget({ itemIdx: next.length - 1, slotIdx: 0 }), 50)
          return next
        })
      }
    })
    e.target.value = ''
  }

  const updateActive = (patch: Partial<StoryItem>) =>
    setItems(prev => prev.map((it, i) => i === activeIndex ? { ...it, ...patch } : it))

  const changeLayout = (layoutId: string) => {
    const layout = LAYOUTS.find(l => l.id === layoutId)!
    const cur = items[activeIndex]
    if (!cur) return
    updateActive({
      layoutId,
      files: Array(layout.slots.length).fill(null).map((_, i) => cur.files[i] ?? null),
      previews: Array(layout.slots.length).fill(null).map((_, i) => cur.previews[i] ?? null),
      croppedPreviews: Array(layout.slots.length).fill(null),
    })
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
    if (untagged !== -1) { setActiveIndex(untagged); toast.error('Tag a location for every spot'); return }

    setUploading(true); setUploadProgress(0)
    let failed = 0
    for (const item of items) {
      try {
        const fileToUpload = await composeStory(item)
        const filePath = `${user.id}/spot_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
        const publicUrl = await uploadWithProgress(BUCKET, filePath, fileToUpload, pct =>
          setUploadProgress(Math.round((items.indexOf(item) + pct / 100) / items.length * 100))
        )
        const { error: insertError } = await supabase.from('spot_stories').insert({
          user_id: user.id,
          image_url: publicUrl,
          caption: item.caption.trim() || null,
          location_name: item.locationName.trim(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          display_seconds: 10,
        })
        if (insertError) throw insertError
      } catch { failed++ }
    }
    setUploading(false)
    if (failed === 0) { toast.success(items.length > 1 ? `${items.length} spots shared!` : 'Spot shared!'); navigate('/') }
    else toast.error(`${failed} of ${items.length} spots failed to upload`)
  }

  // ── Crop editor open/close ────────────────────────────────────────────────
  const cropItem = cropTarget ? items[cropTarget.itemIdx] : null
  const cropSlotDef = cropTarget && cropItem
    ? (LAYOUTS.find(l => l.id === cropItem.layoutId) ?? LAYOUTS[0]).slots[cropTarget.slotIdx]
    : null

  const handleCropDone = (dataUrl: string) => {
    if (!cropTarget) return
    setItems(prev => prev.map((it, i) => {
      if (i !== cropTarget.itemIdx) return it
      const croppedPreviews = [...it.croppedPreviews]
      croppedPreviews[cropTarget.slotIdx] = dataUrl
      return { ...it, croppedPreviews }
    }))
    setCropTarget(null)
  }

  // ── Step 1: Camera viewfinder ────────────────────────────────────────────
  if (step === 'photo' || items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
        <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 10px)' }}>
          <button onClick={() => navigate('/')}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
            <X size={19} className="text-white" />
          </button>
          <button onClick={flipCamera}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
            <RefreshCw size={18} className="text-white" />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-8"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 34px) + 24px)' }}>
          <button onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform">
            <ImagePlus size={20} className="text-white/80" />
            <span className="text-[9px] text-white/50 font-semibold tracking-wide">Library</span>
          </button>
          <button onClick={capturePhoto} disabled={capturing}
            className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '3px solid rgba(255,255,255,0.8)' }}>
            <div className={`rounded-full bg-white transition-all ${capturing ? 'w-10 h-10' : 'w-[60px] h-[60px]'}`} />
          </button>
          <div className="w-14 h-14" />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  const activeLayout = LAYOUTS.find(l => l.id === activeItem.layoutId) ?? LAYOUTS[0]
  const activeFilter = FILTERS[activeItem.filterIndex]

  // ── Step 2: Editor ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black">
      <UploadProgressBar progress={uploadProgress} visible={uploading} label="Uploading story" />

      {/* CropEditor modal */}
      {cropTarget && cropItem && cropSlotDef && (cropItem.previews[cropTarget.slotIdx]) && (
        <CropEditor
          src={cropItem.previews[cropTarget.slotIdx]!}
          slotAspect={(cropSlotDef.w * 1080) / (cropSlotDef.h * 1920)}
          outputW={slotCanvas(cropSlotDef).w}
          outputH={slotCanvas(cropSlotDef).h}
          onDone={handleCropDone}
          onCancel={() => setCropTarget(null)}
        />
      )}

      {/* Full-screen photo preview */}
      <div className="absolute inset-0">
        {activeLayout.slots.map((slot, i) => {
          const display = activeItem.croppedPreviews[i] ?? activeItem.previews[i]
          const isCropped = !!activeItem.croppedPreviews[i]

          return (
            <div key={i} className="absolute overflow-hidden"
              style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `${slot.w * 100}%`, height: `${slot.h * 100}%` }}>
              {display ? (
                <button
                  className="w-full h-full relative group active:brightness-90 transition-all"
                  onClick={() => setCropTarget({ itemIdx: activeIndex, slotIdx: i })}
                >
                  <img
                    src={display}
                    alt=""
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                    style={{ filter: activeFilter.css === 'none' ? undefined : activeFilter.css }}
                  />
                  {/* Crop hint badge */}
                  <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-active:opacity-100 transition-opacity">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/>
                    </svg>
                  </div>
                  {isCropped && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold/80 flex items-center justify-center">
                      <Check size={11} className="text-lenz-bg" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ) : (
                <button
                  className="w-full h-full bg-white/8 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 active:bg-white/12 transition-colors"
                  onClick={() => {
                    slotToFill.current = { itemIdx: activeIndex, slotIdx: i }
                    fileInputRef.current?.click()
                  }}
                >
                  <Plus size={28} className="text-white/40" />
                  <span className="text-[11px] text-white/30 font-semibold">Add photo</span>
                </button>
              )}
            </div>
          )
        })}

        {/* Gradients */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 z-20 px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 8px)' }}>
        <button onClick={() => { setItems([]); setStep('photo') }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
          <ChevronLeft size={20} className="text-white" />
        </button>
      </div>

      {/* Multi-story dots */}
      {items.length > 1 && (
        <div className="absolute inset-x-0 z-20 flex items-center justify-center gap-1.5"
          style={{ top: 'calc(env(safe-area-inset-top, 44px) + 20px)' }}>
          {items.map((it, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}
              className={`rounded-full transition-all ${i === activeIndex ? 'w-4 h-2 bg-gold' : 'w-2 h-2 ' + (!it.locationName ? 'bg-rose-400/80' : 'bg-white/40')}`} />
          ))}
        </div>
      )}

      {/* Edit button */}
      <button
        onClick={() => setEditTab(t => t === 'none' ? 'filters' : 'none')}
        className={`absolute right-4 z-20 w-12 h-12 rounded-full backdrop-blur-md border flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all ${
          editTab !== 'none' ? 'bg-gold/90 border-gold text-lenz-bg' : 'bg-black/40 border-white/15 text-white/70'
        }`}
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <div className="w-4 h-4 rounded-sm overflow-hidden flex-shrink-0">
          {activeItem.croppedPreviews[0] ?? activeItem.previews[0]
            ? <img src={(activeItem.croppedPreviews[0] ?? activeItem.previews[0])!} className="w-full h-full object-cover"
                style={{ filter: activeFilter.css === 'none' ? undefined : activeFilter.css }} />
            : <div className="w-full h-full bg-white/20" />}
        </div>
        <span className="text-[8px] font-bold tracking-wide leading-none">Edit</span>
      </button>

      {/* Edit bottom sheet */}
      {editTab !== 'none' && (
        <div className="absolute inset-x-0 z-20 bg-black/70 backdrop-blur-xl border-t border-white/10 rounded-t-2xl"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 34px) + 148px)' }}>
          <div className="flex border-b border-white/10">
            {(['filters', 'layout'] as const).map(tab => (
              <button key={tab} onClick={() => setEditTab(tab)}
                className={`flex-1 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${
                  editTab === tab ? 'text-gold border-b-2 border-gold' : 'text-white/40'
                }`}>
                {tab === 'filters' ? 'Filters' : 'Layout'}
              </button>
            ))}
          </div>
          <div className="flex gap-3 px-4 py-3 overflow-x-auto no-scrollbar">
            {editTab === 'filters' && FILTERS.map((f, i) => (
              <button key={f.name} onClick={() => updateActive({ filterIndex: i })}
                className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform">
                <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  activeItem.filterIndex === i ? 'border-gold scale-105 shadow-[0_0_10px_rgba(201,168,76,0.5)]' : 'border-white/20'
                }`}>
                  {activeItem.croppedPreviews[0] ?? activeItem.previews[0]
                    ? <img src={(activeItem.croppedPreviews[0] ?? activeItem.previews[0])!} className="w-full h-full object-cover"
                        style={{ filter: f.css === 'none' ? undefined : f.css }} />
                    : <div className="w-full h-full bg-white/10" />}
                </div>
                <span className={`text-[9px] font-semibold tracking-wide ${activeItem.filterIndex === i ? 'text-gold' : 'text-white/60'}`}>{f.name}</span>
              </button>
            ))}
            {editTab === 'layout' && LAYOUTS.map(layout => {
              const firstPreview = activeItem.croppedPreviews[0] ?? activeItem.previews[0]
              const isActive = activeItem.layoutId === layout.id
              return (
                <button key={layout.id} onClick={() => changeLayout(layout.id)}
                  className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform">
                  <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 relative transition-all ${
                    isActive ? 'border-gold scale-105 shadow-[0_0_10px_rgba(201,168,76,0.5)]' : 'border-white/20'
                  }`}>
                    {layout.slots.map((slot, si) => (
                      <div key={si} className="absolute overflow-hidden"
                        style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `calc(${slot.w * 100}% - 1px)`, height: `calc(${slot.h * 100}% - 1px)`, background: firstPreview ? undefined : 'rgba(255,255,255,0.08)' }}>
                        {firstPreview && <img src={firstPreview} className="w-full h-full object-cover"
                          style={{ filter: FILTERS[activeItem.filterIndex].css === 'none' ? undefined : FILTERS[activeItem.filterIndex].css }} />}
                      </div>
                    ))}
                    {isActive && <div className="absolute inset-0 bg-gold/25 pointer-events-none" />}
                  </div>
                  <span className={`text-[9px] font-semibold tracking-wide ${isActive ? 'text-gold' : 'text-white/60'}`}>{layout.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom: location + share */}
      <div className="absolute inset-x-0 z-20 flex flex-col gap-2.5 px-4"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 34px) + 16px)' }}>
        <div className="bg-black/40 backdrop-blur-md border border-white/12 rounded-full overflow-visible">
          <LocationAutocomplete
            value={activeItem.locationName}
            onChange={v => updateActive({ locationName: v })}
            onSelect={(s: LocationSuggestion) => updateActive({ locationName: s.display })}
            placeholder="Tag location…"
            dropUp
            pill
          />
        </div>
        <button onClick={handlePost} disabled={uploading}
          className="w-full py-3.5 rounded-full bg-gold text-lenz-bg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all shadow-[0_4px_20px_rgba(201,168,76,0.4)]">
          {uploading
            ? <span className="animate-pulse">Sharing…</span>
            : <><Send size={16} /> {items.length > 1 ? `Share ${items.length} Spots` : 'Share Spot'}</>}
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
    </div>
  )
}
