import { useLocation } from 'wouter'
import { Camera } from 'lucide-react'

export default function NotFound() {
  const [, navigate] = useLocation()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-lenz-bg text-white px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-lenz-card border border-lenz-border flex items-center justify-center mb-6">
        <Camera size={28} className="text-white/20" />
      </div>
      <h1 className="text-5xl font-bold text-white/10 mb-2">404</h1>
      <p className="text-lg font-semibold text-white/60 mb-1">Out of frame</p>
      <p className="text-sm text-white/30 mb-8">This page doesn't exist.</p>
      <button onClick={() => navigate('/')} className="btn-primary">
        Back to Feed
      </button>
    </div>
  )
}
