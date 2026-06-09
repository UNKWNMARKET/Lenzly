import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Download } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const links = [
    { label: 'Features', href: '/#features' },
    { label: 'Community', href: '/feed' },
    { label: 'For Brands', href: '/brands' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-white/5 shadow-xl shadow-black/20' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-[17px] font-bold tracking-[0.25em] gold-text">LENZLY</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.label} href={l.href}
              className="text-sm text-white/50 hover:text-white transition-colors font-medium">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/brands" className="text-sm text-white/45 hover:text-[#C9A84C] transition-colors font-medium">Brand Login</Link>
          <a href="https://apps.apple.com" className="btn-gold text-xs py-2.5 px-5 gap-1.5">
            <Download size={13} />
            Download Free
          </a>
        </div>

        {/* Mobile */}
        <button onClick={() => setOpen(v => !v)} className="md:hidden text-white/50 hover:text-white transition-colors p-1">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-white/5 px-6 py-5 space-y-1">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}
              className="block text-sm text-white/60 hover:text-white py-3 border-b border-white/5 transition-colors">
              {l.label}
            </a>
          ))}
          <div className="pt-4">
            <a href="https://apps.apple.com" className="btn-gold w-full justify-center text-sm py-3.5 mt-1">
              <Download size={15} />
              Download Free on App Store
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
