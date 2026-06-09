import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, MapPin } from 'lucide-react'
import { supabase, type Post } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { timeAgo, formatCount, cn } from '../../lib/utils'

export default function PostCard({ post, liked: initLiked, saved: initSaved }: { post: Post; liked?: boolean; saved?: boolean }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(!!initLiked)
  const [likes, setLikes] = useState(post.likes_count ?? 0)
  const [saved, setSaved] = useState(!!initSaved)
  const p = post.profiles

  async function toggleLike() {
    if (!user) return
    const next = !liked
    setLiked(next); setLikes(l => l + (next ? 1 : -1))
    if (next) await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
    else await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
  }
  async function toggleSave() {
    if (!user) return
    const next = !saved
    setSaved(next)
    if (next) await supabase.from('saved_posts').insert({ post_id: post.id, user_id: user.id })
    else await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', user.id)
  }

  return (
    <article className="card overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-3 p-3.5">
        <Link to={`/app/u/${p?.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-lenz-card2 border border-white/10 shrink-0">
            {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> :
              <div className="w-full h-full flex items-center justify-center text-gold/50 font-bold text-sm">{p?.name?.[0]}</div>}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white truncate">{p?.name}</span>
              {p?.is_pro && <span className="text-[8px] font-black text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
            </div>
            <p className="text-xs text-white/35">{timeAgo(post.created_at)}{post.location_name ? ` · ${post.location_name}` : ''}</p>
          </div>
        </Link>
      </div>

      {/* image */}
      <Link to={`/app/post/${post.id}`} className="block relative aspect-square bg-black">
        <img src={post.image_url} alt={post.caption ?? ''} className="w-full h-full object-cover" loading="lazy" />
      </Link>

      {/* actions */}
      <div className="p-3.5">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={toggleLike} className="flex items-center gap-1.5 transition-transform active:scale-90">
            <Heart size={22} className={cn(liked ? 'text-red-500 fill-red-500' : 'text-white/70')} />
            <span className="text-sm text-white/70">{formatCount(likes)}</span>
          </button>
          <Link to={`/app/post/${post.id}`} className="flex items-center gap-1.5 text-white/70">
            <MessageCircle size={21} />
            <span className="text-sm">{formatCount(post.comments_count ?? 0)}</span>
          </Link>
          <button onClick={toggleSave} className="ml-auto transition-transform active:scale-90">
            <Bookmark size={21} className={cn(saved ? 'text-gold fill-gold' : 'text-white/70')} />
          </button>
        </div>
        {post.caption && (
          <p className="text-sm text-white/80 leading-relaxed">
            <Link to={`/app/u/${p?.username}`} className="font-semibold text-white mr-1.5">{p?.username}</Link>
            {post.caption}
          </p>
        )}
        {post.location_name && (
          <div className="flex items-center gap-1 mt-2 text-xs text-white/30">
            <MapPin size={11} className="text-gold/50" /> {post.location_name}
          </div>
        )}
      </div>
    </article>
  )
}
