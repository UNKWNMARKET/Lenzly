/**
 * AppLogo — renders the LENZLY logo image.
 * Drop your logo file at:  public/logo.png
 * Falls back to the SVG icon if the PNG isn't there yet.
 */
interface AppLogoProps {
  /** Tailwind height class, e.g. "h-8", "h-10", "h-12" */
  className?: string
}

export default function AppLogo({ className = 'h-9' }: AppLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="LENZLY"
      className={`${className} w-auto object-contain`}
      onError={e => {
        // If PNG not found yet, fall back to the SVG icon + wordmark text
        const img = e.currentTarget
        img.style.display = 'none'
        const span = document.createElement('span')
        span.className = 'font-bold tracking-[0.2em] text-[#C9A84C]'
        span.style.fontSize = img.clientHeight > 0 ? `${img.clientHeight * 0.7}px` : '22px'
        span.textContent = 'LENZLY'
        img.parentNode?.insertBefore(span, img.nextSibling)
      }}
    />
  )
}
