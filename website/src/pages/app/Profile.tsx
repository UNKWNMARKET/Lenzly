import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Globe, Settings, Grid3x3, Bookmark, MessageCircle, CheckCircle, UserPlus, UserCheck } from 'lucide-react'
import { supabase, type Profile as P, type Post } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatCount, cn } from '../../lib/utils'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user, profile: me } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<P | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [saved, setSaved] = useState<Post[]>([])
  const [tab, setTab] = useState<'posts' | 'saved'>('posts')
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const isMe = me?.username === username

  const load = useCallback(async () => {
    setLoading(true)
    const { data: prof } = await supabase.from('profiles').select('*').ilike('username', username ?? '').single()
    if (!prof) { setLoading(false); return }
    setProfile(prof as P)
    const { data: ps } = await supabase.from('posts').select('id, image_url, likes_count, comments_count, created_at, user_id').eq('user_id', prof.id).order('created_at', { ascending: false })
    setPosts((ps ?? []) as Post[])
    if (user && user.id !== prof.id) {
      const { data: f } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', prof.id).maybeSingle()
      setFollowing(!!f)
    }
    setLoading(false)
  }, [username, user])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (tab === 'saved' && isMe && user) {
      supabase.from('saved_posts').select('post_id, posts:post_id(id, image_url, likes_count, comments_count, created_at, user_id)').eq('user_id', user.id)
        .then(({ data }) => setSaved((data ?? []).map((r: any) => r.posts).filter(Boolean)))
    }
  }, [tab, isMe, user])

  async function toggleFollow() {
    if (!user || !profile) return
    const next = !following
    setFollowing(next)
    setProfile(p => p ? { ...p, followers_count: p.followers_count + (next ? 1 : -1) } : p)
    if (next) await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id })
    else await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id)
  }

  async function messageUser() {
    if (!user || !profile) return
    // find or create conversation
    const { data: mine } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', user.id)
    const myConvs = (mine ?? []).map(c => c.conversation_id)
    let convId: string | null = null
    if (myConvs.length) {
      const { data: shared } = await supabase.from('conversation_participants').select('conversation_id').eq('user_id', profile.id).in('conversation_id', myConvs)
      convId = shared?.[0]?.conversation_id ?? null
    }
    if (!convId) {
      const { data: conv } = await supabase.from('conversations').insert({ created_by: user.id }).select('id').single()
      if (conv) {
        convId = conv.id
        await supabase.from('conversation_participants').insert([{ conversation_id: convId, user_id: user.id }, { conversation_id: convId, user_id: profile.id }])
      }
    }
    if (convId) navigate(`/app/messages/${convId}`)
  }

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-7 h-7 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>
  if (!profile) return <div className="text-center py-24 text-white/30">Profile not found</div>

  const grid = tab === 'posts' ? posts : saved

  return (
    <div className="max-w-3xl mx-auto">
      {/* cover */}
      <div className="relative h-40 md:h-52 bg-gradient-to-br from-lenz-card2 to-lenz-bg">
        {profile.cover_url && <img src={profile.cover_url} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-lenz-bg to-transparent" />
      </div>

      <div className="px-4 md:px-6">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-lenz-bg overflow-hidden bg-lenz-card2 shrink-0">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> :
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gold/40">{profile.name?.[0]}</div>}
          </div>
          <div className="flex gap-2 mb-2">
            {isMe ? (
              <>
                <Link to="/app/edit-profile" className="btn-ghost text-sm py-2.5 px-5">Edit Profile</Link>
                <Link to="/app/settings" className="w-10 h-10 rounded-2xl border border-lenz-border flex items-center justify-center text-white/60 hover:text-white"><Settings size={18} /></Link>
              </>
            ) : (
              <>
                <button onClick={toggleFollow} className={cn('text-sm py-2.5 px-6 rounded-2xl font-semibold transition-all', following ? 'border border-lenz-border text-white/70' : 'bg-gold text-lenz-bg')}>
                  {following ? <><UserCheck size={15} className="inline mr-1.5" />Following</> : <><UserPlus size={15} className="inline mr-1.5" />Follow</>}
                </button>
                <button onClick={messageUser} className="w-10 h-10 rounded-2xl border border-lenz-border flex items-center justify-center text-white/60 hover:text-gold"><MessageCircle size={18} /></button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-white">{profile.name}</h1>
          {profile.is_pro && <><CheckCircle size={16} className="text-gold" /><span className="text-[10px] font-black text-lenz-bg bg-gold px-2 py-0.5 rounded-full">PRO</span></>}
          {profile.available && <span className="text-[10px] font-bold text-green-400 bg-green-950/30 border border-green-500/20 px-2 py-0.5 rounded-full">Available</span>}
        </div>
        <p className="text-sm text-white/40 mb-3">@{profile.username}</p>
        {profile.bio && <p className="text-sm text-white/70 leading-relaxed mb-3 max-w-lg">{profile.bio}</p>}

        <div className="flex flex-wrap gap-2 mb-3">
          {(profile.specialty ?? []).map(s => <span key={s} className="text-xs text-gold/70 bg-gold/8 border border-gold/12 px-2.5 py-1 rounded-full">{s}</span>)}
        </div>
        <div className="flex flex-wrap gap-4 text-sm mb-5">
          {profile.location && <span className="flex items-center gap-1.5 text-white/40"><MapPin size={14} />{profile.location}</span>}
          {profile.website && <a href={`https://${profile.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gold/70 hover:text-gold"><Globe size={14} />{profile.website}</a>}
        </div>

        <div className="flex gap-8 mb-6 pb-6 border-b border-white/5">
          {[['Posts', profile.posts_count ?? posts.length], ['Followers', profile.followers_count], ['Following', profile.following_count]].map(([l, v]) => (
            <div key={l as string}><span className="text-lg font-bold text-white">{formatCount(v as number)}</span><span className="text-sm text-white/35 ml-1.5">{l}</span></div>
          ))}
        </div>

        {/* tabs */}
        <div className="flex gap-1 mb-4">
          <button onClick={() => setTab('posts')} className={cn('flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all', tab === 'posts' ? 'text-gold border-gold' : 'text-white/35 border-transparent')}><Grid3x3 size={16} />Posts</button>
          {isMe && <button onClick={() => setTab('saved')} className={cn('flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all', tab === 'saved' ? 'text-gold border-gold' : 'text-white/35 border-transparent')}><Bookmark size={16} />Saved</button>}
        </div>

        {grid.length === 0 ? (
          <div className="text-center py-16 text-white/25 text-sm">No {tab} yet</div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 pb-8">
            {grid.map(p => (
              <Link key={p.id} to={`/app/post/${p.id}`} className="aspect-square rounded-lg overflow-hidden bg-lenz-card group">
                <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
