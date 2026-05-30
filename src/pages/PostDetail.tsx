import { useState, useEffect, useRef } from 'react'
import { useLocation, useRoute } from 'wouter'
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark, MapPin, MoreVertical, Trash2, Archive } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

type Comment = {
  id: string
  text: string
  created_at: string
  user_id: string
  profiles: { username: string | null; name: string | null; avatar_url: string | null } | null
}

type PostFull = {
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
  archived: boolean
  profiles: { username: string | null; name: string | null; avatar_url: string | null; is_pro: boolean } | null
}

export default function PostDetail() {
  const [, params] = useRoute('/post/:id')
  const [, navigate] = useLocation()
  const { user } = useAuth()
  const postId = params?.id

  const [post, setPost] = useState<PostFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isOwner = user?.id === post?.user_id

  useEffect(() => {
    if (!postId) return
    const load = async () => {
      const [{ data: postData }, { data: likeData }, { data: saveData }, { data: commentData }] = await Promise.all([
        supabase.from('posts').select('*, profiles(username, name, avatar_url, is_pro)').eq('id', postId).single(),
        user ? supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
        user ? supabase.from('saved_posts').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('comments').select('id, text, created_at, user_id, profiles(username, name, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true }).limit(50),
      ])
      if (postData) {
        setPost(postData as PostFull)
        setLikesCount(postData.likes_count ?? 0)
      }
      setLiked(!!likeData)
      setSaved(!!saveData)
      setComments((commentData ?? []) as unknown as Comment[])
      setLoading(false)
    }
    load()
  }, [postId, user])

  const toggleLike = async () => {
    if (!user || !postId) return
    const newLiked = !liked
    setLiked(newLiked)
    setLikesCount(c => newLiked ? c + 1 : c - 1)
    if (newLiked) {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
      await supabase.from('posts').update({ likes_count: likesCount + 1 }).eq('id', postId)
    } else {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
      await supabase.from('posts').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', postId)
    }
  }

  const toggleSave = async () => {
    if (!user || !postId) return
    const newSaved = !saved
    setSaved(newSaved)
    if (newSaved) {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id })
      toast.success('Post saved')
    } else {
      await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id)
      toast.success('Removed from saved')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: 'Check this out on LENZLY', url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  const submitComment = async () => {
    if (!user || !postId || !commentText.trim()) return
    setSubmitting(true)
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, text: commentText.trim() })
      .select('id, text, created_at, user_id, profiles(username, name, avatar_url)')
      .single()
    if (!error && data) {
      setComments(prev => [...prev, data as unknown as Comment])
      await supabase.from('posts').update({ comments_count: (post?.comments_count ?? 0) + 1 }).eq('id', postId)
      setCommentText('')
    }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!user || !postId) return
    setDeleting(true)
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id)
    if (error) { toast.error('Could not delete'); setDeleting(false); return }
    toast.success('Post deleted')
    navigate('/profile')
  }

  const handleArchive = async () => {
    if (!user || !postId) return
    const { error } = await supabase.from('posts').update({ archived: true }).eq('id', postId).eq('user_id', user.id)
    if (error) { toast.error('Could not archive'); return }
    toast.success('Post archived')
    navigate('/profile')
  }

  const timeAgo = (iso: string) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m`
    if (s < 86400) return `${Math.floor(s / 3600)}h`
    return `${Math.floor(s / 86400)}d`
  }

  if (loading) return (
    <div className="min-h-screen bg-lenz-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
    </div>
  )

  if (!post) return (
    <div className="min-h-screen bg-lenz-bg flex items-center justify-center">
      <p className="text-white/30 text-sm">Post not found</p>
    </div>
  )

  const profile = post.profiles

  return (
    <div className="min-h-screen bg-lenz-bg pb-8" onClick={() => menuOpen && setMenuOpen(false)}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center justify-between safe-top">
        <button onClick={() => navigate('/profile')} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-white/70" />
        </button>
        <span className="text-sm font-bold tracking-widest uppercase text-white">Post</span>
        {isOwner ? (
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }} className="p-2 -mr-2">
              <MoreVertical size={20} className="text-white/70" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-44 bg-lenz-card border border-lenz-border rounded-xl overflow-hidden shadow-xl z-50">
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); handleArchive() }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white/80 hover:bg-white/5 border-b border-lenz-border/50"
                >
                  <Archive size={15} className="text-white/50" /> Archive
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); handleDelete() }}
                  disabled={deleting}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 size={15} className="text-red-400" /> {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        ) : <div className="w-10" />}
      </header>

      {/* Photographer row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-lenz-card border border-lenz-border shrink-0">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-sm">{(profile?.name || '?')[0].toUpperCase()}</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white truncate">{profile?.name || 'Photographer'}</p>
            {profile?.is_pro && <span className="text-[9px] font-bold tracking-widest text-lenz-bg bg-gold px-1.5 py-0.5 rounded-full shrink-0">PRO</span>}
          </div>
          {post.location_name && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-gold shrink-0" />
              <p className="text-xs text-white/40 truncate">{post.location_name}</p>
            </div>
          )}
        </div>
        <span className="text-xs text-white/25 shrink-0">{timeAgo(post.created_at)}</span>
      </div>

      {/* Photo — full width, no modal */}
      <div className="w-full aspect-square bg-lenz-card overflow-hidden">
        <img src={post.image_url} alt={post.caption ?? ''} className="w-full h-full object-cover" loading="lazy" />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button onClick={toggleLike} className="flex items-center gap-1.5 group">
            <Heart
              size={24}
              className={`transition-all duration-200 ${liked ? 'text-red-500 fill-red-500 scale-110' : 'text-white/70 group-hover:text-white'}`}
            />
            <span className="text-sm font-semibold text-white/80">{likesCount > 0 ? likesCount : ''}</span>
          </button>
          {/* Comment */}
          <button onClick={() => inputRef.current?.focus()} className="group">
            <MessageCircle size={24} className="text-white/70 group-hover:text-white transition-colors" />
          </button>
          {/* Share */}
          <button onClick={handleShare} className="group">
            <Send size={22} className="text-white/70 group-hover:text-white transition-colors -rotate-12" />
          </button>
        </div>
        {/* Save */}
        <button onClick={toggleSave} className="group">
          <Bookmark
            size={24}
            className={`transition-all duration-200 ${saved ? 'text-gold fill-gold' : 'text-white/70 group-hover:text-white'}`}
          />
        </button>
      </div>

      {/* Likes label */}
      {likesCount > 0 && (
        <p className="px-4 text-sm font-bold text-white">{likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}</p>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 mt-1">
          <p className="text-sm text-white leading-relaxed">
            <span className="font-bold">{profile?.username || profile?.name}</span>{' '}
            <span className="text-white/80">{post.caption}</span>
          </p>
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <p className="px-4 mt-1 text-sm text-gold/60">{post.tags.join(' ')}</p>
      )}

      {/* Comments */}
      <div className="px-4 mt-4 space-y-3">
        {comments.length > 0 && (
          <p className="text-xs text-white/25 uppercase tracking-widest font-semibold">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-lenz-card border border-lenz-border overflow-hidden shrink-0 mt-0.5">
              {c.profiles?.avatar_url
                ? <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/40 font-bold">{(c.profiles?.name || '?')[0].toUpperCase()}</div>
              }
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
      </div>

      {/* Comment input */}
      <div className="sticky bottom-0 flex items-center gap-3 px-4 py-3 mt-4 bg-lenz-bg border-t border-lenz-border">
        <div className="w-8 h-8 rounded-full bg-lenz-card border border-lenz-border overflow-hidden shrink-0">
          {user && (
            <div className="w-full h-full flex items-center justify-center text-xs text-white/40 font-bold">
              {(user.email || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a comment…"
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submitComment()}
          className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
        />
        {commentText.trim() && (
          <button
            onClick={submitComment}
            disabled={submitting}
            className="text-gold text-sm font-bold disabled:opacity-50"
          >
            Post
          </button>
        )}
      </div>
    </div>
  )
}
