import { useState, useEffect } from 'react'
import { decryptImageUrl } from '@/lib/crypto'
import { Lock } from 'lucide-react'

interface Props {
  src: string
  convKey: CryptoKey | null
  className?: string
  style?: React.CSSProperties
}

/**
 * Displays a chat photo that was AES-GCM encrypted before upload.
 * Fetches the ciphertext, decrypts in-browser, renders via object URL.
 * The decrypted bytes never leave the device.
 */
export default function EncryptedImage({ src, convKey, className, style }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!convKey || !src) return
    let revoke: string | null = null
    decryptImageUrl(src, convKey)
      .then(url => { revoke = url; setObjectUrl(url) })
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
    <div className={`relative overflow-hidden rounded-xl ${className ?? ''}`} style={style}>
      <img
        src={objectUrl}
        alt="Encrypted photo"
        className="max-w-[200px] max-h-[260px] object-cover rounded-xl"
        style={{ WebkitTouchCallout: 'none', userSelect: 'none', pointerEvents: 'none' } as React.CSSProperties}
        draggable={false}
        onContextMenu={e => e.preventDefault()}
      />
      {/* Encryption badge */}
      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
        <Lock size={8} className="text-gold" />
        <span className="text-[8px] text-gold font-semibold">E2E</span>
      </div>
      {/* Invisible tap catcher */}
      <div className="absolute inset-0" />
    </div>
  )
}
