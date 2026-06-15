import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useLocation } from 'wouter'
import { MapPin, X, Image, ChevronDown, Info, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { suggestHashtags } from '@/data/hashtags'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { uploadWithProgress } from '@/lib/uploadWithProgress'
import UploadProgressBar from '@/components/UploadProgressBar'
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
  const [ratioIdx, setRatioIdx] = useState(2) // default 4:5 to match feed
  const [natSize, setNatSize] = useState({ w: 0, h: 0 })
  const [cSize, setCSize] = useState({ w: 0, h: 0 }) // measured container size
  const imgRef       = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const ratio  = RATIOS[ratioIdx]
  const isFree = ratio.w === 0

  // ── Measure actual container on mount + resize ────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => setCSize({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const cW = cSize.w || window.innerWidth
  const cH = cSize.h || (window.innerHeight - 180)

  // ── Preset crop box size (centered in container) ──────────────────────────
  const presetH = isFree ? cH : Math.min(Math.round(cW * ratio.h / ratio.w), cH)
  const presetW = isFree ? cW : Math.round(presetH * ratio.w / ratio.h)
  const boxLeft = Math.round((cW - presetW) / 2)
  const boxTop  = Math.round((cH - presetH) / 2)

  // ── Preset mode: pan + zoom ───────────────────────────────────────────────
  const [scale,  setScale]  = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Scale so image *covers* the crop box
  const fitScale = natSize.w > 0 ? Math.max(presetW / natSize.w, presetH / natSize.h) : 1
  const dispW = natSize.w * fitScale * scale
  const dispH = natSize.h * fitScale * scale

  const clampOffset = (ox: number, oy: number, sc: number) => {
    const dw = natSize.w * fitScale * sc
    const dh = natSize.h * fitScale * sc
    const maxX = Math.max(0, (dw - presetW) / 2)
    const maxY = Math.max(0, (dh - presetH) / 2)
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) }
  }

  const lastTouchRef  = useRef<{ x: number; y: number }[]>([])
  const baseOffRef    = useRef({ x: 0, y: 0 })
  const baseScaleRef  = useRef(1)
  const basePinchRef  = useRef(0)

  // ── Free-form mode ────────────────────────────────────────────────────────
  const [freeBox, setFreeBox] = useState<Box>({ x: 0, y: 0, w: 100, h: 100 })

  // Scale so whole image *fits* inside container
  const freeFit = natSize.w > 0 ? Math.min(cW / natSize.w, cH / natSize.h) : 1
  const fImgW = natSize.w * freeFit
  const fImgH = natSize.h * freeFit
  const fImgX = (cW - fImgW) / 2
  const fImgY = (cH - fImgH) / 2

  const clampFree = (box: Box): Box => {
    const MIN = 40
    let { x, y, w, h } = box
    x = Math.max(fImgX, x)
    y = Math.max(fImgY, y)
    w = Math.max(MIN, Math.min(fImgX + fImgW - x, w))
    h = Math.max(MIN, Math.min(fImgY + fImgH - y, h))
    return { x, y, w, h }
  }

  const activeHandleRef = useRef<FreeHandle | null>(null)
  const freeStartRef    = useRef({ tx: 0, ty: 0, box: { x: 0, y: 0, w: 0, h: 0 } })

  // ── Image load ────────────────────────────────────────────────────────────
  const onImgLoad = () => {
    const img = imgRef.current!
    setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
  }

  // Reset preset state on ratio change
  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }) }, [ratioIdx])

  // Init free box after image loads or entering free mode
  useEffect(() => {
    if (!isFree || !natSize.w || !cSize.w) return
    setFreeBox({ x: fImgX, y: fImgY, w: fImgW, h: fImgH })
  }, [isFree, natSize.w, natSize.h, cSize.w, cSize.h])

  // ── Preset touch ──────────────────────────────────────────────────────────
  const onPresetTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    lastTouchRef.current = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))
    baseOffRef.current   = offset
    baseScaleRef.current = scale
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
      setOffset(clampOffset(baseOffRef.current.x + dx, baseOffRef.current.y + dy, baseScaleRef.current))
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ns = Math.max(1, Math.min(6, baseScaleRef.current * (dist / basePinchRef.current)))
      setScale(ns)
      setOffset(clampOffset(baseOffRef.current.x, baseOffRef.current.y, ns))
    }
  }

  // ── Free touch ────────────────────────────────────────────────────────────
  const onFreeTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const tx = e.touches[0].clientX - rect.left
    const ty = e.touches[0].clientY - rect.top
    const { x, y, w, h } = freeBox
    const Z = 36 // touch zone px

    let handle: FreeHandle | null = null
    if      (Math.abs(tx - x)     <= Z && Math.abs(ty - y)     <= Z) handle = 'nw'
    else if (Math.abs(tx - (x+w)) <= Z && Math.abs(ty - y)     <= Z) handle = 'ne'
    else if (Math.abs(tx - x)     <= Z && Math.abs(ty - (y+h)) <= Z) handle = 'sw'
    else if (Math.abs(tx - (x+w)) <= Z && Math.abs(ty - (y+h)) <= Z) handle = 'se'
    else if (tx > x && tx < x+w && ty > y && ty < y+h)               handle = 'move'

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

    let nb = { ...s }
    if (handle === 'move') {
      nb.x = s.x + dx; nb.y = s.y + dy
    } else if (handle === 'nw') {
      const nx = Math.min(s.x + dx, s.x + s.w - MIN)
      const ny = Math.min(s.y + dy, s.y + s.h - MIN)
      nb = { x: nx, y: ny, w: s.w - (nx - s.x), h: s.h - (ny - s.y) }
    } else if (handle === 'ne') {
      const ny = Math.min(s.y + dy, s.y + s.h - MIN)
      nb = { x: s.x, y: ny, w: Math.max(MIN, s.w + dx), h: s.h - (ny - s.y) }
    } else if (handle === 'sw') {
      const nx = Math.min(s.x + dx, s.x + s.w - MIN)
      nb = { x: nx, y: s.y, w: s.w - (nx - s.x), h: Math.max(MIN, s.h + dy) }
    } else {
      nb = { x: s.x, y: s.y, w: Math.max(MIN, s.w + dx), h: Math.max(MIN, s.h + dy) }
    }
    setFreeBox(clampFree(nb))
  }

  const onFreeTouchEnd = () => { activeHandleRef.current = null }

  // ── Export ────────────────────────────────────────────────────────────────
  const confirmCrop = () => {
    if (!natSize.w || !imgRef.current) return
    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d')!
    const MAX    = 2048

    let srcX: number, srcY: number, srcW: number, srcH: number

    if (isFree) {
      srcX = (freeBox.x - fImgX) / freeFit
      srcY = (freeBox.y - fImgY) / freeFit
      srcW = freeBox.w / freeFit
      srcH = freeBox.h / freeFit
    } else {
      const sc      = fitScale * scale
      // Image top-left relative to the crop box
      const imgLeft = (presetW - natSize.w * sc) / 2 + offset.x
      const imgTop  = (presetH - natSize.h * sc) / 2 + offset.y
      srcX = -imgLeft / sc
      srcY = -imgTop  / sc
      srcW = presetW  / sc
      srcH = presetH  / sc
    }

    srcX = Math.max(0, srcX)
    srcY = Math.max(0, srcY)
    srcW = Math.min(natSize.w - srcX, srcW)
    srcH = Math.min(natSize.h - srcY, srcH)

    const ds = Math.min(1, MAX / Math.max(srcW, srcH))
    canvas.width  = Math.round(srcW * ds)
    canvas.height = Math.round(srcH * ds)
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)

    const webpUrl = canvas.toDataURL('image/webp', 0.95)
    onConfirm(webpUrl.startsWith('data:image/webp') ? webpUrl : canvas.toDataURL('image/jpeg', 0.97))
  }

  // ── Image CSS position ────────────────────────────────────────────────────
  const imgStyle: React.CSSProperties = isFree
    ? { position: 'absolute', width: fImgW, height: fImgH, left: fImgX, top: fImgY, pointerEvents: 'none', userSelect: 'none' }
    : {
        position: 'absolute',
        width:  dispW || presetW,
        height: dispH || presetH,
        // center over crop box, then apply pan offset
        left: boxLeft + (presetW - dispW) / 2 + offset.x,
        top:  boxTop  + (presetH - dispH) / 2 + offset.y,
        pointerEvents: 'none',
        userSelect: 'none',
      }

  const CORNER_SIZE = 20
  const CORNER_W    = 3

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}>
        <button onClick={onCancel} className="text-white/55 text-sm font-medium active:text-white">Cancel</button>
        <p className="text-white text-[13px] font-bold tracking-widest uppercase">Crop Photo</p>
        <button onClick={confirmCrop} className="text-gold font-semibold text-sm active:opacity-70">Done</button>
      </div>

      {/* Crop canvas — flex-1 so it fills exactly the space between header and picker */}
      <div className="flex-1 relative overflow-hidden bg-black min-h-0">
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ touchAction: 'none' }}
          onTouchStart={isFree ? onFreeTouchStart : onPresetTouchStart}
          onTouchMove={isFree  ? onFreeTouchMove  : onPresetTouchMove}
          onTouchEnd={isFree   ? onFreeTouchEnd   : () => { lastTouchRef.current = [] }}
        >
          {/* Image */}
          <img ref={imgRef} src={src} alt="" onLoad={onImgLoad} draggable={false} style={imgStyle} />

          {isFree ? (
            <>
              {/* Dim overlay with hole */}
              <div className="absolute pointer-events-none" style={{
                left: freeBox.x, top: freeBox.y, width: freeBox.w, height: freeBox.h,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                border: '1.5px solid rgba(255,255,255,0.6)',
                backgroundImage: [
                  'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                  'linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                ].join(','),
                backgroundSize: `${freeBox.w / 3}px ${freeBox.h / 3}px`,
              }} />
              {/* Corner handles */}
              {(['nw','ne','sw','se'] as const).map(c => {
                const isW = c[1] === 'w', isN = c[0] === 'n'
                return (
                  <div key={c} className="absolute" style={{
                    left:   isW ? freeBox.x - 1 : freeBox.x + freeBox.w - CORNER_SIZE + 1,
                    top:    isN ? freeBox.y - 1  : freeBox.y + freeBox.h - CORNER_SIZE + 1,
                    width: CORNER_SIZE, height: CORNER_SIZE,
                    borderTop:    isN  ? `${CORNER_W}px solid white` : undefined,
                    borderBottom: !isN ? `${CORNER_W}px solid white` : undefined,
                    borderLeft:   isW  ? `${CORNER_W}px solid white` : undefined,
                    borderRight:  !isW ? `${CORNER_W}px solid white` : undefined,
                    borderRadius: 3,
                  }} />
                )
              })}
            </>
          ) : (
            <>
              {/* 4 dim panels around crop box */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'transparent',
                boxShadow: `0 0 0 9999px rgba(0,0,0,0.55)`,
                // carve the crop box out via clip-path
                clipPath: `polygon(
                  0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                  ${boxLeft}px ${boxTop}px,
                  ${boxLeft}px ${boxTop + presetH}px,
                  ${boxLeft + presetW}px ${boxTop + presetH}px,
                  ${boxLeft + presetW}px ${boxTop}px,
                  ${boxLeft}px ${boxTop}px
                )`,
              }} />
              {/* Crop box border + rule-of-thirds grid */}
              <div className="absolute pointer-events-none" style={{
                left: boxLeft, top: boxTop, width: presetW, height: presetH,
                border: '1.5px solid rgba(255,255,255,0.65)',
                backgroundImage: [
                  'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                  'linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                ].join(','),
                backgroundSize: `${presetW / 3}px ${presetH / 3}px`,
              }} />
              {/* Corner brackets */}
              {([
                { l: boxLeft - 1,              t: boxTop - 1,               bT: true,  bL: true  },
                { l: boxLeft + presetW - CORNER_SIZE + 1, t: boxTop - 1,    bT: true,  bR: true  },
                { l: boxLeft - 1,              t: boxTop + presetH - CORNER_SIZE + 1,  bB: true,  bL: true  },
                { l: boxLeft + presetW - CORNER_SIZE + 1, t: boxTop + presetH - CORNER_SIZE + 1, bB: true,  bR: true  },
              ] as { l:number; t:number; bT?:boolean; bB?:boolean; bL?:boolean; bR?:boolean }[]).map((c, i) => (
                <div key={i} className="absolute pointer-events-none" style={{
                  left: c.l, top: c.t, width: CORNER_SIZE, height: CORNER_SIZE, borderRadius: 3,
                  borderTop:    c.bT ? `${CORNER_W}px solid white` : undefined,
                  borderBottom: c.bB ? `${CORNER_W}px solid white` : undefined,
                  borderLeft:   c.bL ? `${CORNER_W}px solid white` : undefined,
                  borderRight:  c.bR ? `${CORNER_W}px solid white` : undefined,
                }} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Ratio picker */}
      <div className="shrink-0 pt-4 pb-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
        <div className="flex justify-center gap-8">
          {RATIOS.map((r, i) => (
            <button key={r.label} onClick={() => setRatioIdx(i)}
              className={`flex flex-col items-center gap-2 transition-all ${i === ratioIdx ? 'opacity-100 scale-105' : 'opacity-30'}`}>
              {r.w === 0
                ? <div className={`border-[2px] border-dashed rounded-sm ${i === ratioIdx ? 'border-gold' : 'border-white'}`} style={{ width: 24, height: 22 }} />
                : <div className={`border-[2px] rounded-sm ${i === ratioIdx ? 'border-gold' : 'border-white'}`}
                    style={{ width: r.w >= r.h ? 28 : Math.round(28 * r.w / r.h), height: r.h >= r.w ? 28 : Math.round(28 * r.h / r.w) }} />
              }
              <span className={`text-[11px] font-bold tracking-wide ${i === ratioIdx ? 'text-gold' : 'text-white'}`}>{r.label}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-white/25 mt-3">
          {isFree ? 'Drag corners · drag inside to move' : 'Pinch to zoom · drag to reposition'}
        </p>
      </div>
    </div>
  )
}

// ── Hashtag input with live suggestions ───────────────────────────────────────
function HashtagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)

  const activeWord = useMemo(() => {
    const words = value.split(/\s+/)
    const last = words[words.length - 1] ?? ''
    return last.startsWith('#') && last.length > 1 ? last : ''
  }, [value])

  const suggestions = useMemo(() =>
    activeWord ? suggestHashtags(activeWord.slice(1), 10) : [],
  [activeWord])

  const pickTag = (tag: string) => {
    const words = value.trimEnd().split(/\s+/)
    if (words[words.length - 1]?.startsWith('#')) words.pop()
    onChange([...words, tag, ''].join(' '))
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Tags: #portrait #nyc #goldenhour"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
      />
      {focused && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <div className="flex flex-wrap gap-1.5 p-3">
            {suggestions.map(tag => (
              <button
                key={tag}
                onMouseDown={e => { e.preventDefault(); pickTag(tag) }}
                className="px-2.5 py-1 bg-gold/10 hover:bg-gold/20 text-gold text-xs rounded-full transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Collaborator Tagger ───────────────────────────────────────────────────────
type CollabProfile = { id: string; username: string; name: string | null; avatar_url: string | null }

function CollaboratorInput({
  collaborators,
  onAdd,
  onRemove,
  currentUserId,
}: {
  collaborators: CollabProfile[]
  onAdd: (p: CollabProfile) => void
  onRemove: (id: string) => void
  currentUserId: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CollabProfile[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url')
        .ilike('username', `%${query.trim()}%`)
        .neq('id', currentUserId)
        .limit(6)
      setResults((data ?? []).filter((p: CollabProfile) => !collaborators.find(c => c.id === p.id)))
      setLoading(false)
    }, 300)
  }, [query, collaborators, currentUserId])

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-white/40 font-medium tracking-wide uppercase px-1">Tag Collaborators</p>

      {/* Chips */}
      {collaborators.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {collaborators.map(c => (
            <div key={c.id} className="flex items-center gap-1.5 bg-gold/10 border border-gold/30 rounded-full pl-1 pr-2 py-1">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-lenz-bg">
                {c.avatar_url
                  ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white/40">{(c.username || '?')[0].toUpperCase()}</div>
                }
              </div>
              <span className="text-xs text-gold font-medium">@{c.username}</span>
              <button onClick={() => onRemove(c.id)} className="text-white/30 hover:text-white/60 transition-colors ml-0.5">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors"
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />}

        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-[#141414] border border-lenz-border rounded-2xl overflow-hidden shadow-2xl z-30">
            {results.map(r => (
              <button
                key={r.id}
                onClick={() => { onAdd(r); setQuery(''); setResults([]) }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/8 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-lenz-bg shrink-0">
                  {r.avatar_url
                    ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/40">{(r.username || '?')[0].toUpperCase()}</div>
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">@{r.username}</p>
                  {r.name && <p className="text-xs text-white/40">{r.name}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
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
  const [collaborators, setCollaborators] = useState<CollabProfile[]>([])
  const [addToCommunity, setAddToCommunity] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error('Unsupported file type. Please select a photo.')
      e.target.value = ''
      return
    }
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
    setUploadProgress(0)
    try {
      const ext = imageFile.type === 'image/webp' ? 'webp' : 'jpg'
      const filePath = `${user.id}/${Date.now()}.${ext}`
      const publicUrl = await uploadWithProgress('photos', filePath, imageFile, setUploadProgress)

      const parsedTags = tags.split(/[\s,]+/).filter(t => t.startsWith('#')).map(t => t.toLowerCase())

      const collaboratorIds = collaborators.map(c => c.id)
      const { data: insertedPost, error: insertError } = await supabase.from('posts').insert({
        user_id: user.id, image_url: publicUrl,
        caption: caption.trim(), location_name: locationName.trim() || null,
        lat, lng, tags: parsedTags, category,
        show_in_community: locationName.trim() ? addToCommunity : false,
        ...(collaboratorIds.length > 0 ? { collaborators: collaboratorIds } : {}),
      }).select().single()
      if (insertError) throw insertError

      // Notify tagged collaborators
      if (insertedPost && collaboratorIds.length > 0) {
        const uploaderProfile = await supabase
          .from('profiles').select('username').eq('id', user.id).single()
        const uploaderUsername = uploaderProfile.data?.username ?? 'Someone'
        await Promise.all(collaboratorIds.map(uid =>
          supabase.from('notifications').insert({
            user_id: uid,
            type: 'collab_tag',
            actor_id: user.id,
            post_id: insertedPost.id,
            message: `@${uploaderUsername} tagged you as a collaborator on a post.`,
            read: false,
          })
        ))
      }

      if (locationName.trim()) {
        const spotName = locationName.trim().split(',')[0].trim()
        const locParts = locationName.trim().split(',').map(p => p.trim())
        // Parse "City, ST" or "Name, City, ST" patterns
        const cityState = locParts[locParts.length - 1] ?? ''
        const parts = cityState.split(' ').filter(Boolean)
        const state = parts[parts.length - 1] ?? ''
        const city  = parts.slice(0, -1).join(' ') || (locParts[1] ?? '')

        const { data: existing } = await supabase.from('photo_spots')
          .select('id, photo_count, cover_image_url')
          .ilike('name', `%${spotName}%`)
          .limit(1)

        if (existing && existing.length > 0) {
          await supabase.from('photo_spots').update({
            photo_count: (existing[0].photo_count ?? 0) + 1,
            cover_image_url: existing[0].cover_image_url || publicUrl,
            updated_at: new Date().toISOString(),
          }).eq('id', existing[0].id)
        } else {
          // Fetch profile for discoverer credit fields
          const { data: prof } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single()
          // Try with discoverer fields first; fall back without them if columns don't exist
          let { error: spotErr } = await supabase.from('photo_spots').insert({
            name: spotName,
            lat: lat ?? 0, lng: lng ?? 0,
            city: city || null, state: state || null,
            location_name: locationName.trim(), category,
            cover_image_url: publicUrl, photo_count: 1,
            contributor_count: 1, ai_score: 50, tags: parsedTags,
            discoverer_username: prof?.username ?? null,
            discoverer_avatar: prof?.avatar_url ?? null,
          })
          if (spotErr) {
            // Retry without discoverer columns in case they don't exist yet
            const { error: spotErr2 } = await supabase.from('photo_spots').insert({
              name: spotName,
              lat: lat ?? 0, lng: lng ?? 0,
              city: city || null, state: state || null,
              location_name: locationName.trim(), category,
              cover_image_url: publicUrl, photo_count: 1,
              contributor_count: 1, ai_score: 50, tags: parsedTags,
            })
            if (spotErr2) console.error('[photo_spots insert]', spotErr2.message)
          }
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
    <UploadProgressBar progress={uploadProgress} visible={uploading} label="Uploading photo" />
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

        <div className="relative">
          <textarea placeholder="Write a caption..." value={caption} onChange={e => setCaption(e.target.value.slice(0, 2200))}
            rows={3}
            className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors resize-none" />
          <span className={cn(
            'absolute bottom-2.5 right-3 text-[10px] tabular-nums transition-colors',
            caption.length > 2000 ? 'text-rose-400' : 'text-white/20'
          )}>
            {caption.length}/2200
          </span>
        </div>

        <div className="space-y-2">
          <LocationAutocomplete value={locationName} onChange={setLocationName} />
          <div className="flex items-start gap-1.5 px-1">
            <Info size={11} className="text-gold/50 mt-0.5 shrink-0" />
            <p className="text-[10px] text-white/30 leading-relaxed">
              Add the <span className="text-white/50">location name</span> (e.g. "Eiffel Tower, Paris" or "Wynwood Walls, Miami FL") so others can find this spot.
            </p>
          </div>
          <button onClick={getLocation} disabled={gettingLocation}
            className="flex items-center gap-2 text-xs text-gold/80 hover:text-gold transition-colors disabled:opacity-50">
            <MapPin size={13} />
            {gettingLocation ? 'Getting location...' : lat ? `GPS: ${lat.toFixed(4)}, ${lng?.toFixed(4)}` : 'Use current GPS location'}
          </button>

          {/* Community toggle — only shown when a location is entered */}
          {locationName.trim() && (
            <button
              type="button"
              onClick={() => setAddToCommunity(v => !v)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-200',
                addToCommunity
                  ? 'bg-gold/10 border-gold/40'
                  : 'bg-lenz-card border-lenz-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  addToCommunity ? 'bg-gold/20' : 'bg-white/5'
                )}>
                  <Sparkles size={16} className={addToCommunity ? 'text-gold' : 'text-white/30'} />
                </div>
                <div className="text-left">
                  <p className={cn('text-sm font-semibold transition-colors', addToCommunity ? 'text-gold' : 'text-white/60')}>
                    Add to Community Discovered
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    Share this location with all photographers
                  </p>
                </div>
              </div>
              {/* Toggle pill */}
              <div className={cn(
                'w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0',
                addToCommunity ? 'bg-gold' : 'bg-white/15'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                  addToCommunity ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </div>
            </button>
          )}
        </div>

        <div className="relative">
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full bg-lenz-card border border-lenz-border rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-gold/50 appearance-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        <HashtagInput value={tags} onChange={setTags} />

        <CollaboratorInput
          collaborators={collaborators}
          onAdd={p => setCollaborators(prev => [...prev, p])}
          onRemove={id => setCollaborators(prev => prev.filter(c => c.id !== id))}
          currentUserId={user?.id ?? ''}
        />
      </div>
    </div>
    </div>
  )
}
