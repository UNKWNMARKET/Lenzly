import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { X, Camera, ChevronLeft, ImagePlus, Send, Plus } from 'lucide-react'
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

  const [items, setItems] = useState<StoryItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [storyDuration, setStoryDuration] = useState(10)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState<'photo' | 'details'>('photo')
  const [editTab, setEditTab] = useState<'filters' | 'layout'>('filters')

  const activeItem = items[activeIndex] ?? null

  // ── Camera / file helpers ────────────────────────────────────────────────
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
        fillSlotOrAddItem(file, photo.dataUrl)
      }
    } catch {
      if (fallback && source === CameraSource.Camera) fileInputRef.current?.click()
    }
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

  useEffect(() => { openCamera(CameraSource.Camera, false) }, [])

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

  // ── Step 1: No photo yet ─────────────────────────────────────────────────
  if (step === 'photo' || items.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ background: 'linear-gradient(180deg,#1a0e04 0%,#0d0804 40%,#050302 100%)' }}>
        {/* Full-screen dark canvas */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
        </div>

        {/* X close — top left, safe area */}
        <button
          onClick={() => navigate('/')}
          className="absolute z-10 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
          style={{ top: 'calc(env(safe-area-inset-top, 44px) + 12px)', left: '16px' }}
        >
          <X size={19} className="text-white" />
        </button>

        {/* Bottom action bar — matches reference layout */}
        <div
          className="absolute inset-x-0 bottom-0 px-5 flex flex-col gap-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 34px) + 20px)' }}
        >
          {/* Camera shutter row */}
          <div className="flex items-center justify-between">
            {/* Library thumbnail pill */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md border border-white/12 rounded-full px-4 py-2.5 active:scale-95 transition-transform"
            >
              <ImagePlus size={18} className="text-white/80" />
              <span className="text-white/80 text-sm font-semibold">Library</span>
            </button>

            {/* Main shutter */}
            <button
              onClick={() => openCamera(CameraSource.Camera)}
              className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '3px solid rgba(255,255,255,0.35)' }}
            >
              <div className="w-14 h-14 rounded-full bg-white/90" />
            </button>

            {/* Spacer to balance layout */}
            <div className="w-[100px]" />
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  const activeLayout = LAYOUTS.find(l => l.id === activeItem.layoutId) ?? LAYOUTS[0]
  const activeFilter = FILTERS[activeItem.filterIndex]

  // ── Step 2: Photos selected ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black flex flex-col safe-top safe-bottom">

      {/* ── Layout preview (full screen) ────────────────────────────────── */}
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
                // Empty slot — tap to fill
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
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3">
        <button onClick={() => { setItems([]); setStep('photo') }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <span className="text-white text-sm font-bold tracking-widest uppercase opacity-80">
          {items.length > 1 ? `Spot ${activeIndex + 1} of ${items.length}` : 'Your Spot'}
        </span>
        <button onClick={() => { slotToFill.current = null; fileInputRef.current?.click() }}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Plus size={18} className="text-white" />
        </button>
      </div>

      {/* ── Thumbnail strip ─────────────────────────────────────────────── */}
      {items.length > 1 && (
        <div className="relative z-10 flex gap-2 px-4 mt-3 overflow-x-auto no-scrollbar">
          {items.map((it, i) => (
            <button key={i} onClick={() => setActiveIndex(i)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-gold' : 'border-white/20'}`}>
              {it.previews[0]
                ? <img src={it.previews[0]} className="w-full h-full object-cover"
                    style={{ filter: FILTERS[it.filterIndex].css === 'none' ? undefined : FILTERS[it.filterIndex].css }} />
                : <div className="w-full h-full bg-white/10" />
              }
              <button onClick={e => { e.stopPropagation(); removeItem(i) }}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
                <X size={10} className="text-white" />
              </button>
              {!it.locationName && <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-500/80" />}
            </button>
          ))}
          <button onClick={() => { slotToFill.current = null; fileInputRef.current?.click() }}
            className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
            <Plus size={18} className="text-white/40" />
          </button>
        </div>
      )}

      {/* ── Edit tab switcher (Filters / Layout) ────────────────────────── */}
      <div className="absolute left-0 right-0 z-20" style={{ bottom: '330px' }}>
        {/* Tab pills */}
        <div className="flex justify-center gap-1 mb-3 px-4">
          <button
            onClick={() => setEditTab('filters')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all ${
              editTab === 'filters' ? 'bg-gold text-lenz-bg' : 'bg-black/40 text-white/50 border border-white/15'
            }`}
          >
            Filters
          </button>
          <button
            onClick={() => setEditTab('layout')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all ${
              editTab === 'layout' ? 'bg-gold text-lenz-bg' : 'bg-black/40 text-white/50 border border-white/15'
            }`}
          >
            Layout
          </button>
        </div>

        {/* Filter strip */}
        {editTab === 'filters' && (
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
                  {activeItem.previews[0]
                    ? <img src={activeItem.previews[0]} className="w-full h-full object-cover"
                        style={{ filter: f.css === 'none' ? undefined : f.css }} />
                    : <div className="w-full h-full bg-white/10" />
                  }
                </div>
                <span className={`text-[10px] font-semibold tracking-wide ${
                  activeItem.filterIndex === i ? 'text-gold' : 'text-white/50'
                }`}>{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Layout grid */}
        {editTab === 'layout' && (
          <div className="px-4">
            <div className="grid grid-cols-4 gap-2">
              {LAYOUTS.map(layout => (
                <button
                  key={layout.id}
                  onClick={() => changeLayout(layout.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all active:scale-95 ${
                    activeItem.layoutId === layout.id
                      ? 'border-gold bg-gold/10 shadow-[0_0_10px_rgba(201,168,76,0.4)]'
                      : 'border-white/15 bg-black/30'
                  }`}
                >
                  <span className={activeItem.layoutId === layout.id ? 'text-gold' : 'text-white/60'}>
                    <LayoutIcon layout={layout} size={38} />
                  </span>
                  <span className={`text-[10px] font-bold tracking-wide ${
                    activeItem.layoutId === layout.id ? 'text-gold' : 'text-white/40'
                  }`}>{layout.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom sheet ────────────────────────────────────────────────── */}
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
