import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  // const { pathname } = useLocation()

  const links = [
    { label: 'Features', href: '/#features' },
    { label: 'Community', href: '/feed' },
    { label: 'For Brands', href: '/brands' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-[0.2em] gold-text">LENZLY</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.label} href={l.href} className="text-sm text-white/50 hover:text-white transition-colors">{l.label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/brands#login" className="text-sm text-white/50 hover:text-[#C9A84C] transition-colors">Brand Login</Link>
          <a href="https://apps.apple.com" className="btn-gold text-xs py-2.5 px-5">Download Free</a>
        </div>

        {/* Mobile */}
        <button onClick={() => setOpen(v => !v)} className="md:hidden text-white/50">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-white/5 px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block text-sm text-white/60 py-2">{l.label}</a>
          ))}
          <a href="https://apps.apple.com" className="btn-gold w-full justify-center text-sm py-3 mt-2">Download Free on App Store</a>
        </div>
      )}
    </nav>
  )
}
