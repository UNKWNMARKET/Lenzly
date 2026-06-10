import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const links = [
    { label: 'Features', href: '/#features' },
    { label: 'Community', href: '/feed' },
    { label: 'For Brands', href: '/brands' },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass shadow-2xl shadow-black/30' : 'bg-transparent'}`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[17px] font-black tracking-[0.25em] gold-text">LENZLY</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <a key={l.label} href={l.href}
                className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-white' : 'text-white/45 hover:text-white'}`}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/business/login" className="text-sm text-white/40 hover:text-[#ecc85c] transition-colors font-medium">Brand Login</Link>
            <a href="https://apps.apple.com" className="btn-gold text-xs py-2.5 px-5">
              <Download size={12} /> Download Free
            </a>
          </div>

          <button onClick={() => setOpen(v => !v)} className="md:hidden w-9 h-9 rounded-lg border border-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 glass border-b border-white/5 px-6 py-5"
          >
            <div className="space-y-1 mb-5">
              {links.map(l => (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-3 text-sm text-white/55 hover:text-white border-b border-white/5 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
            <a href="https://apps.apple.com" className="btn-gold w-full justify-center text-sm py-3.5">
              <Download size={15} /> Download Free on App Store
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
