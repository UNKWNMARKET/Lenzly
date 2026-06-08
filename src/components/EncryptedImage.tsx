import { useState, useEffect } from 'react'
import { decryptImageUrl } from '@/lib/crypto'
import { Lock, X, ZoomIn } from 'lucide-react'

interface Props {
  src: string
  convKey: CryptoKey | null
  className?: string
  style?: React.CSSProperties
}

function PhotoLightbox({ objectUrl, onClose }: { objectUrl: string; onClose: () => void }) {
  // Close on backdrop tap
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center z-10"
        onClick={onClose}
      >
        <X size={18} className="text-white" />
      </button>

      {/* E2E badge */}
      <div className="absolute top-5 left-5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur border border-gold/20 z-10">
        <Lock size={10} className="text-gold" />
        <span className="text-[10px] text-gold font-semibold tracking-wide">End-to-end encrypted</span>
      </div>

      {/* Photo — stops propagation so tapping the image itself doesn't close */}
      <img
        src={objectUrl}
        alt="Photo"
        className="max-w-[92vw] max-h-[82vh] rounded-2xl shadow-2xl shadow-black/60 object-contain"
        draggable={false}
        onContextMenu={e => e.preventDefault()}
        onClick={e => e.stopPropagation()}
        style={{ WebkitTouchCallout: 'none', userSelect: 'none' } as React.CSSProperties}
      />
    </div>
  )
}

export default function EncryptedImage({ src, convKey, className, style }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!convKey || !src) return
    decryptImageUrl(src, convKey, 'image/jpeg')
      .then(url => setObjectUrl(url))
      .catch(() => setError(true))
    return () => { /* object URL lives in cache, cleaned up on unmount of whole chat */ }
  }, [src, convKey])

  if (error) return (
    <div className="w-48 h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
      <span className="text-white/30 text-xs">Failed to decrypt</span>
    </div>
  )

  if (!objectUrl) return (
    <div className="w-48 h-32 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2">
      <Lock size={14} className="text-gold/50 animate-pulse" />
      <span className="text-white/30 text-xs">Decrypting…</span>
    </div>
  )

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-xl cursor-pointer active:scale-[0.97] transition-transform ${className ?? ''}`}
        style={style}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={objectUrl}
          alt="Encrypted photo"
          className="max-w-[200px] max-h-[260px] object-cover rounded-xl"
          draggable={false}
          onContextMenu={e => e.preventDefault()}
          style={{ WebkitTouchCallout: 'none', userSelect: 'none', display: 'block' } as React.CSSProperties}
        />
        {/* Tap-to-expand hint */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
            <ZoomIn size={14} className="text-white" />
          </div>
        </div>
        {/* Encryption badge */}
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
          <Lock size={8} className="text-gold" />
          <span className="text-[8px] text-gold font-semibold">E2E</span>
        </div>
      </div>

      {lightboxOpen && (
        <PhotoLightbox objectUrl={objectUrl} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  )
}
