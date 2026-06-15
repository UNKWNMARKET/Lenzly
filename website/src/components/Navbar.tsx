import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.email?.toLowerCase() === 'eisdorferjesse@gmail.com'

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
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-8 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass shadow-2xl shadow-black/30' : 'bg-[#0b0b0d]/80 backdrop-blur-md border-b border-white/[0.04]'}`}
      >
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.span
              className="text-[17px] font-black tracking-[0.25em] gold-text"
              whileHover={{ letterSpacing: '0.3em' }}
              transition={{ duration: 0.3 }}
            >
              LENZLY
            </motion.span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {links.map((l, i) => (
              <motion.a
                key={l.label}
                href={l.href}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="nav-link text-sm font-medium transition-colors text-white/45 hover:text-white"
              >
                {l.label}
              </motion.a>
            ))}
          </div>

          {/* Desktop actions */}
          <motion.div
            className="hidden md:flex items-center gap-5"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isAdmin && (
              <Link to="/admin" className="text-sm text-[#ecc85c]/70 hover:text-[#ecc85c] transition-colors font-medium">Admin</Link>
            )}
            <Link to="/login" className="text-sm text-white/40 hover:text-white transition-colors font-medium">Login</Link>
            <Link to="/business/login" className="text-sm text-white/40 hover:text-[#ecc85c] transition-colors font-medium">Brand Login</Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/signup" className="btn-gold text-xs py-2.5 px-5">
                <Download size={12} /> Join Free
              </Link>
            </motion.div>
          </motion.div>

          {/* Mobile hamburger */}
          <motion.button
            onClick={() => setOpen(v => !v)}
            whileTap={{ scale: 0.9 }}
            className="md:hidden w-9 h-9 rounded-lg border border-white/8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open
                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X size={18} /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu size={18} /></motion.div>
              }
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.97 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ originY: 0 }}
            className="fixed top-[88px] left-0 right-0 z-40 glass border-b border-white/5 px-6 py-5"
          >
            <div className="space-y-1 mb-5">
              {links.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between py-3 text-sm text-white/55 hover:text-white border-b border-white/5 transition-colors"
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }} className="flex gap-4 pt-1">
                <Link to="/login" onClick={() => setOpen(false)} className="py-3 text-sm text-white/55 hover:text-white transition-colors">Login</Link>
                <Link to="/business/login" onClick={() => setOpen(false)} className="py-3 text-sm text-[#ecc85c]/60 hover:text-[#ecc85c] transition-colors">Brand Login</Link>
              </motion.div>
            </div>
            <motion.a
              href="https://apps.apple.com"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="btn-gold w-full justify-center text-sm py-3.5"
            >
              <Download size={15} /> Download Free on App Store
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
