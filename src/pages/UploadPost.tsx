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

const RATIOS = [
  { label: 'Free',     w: -1, h: -1 },
  { label: 'Original', w: 0,  h: 0  },
  { label: '1:1',      w: 1,  h: 1  },
  { label: '4:5',      w: 4,  h: 5  },
  { label: '16:9',     w: 16, h: 9  },
]

type FH = 'nw' | 'ne' | 'sw' | 'se' | 'move'
type Box = { x: number; y: number; w: number; h: number }

// ── Crop Editor ───────────────────────────────────────────────────────────────
function CropEditor({ src, onConfirm, onCancel }: {
  src: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}) {
  const [ratioIdx, setRatioIdx] = useState(3)           // default 4:5
  const [natSize, setNatSize]   = useState({ w: 0, h: 0 })
  const [cSize,   setCSize]     = useState({ w: 0, h: 0 })

  // preset mode state
  const [scale,   setScale]   = useState(1)
  const [offset,  setOffset]  = useState({ x: 0, y: 0 })
  const [dragging,setDragging]= useState(false)

  // free mode state
  const [freeBox, setFreeBox] = useState<Box>({ x: 0, y: 0, w: 200, h: 200 })

  const imgRef        = useRef<HTMLImageElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  // Refs mirror latest state so native touch handlers never use stale closures
  const scaleRef      = useRef(1)
  const offsetRef     = useRef({ x: 0, y: 0 })
  const isFreeRef     = useRef(false)
  const freeBoxRef    = useRef<Box>({ x: 0, y: 0, w: 200, h: 200 })
  // Gesture tracking refs
  const lastTouchRef  = useRef<{ x: number; y: number }[]>([])
  const baseOffRef    = useRef({ x: 0, y: 0 })
  const baseScaleRef  = useRef(1)
  const basePinchRef  = useRef(0)
  const freeHandleRef = useRef<FH | null>(null)
  const freeStartRef  = useRef({ tx: 0, ty: 0, box: { x: 0, y: 0, w: 0, h: 0 } })
  // Latest derived values needed inside native handlers
  const cropGeomRef   = useRef({ cropW: 0, cropH: 0, fitScale: 1, fImgX: 0, fImgY: 0, fImgW: 0, fImgH: 0 })

  const ratio   = RATIOS[ratioIdx]
  const isFree  = ratio.w === -1
  const isNative= ratio.w === 0

  // Keep isFree ref in sync
  useEffect(() => { isFreeRef.current = isFree }, [isFree])
  // Keep freeBox ref in sync
  useEffect(() => { freeBoxRef.current = freeBox }, [freeBox])
  // Keep scale/offset refs in sync
  useEffect(() => { scaleRef.current = scale }, [scale])
  useEffect(() => { offsetRef.current = offset }, [offset])

  // ── Measure container ─────────────────────────────────────────────────────
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
  const cH = cSize.h || (window.innerHeight - 200)

  // ── Preset crop box ───────────────────────────────────────────────────────
  const cropH = isNative
    ? (natSize.h > 0 ? Math.min(cH, Math.round(cW * natSize.h / natSize.w)) : cH)
    : Math.min(Math.round(cW * ratio.h / ratio.w), cH)
  const cropW = isNative
    ? (natSize.w > 0 ? Math.min(cW, Math.round(cropH * natSize.w / natSize.h)) : cW)
    : Math.round(cropH * ratio.w / ratio.h)
  const boxL  = Math.round((cW - cropW) / 2)
  const boxT  = Math.round((cH - cropH) / 2)

  // ── Preset: image always covers crop box ──────────────────────────────────
  const fitScale = natSize.w > 0 ? Math.max(cropW / natSize.w, cropH / natSize.h) : 1
  const dispW    = Math.max(cropW, natSize.w * fitScale * scale)
  const dispH    = Math.max(cropH, natSize.h * fitScale * scale)

  // ── Free: image fits in container ─────────────────────────────────────────
  const freeFit = natSize.w > 0 ? Math.min(cW / natSize.w, cH / natSize.h) : 1
  const fImgW = natSize.w * freeFit
  const fImgH = natSize.h * freeFit
  const fImgX = (cW - fImgW) / 2
  const fImgY = (cH - fImgH) / 2

  // Keep crop geometry ref in sync for native handlers
  useEffect(() => {
    cropGeomRef.current = { cropW, cropH, fitScale, fImgX, fImgY, fImgW, fImgH }
  }, [cropW, cropH, fitScale, fImgX, fImgY, fImgW, fImgH])

  const clampOff = (ox: number, oy: number, sc: number, cw: number, ch: number, fs: number, nw: number, nh: number) => {
    const dw   = Math.max(cw, nw * fs * sc)
    const dh   = Math.max(ch, nh * fs * sc)
    const maxX = (dw - cw) / 2
    const maxY = (dh - ch) / 2
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) }
  }

  const clampFree = (b: Box, ix: number, iy: number, iw: number, ih: number): Box => {
    const MIN = 44
    let { x, y, w, h } = b
    x = Math.max(ix, x)
    y = Math.max(iy, y)
    w = Math.max(MIN, Math.min(ix + iw - x, w))
    h = Math.max(MIN, Math.min(iy + ih - y, h))
    return { x, y, w, h }
  }

  const onImgLoad = () => {
    const img = imgRef.current!
    setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
  }

  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }) }, [ratioIdx])

  // Init free box when entering free mode or image loads
  useEffect(() => {
    if (!isFree || !natSize.w || !cSize.w) return
    const pad = 32
    const b = { x: fImgX + pad, y: fImgY + pad, w: fImgW - pad * 2, h: fImgH - pad * 2 }
    setFreeBox(b)
    freeBoxRef.current = b
  }, [isFree, natSize.w, cSize.w])

  // ── Native touch handlers (passive:false so preventDefault works on iOS) ──
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onStart = (e: TouchEvent) => {
      e.preventDefault()
      if (isFreeRef.current) {
        // Free mode: detect which corner/move handle was touched
        const rect = el.getBoundingClientRect()
        const tx   = e.touches[0].clientX - rect.left
        const ty   = e.touches[0].clientY - rect.top
        const { x, y, w, h } = freeBoxRef.current
        const HIT  = 40
        let handle: FH | null = null
        if      (Math.abs(tx - x)       <= HIT && Math.abs(ty - y)       <= HIT) handle = 'nw'
        else if (Math.abs(tx - (x + w)) <= HIT && Math.abs(ty - y)       <= HIT) handle = 'ne'
        else if (Math.abs(tx - x)       <= HIT && Math.abs(ty - (y + h)) <= HIT) handle = 'sw'
        else if (Math.abs(tx - (x + w)) <= HIT && Math.abs(ty - (y + h)) <= HIT) handle = 'se'
        else if (tx > x && tx < x + w && ty > y && ty < y + h)                   handle = 'move'
        freeHandleRef.current = handle
        if (handle) freeStartRef.current = { tx, ty, box: { ...freeBoxRef.current } }
      } else {
        // Preset mode: pan + pinch
        setDragging(true)
        lastTouchRef.current  = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))
        baseOffRef.current    = offsetRef.current
        baseScaleRef.current  = scaleRef.current
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          basePinchRef.current = Math.sqrt(dx * dx + dy * dy)
        }
      }
    }

    const onMove = (e: TouchEvent) => {
      e.preventDefault()
      if (isFreeRef.current) {
        const handle = freeHandleRef.current
        if (!handle) return
        const rect = el.getBoundingClientRect()
        const tx   = e.touches[0].clientX - rect.left
        const ty   = e.touches[0].clientY - rect.top
        const dx   = tx - freeStartRef.current.tx
        const dy   = ty - freeStartRef.current.ty
        const s    = freeStartRef.current.box
        const MIN  = 44
        const { fImgX: ix, fImgY: iy, fImgW: iw, fImgH: ih } = cropGeomRef.current

        let nb: Box = { ...s }
        if (handle === 'move') {
          nb = { ...s, x: s.x + dx, y: s.y + dy }
        } else if (handle === 'nw') {
          const nx = Math.min(s.x + dx, s.x + s.w - MIN), ny = Math.min(s.y + dy, s.y + s.h - MIN)
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
        const clamped = clampFree(nb, ix, iy, iw, ih)
        freeBoxRef.current = clamped
        setFreeBox(clamped)
      } else {
        const { cropW: cw, cropH: ch, fitScale: fs } = cropGeomRef.current
        const nw = natSize.w, nh = natSize.h
        if (e.touches.length === 1) {
          const dx = e.touches[0].clientX - (lastTouchRef.current[0]?.x ?? e.touches[0].clientX)
          const dy = e.touches[0].clientY - (lastTouchRef.current[0]?.y ?? e.touches[0].clientY)
          const o = clampOff(baseOffRef.current.x + dx, baseOffRef.current.y + dy, baseScaleRef.current, cw, ch, fs, nw, nh)
          offsetRef.current = o
          setOffset(o)
        } else if (e.touches.length === 2) {
          const dx   = e.touches[0].clientX - e.touches[1].clientX
          const dy   = e.touches[0].clientY - e.touches[1].clientY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (basePinchRef.current === 0) { basePinchRef.current = dist; return }
          const ns = Math.max(1, Math.min(6, baseScaleRef.current * (dist / basePinchRef.current)))
          const o  = clampOff(baseOffRef.current.x, baseOffRef.current.y, ns, cw, ch, fs, nw, nh)
          scaleRef.current  = ns
          offsetRef.current = o
          setScale(ns)
          setOffset(o)
        }
      }
    }

    const onEnd = (e: TouchEvent) => {
      if (isFreeRef.current) {
        freeHandleRef.current = null
      } else {
        // If second finger lifts during pinch, reset base for remaining drag
        if (e.touches.length === 1) {
          lastTouchRef.current  = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }]
          baseOffRef.current    = offsetRef.current
          baseScaleRef.current  = scaleRef.current
        } else if (e.touches.length === 0) {
          setDragging(false)
          lastTouchRef.current = []
        }
      }
    }

    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    el.addEventListener('touchend',   onEnd,   { passive: true  })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
      el.removeEventListener('touchend',   onEnd)
    }
  }, [natSize.w, natSize.h]) // re-register only when image dimensions change

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
      const sc  = fitScale * scale
      const iL  = (cropW - natSize.w * sc) / 2 + offset.x
      const iT  = (cropH - natSize.h * sc) / 2 + offset.y
      srcX = Math.max(0, -iL / sc)
      srcY = Math.max(0, -iT / sc)
      srcW = Math.min(natSize.w - srcX, cropW / sc)
      srcH = Math.min(natSize.h - srcY, cropH / sc)
    }

    const ds = Math.min(1, MAX / Math.max(srcW, srcH))
    canvas.width  = Math.round(srcW * ds)
    canvas.height = Math.round(srcH * ds)
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL('image/webp', 0.95)
    onConfirm(url.startsWith('data:image/webp') ? url : canvas.toDataURL('image/jpeg', 0.97))
  }

  // ── Image CSS position ────────────────────────────────────────────────────
  const imgStyle: React.CSSProperties = isFree
    ? {
        position: 'absolute', width: fImgW, height: fImgH,
        left: fImgX, top: fImgY, pointerEvents: 'none', userSelect: 'none',
      }
    : {
        position: 'absolute',
        width:  dispW, height: dispH,
        left:   boxL + (cropW - dispW) / 2 + offset.x,
        top:    boxT  + (cropH - dispH) / 2 + offset.y,
        pointerEvents: 'none', userSelect: 'none', willChange: 'transform',
      }

  const CS = 26 // corner bracket size
  const CW = 3  // corner bracket stroke
  const zoomPct = Math.round(scale * 100)

  // 4-panel dark overlay — rock-solid, no box-shadow tricks
  const panels = isFree
    ? [
        { l: 0,              t: 0,              w: cW,              h: freeBox.y           }, // top
        { l: 0,              t: freeBox.y,      w: freeBox.x,       h: freeBox.h           }, // left
        { l: freeBox.x + freeBox.w, t: freeBox.y, w: cW - freeBox.x - freeBox.w, h: freeBox.h }, // right
        { l: 0,              t: freeBox.y + freeBox.h, w: cW,       h: cH - freeBox.y - freeBox.h }, // bottom
      ]
    : [
        { l: 0,    t: 0,    w: cW,   h: boxT           }, // top
        { l: 0,    t: boxT, w: boxL, h: cropH          }, // left
        { l: boxL + cropW, t: boxT, w: cW - boxL - cropW, h: cropH }, // right
        { l: 0,    t: boxT + cropH, w: cW,  h: cH - boxT - cropH  }, // bottom
      ]

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>
        <button onClick={onCancel}
          className="w-16 text-left text-[15px] text-white/50 font-medium active:text-white transition-colors">
          Cancel
        </button>
        <div className="flex flex-col items-center">
          <p className="text-white text-[12px] font-bold tracking-[0.16em] uppercase">Crop Photo</p>
          {!isFree && scale > 1.01 && (
            <p className="text-gold/70 text-[10px] font-semibold mt-0.5">{zoomPct}%</p>
          )}
        </div>
        <button onClick={confirmCrop}
          className="w-16 text-right text-[15px] font-semibold text-gold active:opacity-60 transition-opacity">
          Done
        </button>
      </div>

      {/* Crop canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#0a0a0a] min-h-0">
        <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }}>

          {/* Image */}
          <img ref={imgRef} src={src} alt="" onLoad={onImgLoad} draggable={false} style={imgStyle} />

          {/* 4-panel dark overlay — no box-shadow, guaranteed correct */}
          {panels.map((p, i) => (
            <div key={i} className="absolute pointer-events-none"
              style={{ left: p.l, top: p.t, width: Math.max(0, p.w), height: Math.max(0, p.h),
                backgroundColor: `rgba(0,0,0,${dragging ? 0.72 : 0.62})`,
                transition: 'background-color 0.15s' }} />
          ))}

          {/* Rule-of-thirds grid inside crop area */}
          {(() => {
            const gx = isFree ? freeBox.x : boxL
            const gy = isFree ? freeBox.y : boxT
            const gw = isFree ? freeBox.w : cropW
            const gh = isFree ? freeBox.h : cropH
            return (
              <div className="absolute pointer-events-none"
                style={{ left: gx, top: gy, width: gw, height: gh,
                  backgroundImage: [
                    'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)',
                    'linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)',
                  ].join(','),
                  backgroundSize: `${gw / 3}px ${gh / 3}px`,
                  opacity: dragging ? 1 : 0.4, transition: 'opacity 0.2s' }} />
            )
          })()}

          {/* Crop box border */}
          {(() => {
            const bx = isFree ? freeBox.x : boxL
            const by = isFree ? freeBox.y : boxT
            const bw = isFree ? freeBox.w : cropW
            const bh = isFree ? freeBox.h : cropH
            return (
              <div className="absolute pointer-events-none"
                style={{ left: bx, top: by, width: bw, height: bh,
                  border: `1px solid rgba(255,255,255,${dragging ? 0.75 : 0.35})`,
                  transition: 'border-color 0.15s' }} />
            )
          })()}

          {/* Corner brackets */}
          {(() => {
            const bx = isFree ? freeBox.x : boxL
            const by = isFree ? freeBox.y : boxT
            const bw = isFree ? freeBox.w : cropW
            const bh = isFree ? freeBox.h : cropH
            const col = dragging ? 'white' : '#C9A84C'
            return [
              { l: bx - 1,       t: by - 1,       bT: true, bL: true  },
              { l: bx + bw - CS, t: by - 1,       bT: true, bR: true  },
              { l: bx - 1,       t: by + bh - CS, bB: true, bL: true  },
              { l: bx + bw - CS, t: by + bh - CS, bB: true, bR: true  },
            ].map((c, i) => (
              <div key={i} className="absolute pointer-events-none transition-colors duration-150"
                style={{ left: c.l, top: c.t, width: CS, height: CS, borderRadius: 3,
                  borderTop:    c.bT ? `${CW}px solid ${col}` : undefined,
                  borderBottom: c.bB ? `${CW}px solid ${col}` : undefined,
                  borderLeft:   c.bL ? `${CW}px solid ${col}` : undefined,
                  borderRight:  c.bR ? `${CW}px solid ${col}` : undefined }} />
            ))
          })()}

          {/* Free mode: large invisible touch targets on corners */}
          {isFree && ([
            { l: freeBox.x - 22,              t: freeBox.y - 22,              h: 'nw' },
            { l: freeBox.x + freeBox.w - 22,  t: freeBox.y - 22,              h: 'ne' },
            { l: freeBox.x - 22,              t: freeBox.y + freeBox.h - 22,  h: 'sw' },
            { l: freeBox.x + freeBox.w - 22,  t: freeBox.y + freeBox.h - 22, h: 'se' },
          ] as { l: number; t: number; h: string }[]).map((c, i) => (
            <div key={i} className="absolute" style={{ left: c.l, top: c.t, width: 44, height: 44 }} />
          ))}
        </div>
      </div>

      {/* Ratio picker */}
      <div className="shrink-0 pt-4 pb-2"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 18px)' }}>
        <div className="flex justify-center gap-2 px-3 overflow-x-auto scrollbar-none">
          {RATIOS.map((r, i) => {
            const active = i === ratioIdx
            const iconW = r.w <= 0 ? 24 : r.w >= r.h ? 28 : Math.round(28 * r.w / r.h)
            const iconH = r.h <= 0 ? 22 : r.h >= r.w ? 26 : Math.round(26 * r.h / r.w)
            return (
              <button key={r.label} onClick={() => setRatioIdx(i)}
                className={cn(
                  'flex flex-col items-center gap-2 px-3 py-3 rounded-2xl transition-all duration-200 shrink-0 min-w-[58px]',
                  active ? 'bg-gold/15 border border-gold/50' : 'bg-white/5 border border-white/10 active:bg-white/10'
                )}>
                <div className="flex items-center justify-center" style={{ width: 32, height: 28 }}>
                  {r.w === -1
                    ? <div className={cn('border-[2px] border-dashed rounded', active ? 'border-gold' : 'border-white/40')}
                        style={{ width: 24, height: 24 }} />
                    : r.w === 0
                    ? <div className={cn('border-[2px] border-dashed rounded', active ? 'border-gold' : 'border-white/40')}
                        style={{
                          width:  natSize.w >= natSize.h ? 28 : Math.max(14, Math.round(28 * natSize.w / (natSize.h || 1))),
                          height: natSize.h >= natSize.w ? 26 : Math.max(12, Math.round(26 * natSize.h / (natSize.w || 1))),
                        }} />
                    : <div className={cn('border-[2px] rounded', active ? 'border-gold' : 'border-white/40')}
                        style={{ width: iconW, height: iconH }} />
                  }
                </div>
                <span className={cn('text-[10px] font-semibold tracking-wide leading-none',
                  active ? 'text-gold' : 'text-white/40')}>
                  {r.label}
                </span>
              </button>
            )
          })}
        </div>
        <p className="text-center text-[10px] text-white/25 mt-3 px-4">
          {isFree ? 'Drag corners or inside to move' : 'Pinch to zoom · drag to reposition'}
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
