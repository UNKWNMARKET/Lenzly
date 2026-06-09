import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold tracking-[0.2em] gold-text mb-3">LENZLY</p>
            <p className="text-sm text-white/40 leading-relaxed">The photography platform built by photographers, for photographers.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 tracking-widest uppercase mb-4">Product</p>
            <ul className="space-y-2.5">
              {[['Features', '/#features'], ['Community Feed', '/feed'], ['For Brands', '/brands'], ['Download', 'https://apps.apple.com']].map(([l, h]) => (
                <li key={l}><a href={h} className="text-sm text-white/50 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 tracking-widest uppercase mb-4">Company</p>
            <ul className="space-y-2.5">
              {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Brand Portal', '/brands']].map(([l, h]) => (
                <li key={l}><Link to={h} className="text-sm text-white/50 hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 tracking-widest uppercase mb-4">Follow</p>
            <ul className="space-y-2.5">
              {[['Instagram', 'https://instagram.com/lenzly'], ['Twitter / X', 'https://x.com/lenzly']].map(([l, h]) => (
                <li key={l}><a href={h} target="_blank" rel="noreferrer" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20">© 2026 Lenzly. All rights reserved.</p>
          <p className="text-xs text-white/20">Available on the App Store · Free</p>
        </div>
      </div>
    </footer>
  )
}
