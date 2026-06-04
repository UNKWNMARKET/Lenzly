import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'wouter'
import { X, ChevronLeft, ImagePlus, Send, Plus, RefreshCw } from 'lucide-react'
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

// ── Layouts ───────────────────────────────────────────────────────────────────
type Slot = { x: number; y: number; w: number; h: number } // 0-1 normalised
type LayoutDef = { id: string; label: string; slots: Slot[] }

const GAP = 0.008 // gap between slots as fraction of total

const LAYOUTS: LayoutDef[] = [
  {
    id: 'full',
    label: 'Full',
    slots: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  {
    id: 'side',
    label: 'Side',
    slots: [
      { x: 0,           y: 0, w: 0.5 - GAP / 2, h: 1 },
      { x: 0.5 + GAP / 2, y: 0, w: 0.5 - GAP / 2, h: 1 },
    ],
  },
  {
    id: 'stack',
    label: 'Stack',
    slots: [
      { x: 0, y: 0,             w: 1, h: 0.5 - GAP / 2 },
      { x: 0, y: 0.5 + GAP / 2, w: 1, h: 0.5 - GAP / 2 },
    ],
  },
  {
    id: 'top-split',
    label: 'Top+',
    slots: [
      { x: 0,             y: 0,             w: 1,             h: 0.5 - GAP / 2 },
      { x: 0,             y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
    ],
  },
  {
    id: 'bot-split',
    label: 'Bot+',
    slots: [
      { x: 0,             y: 0,             w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0,             w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0,             y: 0.5 + GAP / 2, w: 1,             h: 0.5 - GAP / 2 },
    ],
  },
  {
    id: 'grid',
    label: 'Grid',
    slots: [
      { x: 0,             y: 0,             w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0,             w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0,             y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
    ],
  },
  {
    id: 'left-main',
    label: 'Left+',
    slots: [
      { x: 0,             y: 0,             w: 0.5 - GAP / 2, h: 1 },
      { x: 0.5 + GAP / 2, y: 0,             w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
      { x: 0.5 + GAP / 2, y: 0.5 + GAP / 2, w: 0.5 - GAP / 2, h: 0.5 - GAP / 2 },
    ],
  },
]

// SVG icons for each layout (mini preview)
function LayoutIcon({ layout, size = 36 }: { layout: LayoutDef; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {layout.slots.map((s, i) => (
        <rect
          key={i}
          x={s.x * 100 + 1}
          y={s.y * 100 + 1}
          width={s.w * 100 - 2}
          height={s.h * 100 - 2}
          rx={4}
          fill="currentColor"
          opacity={0.9}
        />
      ))}
    </svg>
  )
}

type StoryItem = {
  files: (File | null)[]      // one per slot; null = empty
  previews: (string | null)[] // one per slot
  caption: string
  locationName: string
  filterIndex: number
  layoutId: string
}

function makeItem(layoutId = 'full'): StoryItem {
  const layout = LAYOUTS.find(l => l.id === layoutId) ?? LAYOUTS[0]
  return {
    files: Array(layout.slots.length).fill(null),
    previews: Array(layout.slots.length).fill(null),
    caption: '',
    locationName: '',
    filterIndex: 0,
    layoutId,
  }
}

// Draw a single image into a canvas slot with object-cover behaviour
function drawSlot(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number, sy: number, sw: number, sh: number,
  filterCss: string
) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(sx, sy, sw, sh)
  ctx.clip()
  if (filterCss !== 'none') ctx.filter = filterCss
  const ia = img.naturalWidth / img.naturalHeight
  const sa = sw / sh
  let dw, dh, dx, dy
  if (ia > sa) { dh = sh; dw = sh * ia; dx = sx + (sw - dw) / 2; dy = sy }
  else          { dw = sw; dh = sw / ia; dx = sx; dy = sy + (sh - dh) / 2 }
  ctx.drawImage(img, dx, dy, dw, dh)
  ctx.restore()
}

async function composeStory(item: StoryItem): Promise<File> {
  const layout = LAYOUTS.find(l => l.id === item.layoutId) ?? LAYOUTS[0]
  const filterCss = FILTERS[item.filterIndex].css

  // Single slot, no filter → return original file as-is
  if (layout.slots.length === 1 && filterCss === 'none' && item.files[0]) {
    return item.files[0]
  }

  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)

  for (let i = 0; i < layout.slots.length; i++) {
    const preview = item.previews[i]
    if (!preview) continue
    const slot = layout.slots[i]
    await new Promise<void>((res, rej) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        drawSlot(ctx, img,
          slot.x * W, slot.y * H, slot.w * W, slot.h * H,
          filterCss)
        res()
      }
      img.onerror = rej
      img.src = preview
    })
  }

  return new Promise((res, rej) => {
    canvas.toBlob(blob => {
      if (!blob) { rej(new Error('Canvas toBlob failed')); return }
      res(new File([blob], 'spot.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}

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
  const [storyDuration, setStoryDuration] = useState(10)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'photo' | 'details'>('photo')
  const [editTab, setEditTab] = useState<'filters' | 'layout'>('filters')
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraReady, setCameraReady] = useState(false)
  const [capturing, setCapturing] = useState(false)

  const activeItem = items[activeIndex] ?? null

  // ── In-app camera ────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'environment' | 'user') => {
    // Stop any existing stream
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
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
        }
      }
    } catch {
      // getUserMedia not available — fall back to file picker
      setCameraReady(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraReady(false)
  }, [])

  useEffect(() => {
    if (step === 'photo') {
      startCamera(facingMode)
    } else {
      stopCamera()
    }
    return () => stopCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  const capturePhoto = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !cameraReady) return
    setCapturing(true)

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob) { setCapturing(false); return }
      const file = new File([blob], 'spot.jpg', { type: 'image/jpeg' })
      const preview = canvas.toDataURL('image/jpeg', 0.92)
      fillSlotOrAddItem(file, preview)
      setCapturing(false)
    }, 'image/jpeg', 0.92)
  }

  const fillSlotOrAddItem = (file: File, preview: string) => {
    const target = slotToFill.current
    slotToFill.current = null

    if (target !== null) {
      // Fill a specific existing slot
      setItems(prev => prev.map((it, i) => {
        if (i !== target.itemIdx) return it
        const files = [...it.files]; files[target.slotIdx] = file
        const previews = [...it.previews]; previews[target.slotIdx] = preview
        return { ...it, files, previews }
      }))
    } else {
      // Add a brand-new story item
      setItems(prev => {
        const newItem: StoryItem = makeItem('full')
        newItem.files[0] = file
        newItem.previews[0] = preview
        const next = [...prev, newItem]
        setActiveIndex(next.length - 1)
        setStep('details')
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
        // Fill specific slot
        setItems(prev => prev.map((it, i) => {
          if (i !== target.itemIdx) return it
          const fs = [...it.files]; fs[target.slotIdx] = results[0].file
          const ps = [...it.previews]; ps[target.slotIdx] = results[0].preview
          return { ...it, files: fs, previews: ps }
        }))
      } else {
        // Add new story items
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
          return next
        })
      }
    })
    e.target.value = ''
  }

  const updateActive = (patch: Partial<StoryItem>) => {
    setItems(prev => prev.map((it, i) => i === activeIndex ? { ...it, ...patch } : it))
  }

  const changeLayout = (layoutId: string) => {
    const layout = LAYOUTS.find(l => l.id === layoutId)!
    const cur = items[activeIndex]
    if (!cur) return
    // Preserve existing slot data, expand/trim to new slot count
    const files = Array(layout.slots.length).fill(null).map((_, i) => cur.files[i] ?? null)
    const previews = Array(layout.slots.length).fill(null).map((_, i) => cur.previews[i] ?? null)
    updateActive({ layoutId, files, previews })
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
        const fileToUpload = await composeStory(item)
        const filePath = `${user.id}/spot_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
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

  // ── Step 1: Full-screen camera viewfinder ───────────────────────────────
  if (step === 'photo' || items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        {/* Live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />

        {/* Top bar */}
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

        {/* Bottom controls */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-8"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 34px) + 24px)' }}>
          {/* Library */}
          <button onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform">
            <ImagePlus size={20} className="text-white/80" />
            <span className="text-[9px] text-white/50 font-semibold tracking-wide">Library</span>
          </button>

          {/* Shutter */}
          <button
            onClick={capturePhoto}
            disabled={capturing}
            className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '3px solid rgba(255,255,255,0.8)' }}
          >
            <div className={`rounded-full bg-white transition-all ${capturing ? 'w-10 h-10' : 'w-[60px] h-[60px]'}`} />
          </button>

          {/* Spacer */}
          <div className="w-14 h-14" />
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  const activeLayout = LAYOUTS.find(l => l.id === activeItem.layoutId) ?? LAYOUTS[0]
  const activeFilter = FILTERS[activeItem.filterIndex]

  // ── Step 2: Photos selected ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black">

      {/* ── Full-screen photo ───────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {activeLayout.slots.map((slot, i) => {
          const preview = activeItem.previews[i]
          return (
            <div
              key={i}
              className="absolute overflow-hidden"
              style={{
                left: `${slot.x * 100}%`,
                top: `${slot.y * 100}%`,
                width: `${slot.w * 100}%`,
                height: `${slot.h * 100}%`,
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: activeFilter.css === 'none' ? undefined : activeFilter.css }}
                />
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
        {/* Subtle top gradient for back button */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        {/* Subtle bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 44px) + 8px)' }}>
        <button onClick={() => { setItems([]); setStep('photo') }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <span className="text-white text-sm font-bold tracking-widest uppercase"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {items.length > 1 ? `Spot ${activeIndex + 1} of ${items.length}` : 'Your Spot'}
        </span>
        <button onClick={() => { slotToFill.current = null; fileInputRef.current?.click() }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 transition-transform">
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* ── Thumbnail strip (top, when multi) ───────────────────────────── */}
      {items.length > 1 && (
        <div className="absolute inset-x-0 z-20 flex gap-2 px-4 overflow-x-auto no-scrollbar"
          style={{ top: 'calc(env(safe-area-inset-top, 44px) + 60px)' }}>
          {items.map((it, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}
              className={`relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-gold' : 'border-white/20'}`}>
              {it.previews[0]
                ? <img src={it.previews[0]} className="w-full h-full object-cover"
                    style={{ filter: FILTERS[it.filterIndex].css === 'none' ? undefined : FILTERS[it.filterIndex].css }} />
                : <div className="w-full h-full bg-white/10" />
              }
              <button onClick={e => { e.stopPropagation(); removeItem(i) }}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center">
                <X size={9} className="text-white" />
              </button>
              {!it.locationName && <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-500/80" />}
            </button>
          ))}
          <button onClick={() => { slotToFill.current = null; fileInputRef.current?.click() }}
            className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-white/20 bg-black/30 backdrop-blur-md flex items-center justify-center">
            <Plus size={16} className="text-white/40" />
          </button>
        </div>
      )}

      {/* ── Right-side bubble buttons (Filters + Layout) ────────────────── */}
      <div className="absolute right-4 z-20 flex flex-col gap-2.5"
        style={{ top: '50%', transform: 'translateY(-50%)' }}>
        <button
          onClick={() => setEditTab(t => t === 'filters' ? 'layout' : 'filters')}
          className={`w-12 h-12 rounded-full backdrop-blur-md border flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all ${
            editTab === 'filters'
              ? 'bg-gold/90 border-gold text-lenz-bg'
              : 'bg-black/40 border-white/15 text-white/70'
          }`}
        >
          <div className="w-4 h-4 rounded-sm overflow-hidden flex-shrink-0">
            {activeItem.previews[0]
              ? <img src={activeItem.previews[0]} className="w-full h-full object-cover"
                  style={{ filter: activeFilter.css === 'none' ? undefined : activeFilter.css }} />
              : <div className="w-full h-full bg-white/20" />
            }
          </div>
          <span className="text-[8px] font-bold tracking-wide leading-none">FX</span>
        </button>

        <button
          onClick={() => setEditTab(t => t === 'layout' ? 'filters' : 'layout')}
          className={`w-12 h-12 rounded-full backdrop-blur-md border flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all ${
            editTab === 'layout'
              ? 'bg-gold/90 border-gold text-lenz-bg'
              : 'bg-black/40 border-white/15 text-white/70'
          }`}
        >
          <LayoutIcon layout={activeLayout} size={20} />
          <span className="text-[8px] font-bold tracking-wide leading-none">Grid</span>
        </button>
      </div>

      {/* ── Edit strip (floats over photo, above bottom bubbles) ─────────── */}
      {editTab === 'filters' && (
        <div className="absolute inset-x-0 z-20 flex gap-3 px-4 overflow-x-auto no-scrollbar"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 34px) + 148px)' }}>
          {FILTERS.map((f, i) => (
            <button key={f.name} onClick={() => updateActive({ filterIndex: i })}
              className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform">
              <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                activeItem.filterIndex === i ? 'border-gold scale-105 shadow-[0_0_10px_rgba(201,168,76,0.5)]' : 'border-white/20'
              }`}>
                {activeItem.previews[0]
                  ? <img src={activeItem.previews[0]} className="w-full h-full object-cover"
                      style={{ filter: f.css === 'none' ? undefined : f.css }} />
                  : <div className="w-full h-full bg-white/10" />}
              </div>
              <span className={`text-[9px] font-semibold tracking-wide ${activeItem.filterIndex === i ? 'text-gold' : 'text-white/70'}`}
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{f.name}</span>
            </button>
          ))}
        </div>
      )}

      {editTab === 'layout' && (
        <div className="absolute inset-x-0 z-20 flex gap-3 px-4 overflow-x-auto no-scrollbar"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 34px) + 148px)' }}>
          {LAYOUTS.map(layout => {
            const firstPreview = activeItem.previews[0]
            const isActive = activeItem.layoutId === layout.id
            return (
              <button key={layout.id} onClick={() => changeLayout(layout.id)}
                className="flex flex-col items-center gap-1 flex-shrink-0 active:scale-95 transition-transform">
                <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 relative transition-all ${
                  isActive ? 'border-gold scale-105 shadow-[0_0_10px_rgba(201,168,76,0.5)]' : 'border-white/20'
                }`}>
                  {layout.slots.map((slot, si) => (
                    <div key={si} className="absolute overflow-hidden"
                      style={{
                        left: `${slot.x * 100}%`, top: `${slot.y * 100}%`,
                        width: `calc(${slot.w * 100}% - 1px)`,
                        height: `calc(${slot.h * 100}% - 1px)`,
                        background: firstPreview ? undefined : 'rgba(255,255,255,0.08)',
                      }}>
                      {firstPreview && (
                        <img src={firstPreview} className="w-full h-full object-cover"
                          style={{ filter: FILTERS[activeItem.filterIndex].css === 'none' ? undefined : FILTERS[activeItem.filterIndex].css }} />
                      )}
                    </div>
                  ))}
                  {isActive && <div className="absolute inset-0 bg-gold/25 pointer-events-none" />}
                </div>
                <span className={`text-[9px] font-semibold tracking-wide ${isActive ? 'text-gold' : 'text-white/70'}`}
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{layout.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Bottom floating bubbles ──────────────────────────────────────── */}
      <div className="absolute inset-x-0 z-20 flex flex-col gap-2.5 px-4"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 34px) + 16px)' }}>

        {/* Caption pill */}
        <div className="bg-black/40 backdrop-blur-md border border-white/12 rounded-full px-4 py-2.5 flex items-center gap-2">
          <input
            value={activeItem.caption}
            onChange={e => updateActive({ caption: e.target.value })}
            placeholder="Add a caption… (optional)"
            maxLength={200}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
          />
        </div>

        {/* Location + Duration row */}
        <div className="flex gap-2 items-center">
          {/* Location bubble */}
          <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/12 rounded-full overflow-visible">
            <LocationAutocomplete
              value={activeItem.locationName}
              onChange={v => updateActive({ locationName: v })}
              onSelect={(s: LocationSuggestion) => updateActive({ locationName: s.display })}
              placeholder="Tag location…"
              dropUp
              pill
            />
          </div>

          {/* Duration bubbles */}
          <div className="flex gap-1 flex-shrink-0">
            {[5, 10, 15].map(s => (
              <button key={s} onClick={() => setStoryDuration(s)}
                className={`w-10 h-10 rounded-full text-xs font-bold transition-all active:scale-90 backdrop-blur-md border ${
                  storyDuration === s
                    ? 'bg-gold/90 border-gold text-lenz-bg'
                    : 'bg-black/40 border-white/15 text-white/60'
                }`}>
                {s}s
              </button>
            ))}
          </div>
        </div>

        {/* Share button */}
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
