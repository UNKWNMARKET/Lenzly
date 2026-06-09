import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-8">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2">
            <p className="text-[17px] font-black tracking-[0.25em] gold-text mb-4">LENZLY</p>
            <p className="text-sm text-white/30 leading-relaxed mb-6 max-w-xs">The photography platform built by photographers, for photographers. Free forever.</p>
            <a href="https://apps.apple.com" className="btn-gold text-xs py-2.5 px-5 w-fit">
              <Download size={12} /> Download on App Store
            </a>
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/20 tracking-widest uppercase mb-5">Product</p>
            <ul className="space-y-3">
              {[['Features', '/#features'], ['Community Feed', '/feed'], ['For Brands', '/brands'], ['Download', 'https://apps.apple.com']].map(([l, h]) => (
                <li key={l}><a href={h} className="text-sm text-white/40 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/20 tracking-widest uppercase mb-5">Company</p>
            <ul className="space-y-3">
              {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Brand Portal', '/brands']].map(([l, h]) => (
                <li key={l}><Link to={h} className="text-sm text-white/40 hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/20 tracking-widest uppercase mb-5">Follow</p>
            <ul className="space-y-3">
              {[['Instagram', 'https://instagram.com'], ['Twitter / X', 'https://x.com'], ['TikTok', 'https://tiktok.com']].map(([l, h]) => (
                <li key={l}><a href={h} target="_blank" rel="noreferrer" className="text-sm text-white/40 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/15">© 2026 Lenzly. All rights reserved.</p>
          <p className="text-xs text-white/15">Available on the App Store · Free · iOS</p>
        </div>
      </div>
    </footer>
  )
}
