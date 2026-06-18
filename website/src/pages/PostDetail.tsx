import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, MapPin, Download, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Post {
  id: string; image_url: string; caption: string | null; location_name: string | null
  likes_count: number; category: string; created_at: string
  profiles?: { id: string; name: string; username: string; avatar_url: string | null; is_pro: boolean }
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    // posts.user_id references auth.users (not profiles), so fetch the profile
    // separately and attach it client-side.
    supabase.from('posts').select('*').eq('id', id).single()
      .then(async ({ data }) => {
        if (data) {
          const { data: prof } = await supabase.from('profiles')
            .select('id, name, username, avatar_url, is_pro').eq('id', (data as any).user_id).single()
          setPost({ ...(data as any), profiles: prof ?? null } as Post)
        }
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#ecc85c]/20 border-t-[#ecc85c] animate-spin" />
    </div>
  )
  if (!post) return <div className="min-h-screen pt-24 text-center text-white/30 py-20">Post not found</div>

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/feed" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to feed
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-[#0E0E0E]">
            <img src={post.image_url} alt={post.caption ?? ''} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Photographer */}
            {post.profiles && (
              <Link to={`/photographer/${post.profiles.id}`} className="flex items-center gap-3 mb-6 group">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#141414]">
                  {post.profiles.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">{post.profiles.name?.[0]}</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white group-hover:text-[#ecc85c] transition-colors">{post.profiles.name}</span>
                    {post.profiles.is_pro && <><CheckCircle size={13} className="text-[#ecc85c]" /><span className="text-[9px] font-bold text-[#060606] bg-[#ecc85c] px-1.5 py-0.5 rounded-full">PRO</span></>}
                  </div>
                  <p className="text-xs text-white/40">@{post.profiles.username}</p>
                </div>
              </Link>
            )}

            {post.caption && <p className="text-sm text-white/70 leading-relaxed mb-5">{post.caption}</p>}

            <div className="flex flex-wrap gap-4 text-sm mb-5">
              <div className="flex items-center gap-1.5 text-white/40">
                <Heart size={14} />
                <span>{post.likes_count?.toLocaleString() ?? 0} likes</span>
              </div>
              {post.location_name && (
                <div className="flex items-center gap-1.5 text-white/40">
                  <MapPin size={14} />
                  <span>{post.location_name}</span>
                </div>
              )}
            </div>

            {post.category && (
              <span className="text-[10px] font-bold tracking-widest text-[#ecc85c]/50 uppercase border border-[#ecc85c]/20 px-3 py-1.5 rounded-full w-fit mb-6">
                {post.category}
              </span>
            )}

            <div className="mt-auto card p-5">
              <p className="text-xs text-white/40 mb-3">Want to see more work like this?</p>
              <a href="https://apps.apple.com" className="btn-gold w-full justify-center text-sm py-3">
                <Download size={14} /> Download Lenzly Free
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
