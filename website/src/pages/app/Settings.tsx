import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Shield, Bell, CreditCard, FileText, LogOut, ChevronRight, Briefcase } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'

export default function Settings() {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  const groups = [
    { title: 'Account', items: [
      { icon: User, label: 'Edit Profile', to: '/app/edit-profile' },
      { icon: Shield, label: 'Privacy', to: '#' },
      { icon: Bell, label: 'Notifications', to: '#' },
    ]},
    { title: 'Business', items: [
      { icon: Briefcase, label: 'Business Portal', to: '/business' },
      { icon: CreditCard, label: 'Go PRO', to: '#' },
    ]},
    { title: 'About', items: [
      { icon: FileText, label: 'Privacy Policy', to: '/privacy' },
      { icon: FileText, label: 'Terms of Service', to: '/terms' },
    ]},
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 z-30 glass border-b border-white/5 px-4 h-14 flex items-center gap-3">
        <button onClick={() => history.back()} className="text-white/60 hover:text-white"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold text-white">Settings</h1>
      </header>

      <div className="px-4 py-5 space-y-7">
        {profile && (
          <Link to={`/app/u/${profile.username}`} className="flex items-center gap-3 p-4 card">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-lenz-card2 border border-white/10">
              {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gold/50 font-bold text-lg">{profile.name?.[0]}</div>}
            </div>
            <div className="flex-1"><p className="text-base font-semibold text-white">{profile.name}</p><p className="text-sm text-white/40">@{profile.username}</p></div>
            <ChevronRight size={18} className="text-white/30" />
          </Link>
        )}

        {groups.map(g => (
          <div key={g.title}>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">{g.title}</p>
            <div className="card overflow-hidden divide-y divide-white/5">
              {g.items.map(it => (
                <Link key={it.label} to={it.to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                  <it.icon size={18} className="text-white/50" />
                  <span className="flex-1 text-sm text-white/80">{it.label}</span>
                  <ChevronRight size={16} className="text-white/25" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button onClick={async () => { await signOut(); navigate('/') }}
          className="w-full flex items-center justify-center gap-2 py-3.5 card text-red-400 text-sm font-semibold hover:bg-red-950/20 transition-colors">
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </div>
  )
}
