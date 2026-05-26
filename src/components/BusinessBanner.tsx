import { Briefcase, ChevronRight, Building2 } from 'lucide-react'
import { Link } from 'wouter'

export default function BusinessBanner() {
  return (
    <Link href="/brands">
      <div className="mx-4 my-3 cursor-pointer group">
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-r from-lenz-card via-lenz-card2 to-lenz-card p-4">
          {/* Gold glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Building2 size={18} className="text-gold" />
              </div>
              <div>
                <p className="text-xs font-bold text-gold tracking-wider uppercase">For Brands</p>
                <p className="text-sm font-semibold text-white mt-0.5">Find & hire photographers</p>
                <p className="text-[11px] text-white/40 mt-0.5">WildScope · Maison Élite · Lumière use LENZLY</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gold/60 group-hover:text-gold transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}
