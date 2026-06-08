import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  progress: number   // 0–100
  visible: boolean
  label?: string
}

export default function UploadProgressBar({ progress, visible, label = 'Uploading…' }: Props) {
  const [show, setShow] = useState(false)

  // Small delay on mount so the bar slides in smoothly
  useEffect(() => {
    if (visible) setShow(true)
  }, [visible])

  if (!show) return null

  const pct = Math.min(100, Math.max(0, progress))
  const done = pct >= 100

  return (
    <div className={cn(
      'fixed inset-x-0 top-0 z-[80] transition-opacity duration-300',
      visible ? 'opacity-100' : 'opacity-0'
    )}>
      {/* Thin top bar */}
      <div className="h-[3px] w-full bg-white/8 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            done ? 'bg-green-400' : 'bg-gradient-to-r from-gold via-amber-400 to-gold'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Pill badge */}
      <div className="flex justify-center mt-3 pointer-events-none">
        <div className={cn(
          'flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl border shadow-lg shadow-black/40 transition-all duration-300',
          done
            ? 'bg-green-500/15 border-green-500/30'
            : 'bg-black/70 border-white/10'
        )}>
          {!done && (
            <div className="relative w-3.5 h-3.5 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 14 14">
                <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                <circle
                  cx="7" cy="7" r="5.5" fill="none"
                  stroke="rgb(201,168,76)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 5.5}`}
                  strokeDashoffset={`${2 * Math.PI * 5.5 * (1 - pct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
                />
              </svg>
            </div>
          )}
          {done && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <path d="M2.5 7L6 10.5L11.5 4" stroke="rgb(74,222,128)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <span className={cn(
            'text-[12px] font-semibold tracking-wide',
            done ? 'text-green-400' : 'text-white/90'
          )}>
            {done ? 'Upload complete' : `${label} ${pct}%`}
          </span>
        </div>
      </div>
    </div>
  )
}
