import { Bell, MessageCircle } from 'lucide-react'
import { Toaster } from 'sonner'
import StoriesBar from '@/components/StoriesBar'
import PostCard from '@/components/PostCard'
import BusinessBanner from '@/components/BusinessBanner'
import { posts } from '@/data/mockData'

export default function Home() {
  return (
    <div className="min-h-screen bg-lenz-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center justify-between safe-top">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.15em] gold-text">LENZLY</h1>
          <p className="text-[9px] text-white/20 tracking-[0.3em] uppercase mt-0.5">Photography Platform</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <Bell size={20} className="text-white/60" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold border border-lenz-bg" />
          </button>
          <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <MessageCircle size={20} className="text-white/60" />
          </button>
        </div>
      </header>

      {/* Stories / AI Spots */}
      <div className="border-b border-lenz-border">
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase">Photo Spots</span>
            <span className="text-[9px] bg-gold/10 text-gold border border-gold/20 px-1.5 py-0.5 rounded-full font-bold tracking-widest">AI POWERED</span>
          </div>
        </div>
        <StoriesBar />
      </div>

      {/* Business Banner */}
      <BusinessBanner />

      {/* Feed */}
      <div className="mt-1">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: '#111111',
            border: '1px solid #1e1e1e',
            color: '#f5f5f5',
          },
        }}
      />
    </div>
  )
}
