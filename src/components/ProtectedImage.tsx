import { useRef, useEffect } from 'react'

interface Props {
  src: string
  alt?: string
  className?: string
  style?: React.CSSProperties
  watermark?: string        // photographer's @username
  onClick?: () => void
}

/**
 * Drop-in replacement for <img> that:
 * 1. Blocks right-click / long-press save on iOS & web
 * 2. Overlays the photographer's username as a subtle watermark
 * 3. Disables native drag-and-drop saving
 */
export default function ProtectedImage({ src, alt = '', className, style, watermark, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const block = (e: Event) => e.preventDefault()

    // Block context menu (right-click / long-press)
    el.addEventListener('contextmenu', block, { passive: false })
    // Block iOS long-press callout (save to photos)
    el.addEventListener('touchstart', () => {}, { passive: true }) // iOS requires at least one passive listener first
    return () => {
      el.removeEventListener('contextmenu', block)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden select-none ${className ?? ''}`}
      style={style}
      onClick={onClick}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {/* The image — pointer-events none prevents iOS save sheet */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none', // disables iOS long-press "Save Image"
          pointerEvents: 'none',
        } as React.CSSProperties}
        draggable={false}
        onContextMenu={e => e.preventDefault()}
      />

      {/* Invisible tap layer so onClick still fires */}
      <div className="absolute inset-0" style={{ zIndex: 1 }} />

      {/* Watermark — subtle diagonal username */}
      {watermark && (
        <div
          className="absolute inset-0 flex items-end justify-end pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <span
            className="text-white/25 font-semibold select-none"
            style={{
              fontSize: '10px',
              letterSpacing: '0.05em',
              padding: '6px 8px',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            } as React.CSSProperties}
          >
            @{watermark}
          </span>
        </div>
      )}
    </div>
  )
}
