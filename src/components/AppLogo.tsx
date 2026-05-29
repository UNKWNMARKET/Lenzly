/**
 * AppLogo — renders the LENZLY logo.
 *
 * Uses /lenzly-wordmark.svg (already in public/) by default.
 * To swap in your own logo: replace public/lenzly-wordmark.svg with your file,
 * or drop public/logo.png and set src="/logo.png" below.
 */
interface AppLogoProps {
  /** Tailwind height class, e.g. "h-8", "h-10", "h-12" */
  className?: string
  /** 'wordmark' = icon + LENZLY text  |  'icon' = aperture icon only */
  variant?: 'wordmark' | 'icon'
}

export default function AppLogo({ className = 'h-9', variant = 'wordmark' }: AppLogoProps) {
  const src = variant === 'icon' ? '/lenzly-icon.svg' : '/lenzly-wordmark.svg'
  return (
    <img
      src={src}
      alt="LENZLY"
      className={`${className} w-auto object-contain`}
    />
  )
}
