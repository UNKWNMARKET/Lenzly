import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase, type Post } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { timeAgo } from '../../lib/utils'
import PostCard from '../../components/app/PostCard'

interface Comment { id: string; text: string; created_at: string; user_id: string; profiles?: { username: string; name: string; avatar_url: string | null } }

export default function PostView() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    // posts.user_id and comments.user_id reference auth.users (not profiles),
    // so we fetch profiles separately and merge them client-side.
    supabase.from('posts').select('*').eq('id', id).single()
      .then(async ({ data }) => {
        if (data) {
          const { data: prof } = await supabase.from('profiles')
            .select('id, username, name, avatar_url, is_pro').eq('id', (data as any).user_id).single()
          setPost({ ...(data as any), profiles: prof ?? null } as Post)
        } else {
          setPost(null)
        }
        setLoading(false)
      })
    supabase.from('comments').select('id, text, created_at, user_id').eq('post_id', id).order('created_at', { ascending: true })
      .then(async ({ data }) => {
        const commentsData = (data ?? []) as any[]
        const userIds = [...new Set(commentsData.map(c => c.user_id))]
        const { data: profilesData } = await supabase.from('profiles')
          .select('id, username, name, avatar_url').in('id', userIds)
        const map: Record<string, any> = {}
        for (const pr of profilesData ?? []) map[pr.id] = pr
        setComments(commentsData.map(c => ({ ...c, profiles: map[c.user_id] ?? null })) as unknown as Comment[])
      })
    if (user) {
      supabase.from('post_likes').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle().then(({ data }) => setLiked(!!data))
      supabase.from('saved_posts').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle().then(({ data }) => setSaved(!!data))
    }
  }, [id, user])

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !text.trim() || !id) return
    const body = text.trim(); setText('')
    const { data } = await supabase.from('comments').insert({ post_id: id, user_id: user.id, text: body })
      .select('id, text, created_at, user_id').single()
    if (data) {
      const { data: prof } = await supabase.from('profiles')
        .select('id, username, name, avatar_url').eq('id', (data as any).user_id).single()
      setComments(c => [...c, { ...(data as any), profiles: prof ?? null } as unknown as Comment])
    }
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-7 h-7 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>
  if (!post) return <div className="text-center py-24 text-white/30">Post not found</div>

  return (
    <div className="max-w-[600px] mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center gap-3">
        <button onClick={() => history.back()} className="text-white/60 hover:text-white"><ArrowLeft size={20} /></button>
        <h1 className="text-base font-semibold text-white">Post</h1>
      </header>
      <div className="px-3 py-4">
        <PostCard post={post} liked={liked} saved={saved} />

        {/* comments */}
        <div className="mt-4 space-y-3 px-1">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">{comments.length} Comments</p>
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <Link to={`/app/u/${c.profiles?.username}`} className="w-8 h-8 rounded-full overflow-hidden bg-lenz-card2 shrink-0">
                {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-gold/40 text-xs font-bold">{c.profiles?.name?.[0]}</div>}
              </Link>
              <div className="flex-1">
                <p className="text-sm text-white/80"><Link to={`/app/u/${c.profiles?.username}`} className="font-semibold text-white mr-1.5">{c.profiles?.username}</Link>{c.text}</p>
                <p className="text-xs text-white/25 mt-0.5">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && <p className="text-sm text-white/25 py-4 text-center">No comments yet. Be the first.</p>}
        </div>
      </div>

      {/* comment input */}
      {user && (
        <form onSubmit={addComment} className="sticky bottom-0 glass border-t border-white/5 px-3 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-lenz-card2 shrink-0">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gold/40 text-xs font-bold">{profile?.name?.[0]}</div>}
          </div>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment…"
            className="flex-1 bg-lenz-card border border-lenz-border rounded-full px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-gold/40" />
          <button type="submit" disabled={!text.trim()} className="w-9 h-9 rounded-full bg-gold flex items-center justify-center disabled:opacity-30 shrink-0"><Send size={15} className="text-lenz-bg" /></button>
        </form>
      )}
    </div>
  )
}
