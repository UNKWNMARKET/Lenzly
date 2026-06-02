import { useRef, useState } from 'react'

interface Props {
  src: string
  alt?: string
  className?: string
}

export default function ZoomableImage({ src, alt = '', className = '' }: Props) {
  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [imgError, setImgError] = useState(false)

  const initialDist = useRef<number | null>(null)
  const initialScale = useRef(1)
  const initialMidX = useRef(0)
  const initialMidY = useRef(0)
  const initialTx = useRef(0)
  const initialTy = useRef(0)

  const dist = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDist.current = dist(e.touches)
      initialScale.current = scale
      initialMidX.current = (e.touches[0].clientX + e.touches[1].clientX) / 2
      initialMidY.current = (e.touches[0].clientY + e.touches[1].clientY) / 2
      initialTx.current = translateX
      initialTy.current = translateY
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDist.current !== null) {
      e.preventDefault()
      const newScale = Math.min(4, Math.max(1, (dist(e.touches) / initialDist.current) * initialScale.current))
      setScale(newScale)
      if (newScale <= 1) {
        setTranslateX(0)
        setTranslateY(0)
      }
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialDist.current = null
      if (scale < 1.1) {
        setScale(1)
        setTranslateX(0)
        setTranslateY(0)
      }
    }
  }

  if (imgError) {
    return (
      <div className={`${className} bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center`}>
        <span className="text-white/10 text-xs">Image unavailable</span>
      </div>
    )
  }

  return (
    <div
      className={`${className} overflow-hidden`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-150"
        style={{ transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)` }}
        draggable={false}
        onError={() => setImgError(true)}
      />
    </div>
  )
}
