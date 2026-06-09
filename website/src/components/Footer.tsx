import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2">
            <p className="text-[17px] font-bold tracking-[0.25em] gold-text mb-3">LENZLY</p>
            <p className="text-sm text-white/35 leading-relaxed mb-6 max-w-xs">The photography platform built by photographers, for photographers. Free forever.</p>
            <a href="https://apps.apple.com" className="btn-gold text-xs py-2.5 px-5 gap-1.5 w-fit">
              <Download size={13} />
              Download on App Store
            </a>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white/25 tracking-widest uppercase mb-5">Product</p>
            <ul className="space-y-3">
              {[['Features', '/#features'], ['Community Feed', '/feed'], ['For Brands', '/brands'], ['Download', 'https://apps.apple.com']].map(([l, h]) => (
                <li key={l}><a href={h} className="text-sm text-white/45 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white/25 tracking-widest uppercase mb-5">Company</p>
            <ul className="space-y-3">
              {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Brand Portal', '/brands']].map(([l, h]) => (
                <li key={l}><Link to={h} className="text-sm text-white/45 hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-white/25 tracking-widest uppercase mb-5">Follow</p>
            <ul className="space-y-3">
              <li>
                <a href="https://instagram.com/lenzly" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors">
                  📷 Instagram
                </a>
              </li>
              <li>
                <a href="https://x.com/lenzly" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors">
                  𝕏 Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20">© 2026 Lenzly. All rights reserved.</p>
          <p className="text-xs text-white/20">Available on the App Store · Free · iOS</p>
        </div>
      </div>
    </footer>
  )
}
