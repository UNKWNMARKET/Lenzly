import { useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MapPin, MoreHorizontal, CheckCircle } from 'lucide-react'
import { cn, formatCount, timeAgo } from '@/lib/utils'
import type { Post } from '@/data/mockData'

interface Props {
  post: Post
}

export default function PostCard({ post }: Props) {
  const [liked, setLiked] = useState(post.liked)
  const [bookmarked, setBookmarked] = useState(post.bookmarked)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [expanded, setExpanded] = useState(false)

  function handleLike() {
    setLiked(l => !l)
    setLikeCount(c => liked ? c - 1 : c + 1)
  }

  return (
    <article className="mb-1 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="story-ring cursor-pointer">
            <div className="w-[38px] h-[38px] rounded-full overflow-hidden border-2 border-lenz-bg">
              <img src={post.photographer.avatar} alt={post.photographer.name} className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{post.photographer.username}</span>
              {post.photographer.verified && (
                <CheckCircle size={13} className="text-gold fill-gold/20" />
              )}
              {post.photographer.pro && (
                <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full">PRO</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-gold" />
              <span className="text-[11px] text-white/40">{post.location}</span>
            </div>
          </div>
        </div>
        <button className="p-1 text-white/30 hover:text-white/60 transition-colors">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Photo */}
      <div className="relative overflow-hidden bg-lenz-card" style={{ aspectRatio: '4/5' }}>
        <img
          src={post.image}
          alt={post.caption}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Double-tap to like overlay */}
        <button
          className="absolute inset-0 w-full h-full"
          onDoubleClick={handleLike}
        />
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 group"
            >
              <Heart
                size={22}
                strokeWidth={1.8}
                className={cn(
                  'transition-all duration-200',
                  liked
                    ? 'text-red-500 fill-red-500 scale-110'
                    : 'text-white/70 group-hover:text-white'
                )}
              />
              <span className={cn('text-sm font-medium', liked ? 'text-red-400' : 'text-white/50')}>
                {formatCount(likeCount)}
              </span>
            </button>

            <button className="flex items-center gap-1.5 group">
              <MessageCircle size={22} strokeWidth={1.8} className="text-white/70 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium text-white/50">{formatCount(post.comments)}</span>
            </button>

            <button className="group">
              <Send size={22} strokeWidth={1.8} className="text-white/70 group-hover:text-white transition-colors" />
            </button>
          </div>

          <button
            onClick={() => setBookmarked(b => !b)}
            className="group"
          >
            <Bookmark
              size={22}
              strokeWidth={1.8}
              className={cn(
                'transition-all duration-200',
                bookmarked
                  ? 'text-gold fill-gold'
                  : 'text-white/70 group-hover:text-white'
              )}
            />
          </button>
        </div>

        {/* Caption */}
        <div className="space-y-1">
          <p className="text-sm leading-relaxed text-white/90">
            <span className="font-semibold mr-1">{post.photographer.username}</span>
            <span className={cn('text-white/70', !expanded && 'line-clamp-2')}>
              {post.caption}
            </span>
            {!expanded && post.caption.length > 80 && (
              <button onClick={() => setExpanded(true)} className="text-white/30 ml-1 text-sm">more</button>
            )}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-1">
            {post.tags.map(tag => (
              <span key={tag} className="text-[11px] text-gold/60 font-medium">{tag}</span>
            ))}
          </div>

          <p className="text-[11px] text-white/25 mt-2 tracking-wide">{timeAgo(post.timestamp)}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-lenz-border mx-4" />
    </article>
  )
}
