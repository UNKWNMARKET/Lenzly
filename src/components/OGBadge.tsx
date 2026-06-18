interface OGBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Exclusive OG Shield badge for the first 100 Lenzly founding members.
 * Hangs off the bottom-right corner of a profile picture.
 */
export default function OGBadge({ size = 'sm', className }: OGBadgeProps) {
  const w = size === 'lg' ? 30 : size === 'md' ? 23 : 17
  const h = Math.round(w * 1.15)

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 30 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' }}
    >
      {/* Shield outline / border */}
      <path
        d="M15 1 L28 6.5 L28 18 C28 25.5 21.5 31.5 15 34 C8.5 31.5 2 25.5 2 18 L2 6.5 Z"
        fill="#7A5C10"
      />
      {/* Shield gold fill */}
      <path
        d="M15 3 L26.5 8 L26.5 18 C26.5 24.8 20.5 30.2 15 32.5 C9.5 30.2 3.5 24.8 3.5 18 L3.5 8 Z"
        fill="#C9A84C"
      />
      {/* Shield inner dark face */}
      <path
        d="M15 5.5 L24.5 9.5 L24.5 18 C24.5 23.8 19.5 28.5 15 30.5 C10.5 28.5 5.5 23.8 5.5 18 L5.5 9.5 Z"
        fill="#1C1407"
      />
      {/* OG text */}
      <text
        x="15"
        y="22"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="9"
        fontWeight="bold"
        fill="#C9A84C"
        letterSpacing="0.5"
      >
        OG
      </text>
      {/* Star accent at top */}
      <polygon
        points="15,4 15.8,6.5 18.5,6.5 16.3,8.1 17.1,10.5 15,9 12.9,10.5 13.7,8.1 11.5,6.5 14.2,6.5"
        fill="#E8C96A"
        opacity="0.95"
      />
    </svg>
  )
}
