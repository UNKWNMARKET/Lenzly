import { useState } from 'react'
import { Search, Heart, MessageCircle, Bookmark, Flag } from 'lucide-react'
import { posts } from '@/data/mockData'
import { toast } from 'sonner'

export default function AdminPosts() {
  const [q, setQ] = useState('')
  const [flagged, setFlagged] = useState<Set<string>>(new Set())

  const filtered = posts.filter(p =>
    p.photographer.name.toLowerCase().includes(q.toLowerCase()) ||
    p.caption.toLowerCase().includes(q.toLowerCase()) ||
    p.location.toLowerCase().includes(q.toLowerCase())
  )

  function toggleFlag(id: string) {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast.success('Flag removed')
      } else {
        next.add(id)
        toast.success('Post flagged for review')
      }
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Posts</h1>
        <p className="text-xs text-white/40 mt-0.5">{posts.length} posts</p>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search posts…"
          className="w-full bg-[#111] border border-[#1e1e1e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm">No posts found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div
              key={p.id}
              className={`bg-[#111] border rounded-2xl overflow-hidden transition-colors ${
                flagged.has(p.id) ? 'border-red-900/50' : 'border-[#1e1e1e]'
              }`}
            >
              <div className="flex gap-3 p-4">
                <img src={p.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <img src={p.photographer.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    <p className="text-xs font-semibold text-white truncate">{p.photographer.name}</p>
                    {flagged.has(p.id) && (
                      <span className="text-[10px] bg-red-950/40 text-red-400 px-1.5 py-0.5 rounded ml-auto">
                        Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">{p.caption}</p>
                  <p className="text-[10px] text-white/30 mt-1">{p.location}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <Heart size={9} /> {p.likes.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <MessageCircle size={9} /> {p.comments.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      <Bookmark size={9} /> {p.bookmarked ? '1' : '0'}
                    </span>
                    <button
                      onClick={() => toggleFlag(p.id)}
                      className={`ml-auto p-1 rounded-lg transition-all ${
                        flagged.has(p.id)
                          ? 'text-red-400 bg-red-950/20'
                          : 'text-white/20 hover:text-red-400 hover:bg-red-950/20'
                      }`}
                      title={flagged.has(p.id) ? 'Unflag' : 'Flag for review'}
                    >
                      <Flag size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
