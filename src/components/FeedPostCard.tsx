import { useState, useEffect, useRef } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MapPin, MoreVertical, Trash2, Archive } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import SharePostSheet from './SharePostSheet'

export type FeedPost = {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  location_name: string | null
  tags: string[]
  likes_count: number
  comments_count: number
  category: string
  created_at: string
  archived?: boolean
  profile: { id: string; username: string | null; name: string | null; avatar_url: string | null; is_pro: boolean } | null
}

type Comment = {
  id: string
  text: string
  created_at: string
  user_id: string
  profiles: { username: string | null; name: string | null; avatar_url: string | null } | null
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function FeedPostCard({
  post, currentUserId, onDeleted,
}: {
  post: FeedPost
  currentUserId: string | null
  onDeleted?: (id: string) => void
}) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0)
  const [saved, setSaved] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isOwner = currentUserId === post.user_id
  const profile = post.profile

  // Load the viewer's like/save state for this post
  useEffect(() => {
    if (!currentUserId) return
    let active = true
    ;(async () => {
      const [{ data: likeData }, { data: saveData }] = await Promise.all([
        supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle(),
        supabase.from('saved_posts').select('id').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle(),
      ])
      if (!active) return
      setLiked(!!likeData)
      setSaved(!!saveData)
    })()
    return () => { active = false }
  }, [post.id, currentUserId])

  const toggleLike = async () => {
    if (!currentUserId) { toast.error('Sign in to like posts'); return }
    const next = !liked
    setLiked(next)
    setLikesCount(c => next ? c + 1 : Math.max(0, c - 1))
    if (next) {
      const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setLiked(!next); setLikesCount(c => next ? c - 1 : c + 1); toast.error('Could not like post'); return }
      await supabase.from('posts').update({ likes_count: likesCount + 1 }).eq('id', post.id)
    } else {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      await supabase.from('posts').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', post.id)
    }
  }

  const toggleSave = async () => {
    if (!currentUserId) { toast.error('Sign in to save posts'); return }
    const next = !saved
    setSaved(next)
    if (next) {
      const { error } = await supabase.from('saved_posts').insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setSaved(!next); toast.error('Could not save post'); return }
      toast.success('Saved')
    } else {
      await supabase.from('saved_posts').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      toast.success('Removed from saved')
    }
  }

  const openComments = async () => {
    setShowComments(true)
    const { data } = await supabase
      .from('comments')
      .select('id, text, created_at, user_id, profiles(username, name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .limit(100)
    setComments((data ?? []) as unknown as Comment[])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const submitComment = async () => {
    if (!currentUserId) { toast.error('Sign in to comment'); return }
    if (!commentText.trim()) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: currentUserId, text: commentText.trim() })
      .select('id, text, created_at, user_id, profiles(username, name, avatar_url)')
      .single()
    if (error) { toast.error('Could not post comment'); setSubmitting(false); return }
    if (data) {
      setComments(prev => [...prev, data as unknown as Comment])
      setCommentsCount(c => c + 1)
      await supabase.from('posts').update({ comments_count: commentsCount + 1 }).eq('id', post.id)
      setCommentText('')
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!currentUserId) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id).eq('user_id', currentUserId)
    if (error) { toast.error('Could not delete'); return }
    toast.success('Post deleted')
    onDeleted?.(post.id)
  }

  const handleArchive = async () => {
    if (!currentUserId) return
    const { error } = await supabase.from('posts').update({ archived: true }).eq('id', post.id).eq('user_id', currentUserId)
    if (error) { toast.error('Could not archive'); return }
    toast.success('Post archived')
    onDeleted?.(post.id)
  }

  return (
    <article className="border-b border-lenz-border" onClick={() => menuOpen && setMenuOpen(false)}>
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-lenz-card border border-lenz-border shrink-0">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-sm">{(profile?.name || '?')[0].toUpperCase()}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white truncate">{profile?.username || profile?.name || 'Photographer'}</p>
            {profile?.is_pro && <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
          </div>
          {post.location_name && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-gold shrink-0" />
              <p className="text-[11px] text-white/40 truncate">{post.location_name}</p>
            </div>
          )}
        </div>
        {isOwner && (
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }} className="p-1.5 -mr-1.5">
              <MoreVertical size={18} className="text-white/60" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 w-44 bg-lenz-card border border-lenz-border rounded-xl overflow-hidden shadow-xl z-30">
                <button onClick={e => { e.stopPropagation(); setMenuOpen(false); handleArchive() }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white/80 hover:bg-white/5 border-b border-lenz-border/50">
                  <Archive size={15} className="text-white/50" /> Archive
                </button>
                <button onClick={e => { e.stopPropagation(); setMenuOpen(false); handleDelete() }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/10">
                  <Trash2 size={15} className="text-red-400" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image */}
      <div className="w-full aspect-square bg-lenz-card overflow-hidden">
        <img src={post.image_url} alt={post.caption ?? ''} className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-5">
          <button onClick={toggleLike} className="flex items-center gap-1.5 group">
            <Heart size={24} className={`transition-all duration-200 ${liked ? 'text-red-500 fill-red-500 scale-110' : 'text-white/75 group-hover:text-white'}`} />
            {likesCount > 0 && <span className="text-sm font-semibold text-white/85">{likesCount}</span>}
          </button>
          <button onClick={openComments} className="flex items-center gap-1.5 group">
            <MessageCircle size={23} className="text-white/75 group-hover:text-white transition-colors" />
            {commentsCount > 0 && <span className="text-sm font-semibold text-white/85">{commentsCount}</span>}
          </button>
          <button onClick={() => setShareOpen(true)} className="group">
            <Send size={22} className="text-white/75 group-hover:text-white transition-colors -rotate-12" />
          </button>
        </div>
        <button onClick={toggleSave} className="group">
          <Bookmark size={23} className={`transition-all duration-200 ${saved ? 'text-gold fill-gold' : 'text-white/75 group-hover:text-white'}`} />
        </button>
      </div>

      {/* Likes count */}
      {likesCount > 0 && (
        <p className="px-4 pt-2 text-sm font-bold text-white">{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</p>
      )}

      {/* Caption */}
      {post.caption && (
        <p className="px-4 pt-1 text-sm text-white leading-relaxed">
          <span className="font-bold">{profile?.username || profile?.name}</span>{' '}
          <span className="text-white/80">{post.caption}</span>
        </p>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <p className="px-4 pt-1 text-sm text-gold/60">{post.tags.join(' ')}</p>
      )}

      {/* View comments toggle */}
      {commentsCount > 0 && !showComments && (
        <button onClick={openComments} className="px-4 pt-1.5 text-sm text-white/35">
          View {commentsCount === 1 ? '1 comment' : `all ${commentsCount} comments`}
        </button>
      )}

      <p className="px-4 pt-1.5 pb-3 text-[10px] text-white/25 uppercase tracking-wider">{timeAgo(post.created_at)}</p>

      {/* Inline comments */}
      {showComments && (
        <div className="px-4 pb-4 -mt-1 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-lenz-card border border-lenz-border overflow-hidden shrink-0 mt-0.5">
                {c.profiles?.avatar_url
                  ? <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/40 font-bold">{(c.profiles?.name || '?')[0].toUpperCase()}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-relaxed">
                  <span className="font-bold">{c.profiles?.username || c.profiles?.name || 'User'}</span>{' '}
                  <span className="text-white/80">{c.text}</span>
                </p>
                <p className="text-[10px] text-white/25 mt-0.5">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}

          {/* Comment input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Add a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              className="flex-1 bg-lenz-card border border-lenz-border rounded-full px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40"
            />
            {commentText.trim() && (
              <button onClick={submitComment} disabled={submitting} className="text-gold text-sm font-bold disabled:opacity-50 shrink-0">
                Post
              </button>
            )}
          </div>
        </div>
      )}
      {shareOpen && (
        <SharePostSheet
          postId={post.id}
          imageUrl={post.image_url}
          caption={post.caption}
          onClose={() => setShareOpen(false)}
        />
      )}
    </article>
  )
}
