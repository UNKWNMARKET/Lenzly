import { useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MapPin, MoreHorizontal, CheckCircle, X, Link as LinkIcon, Flag } from 'lucide-react'
import { cn, formatCount, timeAgo } from '@/lib/utils'
import { useLocation } from 'wouter'
import { toast } from 'sonner'
import type { Post } from '@/data/mockData'

interface Props {
  post: Post
}

// Mock comments for display
const getMockComments = (username: string) => [
  { id: 1, user: 'elena.k', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80&auto=format&fit=crop', text: 'Absolutely stunning shot! 🔥', time: '2h' },
  { id: 2, user: 'marco_vis', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80&auto=format&fit=crop', text: 'The light here is incredible. What time was this?', time: '4h' },
  { id: 3, user: username, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&auto=format&fit=crop', text: 'Golden hour just before sunset 🌅', time: '4h' },
]

export default function PostCard({ post }: Props) {
  const [, navigate] = useLocation()
  const [liked, setLiked] = useState(post.liked)
  const [bookmarked, setBookmarked] = useState(post.bookmarked)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [commentText, setCommentText] = useState('')

  function handleLike() {
    setLiked(l => !l)
    setLikeCount(c => liked ? c - 1 : c + 1)
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: post.photographer.username, text: post.caption, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied!')
    setShowMore(false)
  }

  function handleReport() {
    toast.info("Post reported. We'll review it shortly.")
    setShowMore(false)
  }

  function goToProfile() {
    navigate(`/photographer/${post.photographer.id}`)
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    toast.success('Comment posted!')
    setCommentText('')
  }

  const comments = getMockComments(post.photographer.username)

  return (
    <article className="mb-1 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button className="flex items-center gap-3" onClick={goToProfile}>
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
        </button>
        <button
          className="p-1 text-white/30 hover:text-white/60 transition-colors"
          onClick={() => setShowMore(true)}
        >
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
        <button
          className="absolute inset-0 w-full h-full"
          onDoubleClick={handleLike}
        />
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1.5 group">
              <Heart
                size={22}
                strokeWidth={1.8}
                className={cn(
                  'transition-all duration-200',
                  liked ? 'text-red-500 fill-red-500 scale-110' : 'text-white/70 group-hover:text-white'
                )}
              />
              <span className={cn('text-sm font-medium', liked ? 'text-red-400' : 'text-white/50')}>
                {formatCount(likeCount)}
              </span>
            </button>

            <button
              className="flex items-center gap-1.5 group"
              onClick={() => setShowComments(c => !c)}
            >
              <MessageCircle
                size={22}
                strokeWidth={1.8}
                className={cn('transition-colors', showComments ? 'text-gold' : 'text-white/70 group-hover:text-white')}
              />
              <span className="text-sm font-medium text-white/50">{formatCount(post.comments)}</span>
            </button>

            <button className="group" onClick={handleShare}>
              <Send size={22} strokeWidth={1.8} className="text-white/70 group-hover:text-white transition-colors" />
            </button>
          </div>

          <button onClick={() => setBookmarked(b => !b)} className="group">
            <Bookmark
              size={22}
              strokeWidth={1.8}
              className={cn(
                'transition-all duration-200',
                bookmarked ? 'text-gold fill-gold' : 'text-white/70 group-hover:text-white'
              )}
            />
          </button>
        </div>

        {/* Caption */}
        <div className="space-y-1">
          <p className="text-sm leading-relaxed text-white/90">
            <button className="font-semibold mr-1 hover:text-gold transition-colors" onClick={goToProfile}>
              {post.photographer.username}
            </button>
            <span className={cn('text-white/70', !expanded && 'line-clamp-2')}>
              {post.caption}
            </span>
            {!expanded && post.caption.length > 80 && (
              <button onClick={() => setExpanded(true)} className="text-white/30 ml-1 text-sm">more</button>
            )}
          </p>

          <div className="flex flex-wrap gap-1 mt-1">
            {post.tags.map(tag => (
              <span key={tag} className="text-[11px] text-gold/60 font-medium">{tag}</span>
            ))}
          </div>

          <p className="text-[11px] text-white/25 mt-2 tracking-wide">{timeAgo(post.timestamp)}</p>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-lenz-border/50 px-4 pb-4 pt-3 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-lenz-border shrink-0">
                <img src={c.avatar} alt={c.user} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-white">{c.user}</span>
                  <span className="text-[10px] text-white/25">{c.time}</span>
                </div>
                <p className="text-sm text-white/70 leading-snug mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}

          {/* Add comment */}
          <form onSubmit={submitComment} className="flex items-center gap-2 pt-1">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-lenz-card border border-lenz-border rounded-full px-4 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="text-gold text-sm font-semibold disabled:opacity-30 transition-opacity"
            >
              Post
            </button>
          </form>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-lenz-border mx-4" />

      {/* More options bottom sheet */}
      {showMore && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        >
          <div
            className="w-full max-w-[430px] md:max-w-[600px] mx-auto bg-lenz-card rounded-t-3xl border-t border-lenz-border pb-10 safe-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mt-3 mb-4" />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 w-full px-5 py-4 border-b border-lenz-border/50 hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <LinkIcon size={16} className="text-white/50" />
              </div>
              <span className="text-sm font-medium text-white">Copy Link</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-3 w-full px-5 py-4 border-b border-lenz-border/50 hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <Send size={16} className="text-white/50" />
              </div>
              <span className="text-sm font-medium text-white">Share Post</span>
            </button>
            <button
              onClick={goToProfile}
              className="flex items-center gap-3 w-full px-5 py-4 border-b border-lenz-border/50 hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <CheckCircle size={16} className="text-white/50" />
              </div>
              <span className="text-sm font-medium text-white">View Profile</span>
            </button>
            <button
              onClick={handleReport}
              className="flex items-center gap-3 w-full px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Flag size={16} className="text-red-400" />
              </div>
              <span className="text-sm font-medium text-red-400">Report Post</span>
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
