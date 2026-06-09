import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, CheckCircle, Download, ArrowLeft, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string; name: string; username: string; avatar_url: string | null
  cover_url: string | null; bio: string | null; specialty: string[]
  location: string | null; website: string | null; is_pro: boolean
  followers_count: number; following_count: number; posts_count: number
  available: boolean; price_range: string | null
}
interface Post { id: string; image_url: string; likes_count: number; location_name: string | null }

export default function PhotographerProfile() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('posts').select('id, image_url, likes_count, location_name').eq('user_id', id).order('created_at', { ascending: false }).limit(18),
    ]).then(([{ data: p }, { data: posts }]) => {
      if (p) setProfile(p as Profile)
      if (posts) setPosts(posts as Post[])
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#C9A84C]/20 border-t-[#C9A84C] animate-spin" />
    </div>
  )
  if (!profile) return (
    <div className="min-h-screen pt-24 text-center text-white/30 py-20">Photographer not found</div>
  )

  return (
    <div className="min-h-screen pt-20">
      {/* Cover */}
      <div className="relative h-48 md:h-64 bg-[#0E0E0E]">
        {profile.cover_url && <img src={profile.cover_url} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-transparent" />
        <Link to="/feed" className="absolute top-4 left-4 flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to feed
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Profile header */}
        <div className="relative -mt-16 mb-6 flex items-end gap-5">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-[#060606] overflow-hidden bg-[#141414] shrink-0">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white/20">{profile.name?.[0]}</div>
            )}
          </div>
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-white">{profile.name}</h1>
              {profile.is_pro && <><CheckCircle size={16} className="text-[#C9A84C]" /><span className="text-[10px] font-bold text-[#060606] bg-[#C9A84C] px-2 py-0.5 rounded-full">PRO</span></>}
              {profile.available && <span className="text-[10px] font-bold text-green-400 bg-green-950/30 border border-green-500/20 px-2 py-0.5 rounded-full">Available for hire</span>}
            </div>
            <p className="text-sm text-white/40 mt-0.5">@{profile.username}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div className="md:col-span-2">
            {profile.bio && <p className="text-sm text-white/60 leading-relaxed mb-5">{profile.bio}</p>}
            <div className="flex flex-wrap gap-3 mb-5">
              {profile.specialty?.map(s => (
                <span key={s} className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 px-3 py-1.5 rounded-full">{s}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {profile.location && <div className="flex items-center gap-1.5 text-white/40"><MapPin size={14} />{profile.location}</div>}
              {profile.website && <a href={`https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#C9A84C]/70 hover:text-[#C9A84C]"><Globe size={14} />{profile.website}</a>}
            </div>
          </div>
          <div className="space-y-3">
            <div className="card p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Posts', profile.posts_count], ['Followers', profile.followers_count], ['Following', profile.following_count]].map(([l, v]) => (
                  <div key={l as string}>
                    <p className="text-lg font-bold text-white">{(v as number)?.toLocaleString() ?? 0}</p>
                    <p className="text-[10px] text-white/30">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            {profile.price_range && (
              <div className="card p-4">
                <p className="text-[10px] text-white/30 mb-1">Price Range</p>
                <p className="text-sm text-[#C9A84C]">{profile.price_range}</p>
              </div>
            )}
            <a href="https://apps.apple.com" className="btn-gold w-full justify-center text-sm py-3">
              <Download size={14} /> Hire on Lenzly
            </a>
          </div>
        </div>

        {/* Posts grid */}
        {posts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-white/30 tracking-widest uppercase mb-4">Portfolio ({posts.length})</p>
            <div className="grid grid-cols-3 gap-2 pb-16">
              {posts.map(p => (
                <Link key={p.id} to={`/post/${p.id}`} className="aspect-square rounded-xl overflow-hidden bg-[#141414] group relative">
                  <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
