import { Camera } from 'lucide-react'

// The LENZLY verified emblem: a gold camera in a filled circle.
// Pro / verified members get this badge next to their name.
export default function VerifiedBadge({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gold shrink-0 ${className}`}
      style={{ width: size + 6, height: size + 6 }}
      title="Verified Pro"
      aria-label="Verified Pro"
    >
      <Camera size={size - 2} className="text-lenz-bg" strokeWidth={2.5} />
    </span>
  )
}
