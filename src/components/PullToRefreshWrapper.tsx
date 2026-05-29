import { RefObject } from 'react'

interface Props {
  scrollRef: RefObject<HTMLDivElement>
  pullY: number
  refreshing: boolean
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  children: React.ReactNode
  className?: string
}

export default function PullToRefreshWrapper({
  scrollRef, pullY, refreshing,
  onTouchStart, onTouchMove, onTouchEnd,
  children, className = '',
}: Props) {
  const threshold = 72
  const progress  = Math.min(pullY / threshold, 1)
  const show      = pullY > 4 || refreshing

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        style={{
          height: refreshing ? 52 : pullY,
          transition: pullY === 0 ? 'height 0.25s ease' : 'none',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {show && (
          <div
            style={{
              opacity: refreshing ? 1 : progress,
              transform: `scale(${0.5 + progress * 0.5})`,
              transition: refreshing ? 'opacity 0.15s' : 'none',
            }}
            className="flex flex-col items-center gap-1"
          >
            {refreshing ? (
              <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            ) : (
              <svg
                width="20" height="20" viewBox="0 0 20 20" fill="none"
                style={{ transform: `rotate(${progress * 360}deg)` }}
              >
                <path
                  d="M10 3.5A6.5 6.5 0 1 0 16.5 10"
                  stroke="#c9a84c"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeOpacity={progress}
                />
                <path
                  d="M16.5 3.5 L16.5 7 L13 7"
                  stroke="#c9a84c"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={progress}
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {children}
    </div>
  )
}
