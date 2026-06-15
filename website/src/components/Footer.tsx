import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
}
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

export default function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={stagger}
      className="border-t border-white/5 mt-8"
    >
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <motion.div variants={fadeUp} className="col-span-2">
            <motion.p
              className="text-[17px] font-black tracking-[0.25em] gold-text mb-4"
              whileHover={{ letterSpacing: '0.3em' }}
              transition={{ duration: 0.3 }}
            >LENZLY</motion.p>
            <p className="text-sm text-white/30 leading-relaxed mb-6 max-w-xs">The photography platform built by photographers, for photographers. Free forever.</p>
            <motion.a
              href="https://apps.apple.com"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-gold text-xs py-2.5 px-5 w-fit"
            >
              <Download size={12} /> Download on App Store
            </motion.a>
          </motion.div>

          {[
            {
              heading: 'Product',
              links: [['Features', '/#features'], ['Community Feed', '/feed'], ['For Brands', '/brands'], ['Download', 'https://apps.apple.com']],
            },
            {
              heading: 'Company',
              links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Brand Portal', '/brands']],
            },
            {
              heading: 'Follow',
              links: [['Instagram', 'https://instagram.com'], ['Twitter / X', 'https://x.com'], ['TikTok', 'https://tiktok.com']],
              external: true,
            },
          ].map(col => (
            <motion.div key={col.heading} variants={fadeUp}>
              <p className="text-[11px] font-bold text-white/20 tracking-widest uppercase mb-5">{col.heading}</p>
              <ul className="space-y-3">
                {col.links.map(([l, h]) => (
                  <li key={l}>
                    {col.external
                      ? <a href={h as string} target="_blank" rel="noreferrer" className="text-sm text-white/40 hover:text-white transition-colors hover:translate-x-0.5 inline-block transition-transform duration-200">{l}</a>
                      : h.startsWith('/') ? <Link to={h as string} className="text-sm text-white/40 hover:text-white transition-colors hover:translate-x-0.5 inline-block transition-transform duration-200">{l}</Link>
                      : <a href={h as string} className="text-sm text-white/40 hover:text-white transition-colors">{l}</a>
                    }
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={fadeUp}
          className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
        >
          <p className="text-xs text-white/15">© 2026 Lenzly. All rights reserved.</p>
          <p className="text-xs text-white/15">Available on the App Store · Free · iOS</p>
        </motion.div>
      </div>
    </motion.footer>
  )
}
