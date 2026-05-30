import { useState } from 'react'
import { useLocation } from 'wouter'
import {
  ChevronLeft, ChevronRight, Bell, Lock, Eye, CreditCard,
  HelpCircle, FileText, Shield, LogOut, Trash2, Moon,
  Smartphone, Globe, Star
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

type SectionKey = 'notifications' | 'privacy' | null

export default function Settings() {
  const [, navigate] = useLocation()
  const { signOut } = useAuth()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [likesNotif, setLikesNotif] = useState(true)
  const [followNotif, setFollowNotif] = useState(true)
  const [hireNotif, setHireNotif] = useState(true)
  const [privateAccount, setPrivateAccount] = useState(false)
  const [showLocation, setShowLocation] = useState(true)
  const [expanded, setExpanded] = useState<SectionKey>(null)

  const toggle = (key: SectionKey) => setExpanded(prev => prev === key ? null : key)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth/login')
  }

  const Row = ({
    icon: Icon,
    label,
    sublabel,
    onPress,
    danger,
    right,
  }: {
    icon: typeof Bell
    label: string
    sublabel?: string
    onPress?: () => void
    danger?: boolean
    right?: React.ReactNode
  }) => (
    <button
      onClick={onPress}
      className="flex items-center gap-3 w-full px-4 py-4 border-b border-lenz-border/50 hover:bg-white/5 transition-colors active:bg-white/5"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/10' : 'bg-white/5'}`}>
        <Icon size={17} className={danger ? 'text-red-400' : 'text-white/50'} />
      </div>
      <div className="flex-1 text-left min-w-0 overflow-hidden">
        <p className={`text-sm font-medium truncate ${danger ? 'text-red-400' : 'text-white'}`}>{label}</p>
        {sublabel && <p className="text-xs text-white/30 mt-0.5 truncate">{sublabel}</p>}
      </div>
      <div className="shrink-0 flex items-center gap-1 pl-2">
        {right ?? <ChevronRight size={15} className="text-white/20" />}
      </div>
    </button>
  )

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={e => { e.stopPropagation(); onChange() }}
      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${value ? 'bg-gold' : 'bg-white/15'}`}
    >
      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )

  return (
    <div className="min-h-screen bg-lenz-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark px-4 py-3 flex items-center gap-3 safe-top">
        <button onClick={() => navigate('/profile')} className="p-2 -ml-2">
          <ChevronLeft size={22} className="text-white/70" />
        </button>
        <h2 className="text-sm font-bold tracking-widest uppercase text-white">Settings</h2>
      </header>

      <div className="pt-2">

        {/* Account Section */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase">Account</p>
        </div>
        <div className="bg-lenz-card/30 border-y border-lenz-border/50">
          <Row
            icon={Star}
            label="Upgrade to Pro"
            sublabel="Get verified, appear in brand searches"
            onPress={() => navigate('/pro')}
          />
          <Row
            icon={CreditCard}
            label="Subscription"
            sublabel="$5/month · Manage your Pro plan"
            onPress={() => navigate('/pro')}
          />
        </div>

        {/* Notifications */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase">Notifications</p>
        </div>
        <div className="bg-lenz-card/30 border-y border-lenz-border/50">
          <Row
            icon={Bell}
            label="Push Notifications"
            onPress={() => toggle('notifications')}
            right={
              <div className="flex items-center gap-2">
                <Toggle value={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
                <ChevronRight size={15} className={`text-white/20 transition-transform ${expanded === 'notifications' ? 'rotate-90' : ''}`} />
              </div>
            }
          />
          {expanded === 'notifications' && (
            <div className="bg-lenz-bg/50 border-t border-lenz-border/30">
              {[
                { label: 'Likes', value: likesNotif, set: () => setLikesNotif(!likesNotif) },
                { label: 'New Followers', value: followNotif, set: () => setFollowNotif(!followNotif) },
                { label: 'Hire Requests', value: hireNotif, set: () => setHireNotif(!hireNotif) },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center justify-between px-6 py-3 border-b border-lenz-border/20 pr-4">
                  <p className="text-sm text-white/60 flex-1 min-w-0 mr-4">{label}</p>
                  <Toggle value={value} onChange={set} />
                </div>
              ))}
            </div>
          )}
          <Row
            icon={Smartphone}
            label="Email Notifications"
            onPress={() => setEmailEnabled(!emailEnabled)}
            right={<Toggle value={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />}
          />
        </div>

        {/* Privacy */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase">Privacy</p>
        </div>
        <div className="bg-lenz-card/30 border-y border-lenz-border/50">
          <Row
            icon={Lock}
            label="Private Account"
            sublabel="Only approved followers can see your posts"
            onPress={() => setPrivateAccount(!privateAccount)}
            right={<Toggle value={privateAccount} onChange={() => setPrivateAccount(!privateAccount)} />}
          />
          <Row
            icon={Eye}
            label="Show Location on Posts"
            onPress={() => setShowLocation(!showLocation)}
            right={<Toggle value={showLocation} onChange={() => setShowLocation(!showLocation)} />}
          />
          <Row
            icon={Globe}
            label="Appear in Brand Searches"
            sublabel="Let brands and publications find you"
            onPress={() => toast.info('Upgrade to Pro to control brand discovery')}
          />
        </div>

        {/* Support */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase">Support</p>
        </div>
        <div className="bg-lenz-card/30 border-y border-lenz-border/50">
          <Row
            icon={HelpCircle}
            label="Help Center"
            onPress={() => toast.info('Help Center coming soon')}
          />
          <Row
            icon={FileText}
            label="Terms of Service"
            onPress={() => navigate('/terms')}
          />
          <Row
            icon={Shield}
            label="Privacy Policy"
            onPress={() => navigate('/privacy')}
          />
        </div>

        {/* Danger Zone */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-bold tracking-[0.2em] text-white/25 uppercase">Account Actions</p>
        </div>
        <div className="bg-lenz-card/30 border-y border-lenz-border/50">
          <Row
            icon={LogOut}
            label="Sign Out"
            onPress={handleSignOut}
          />
          <Row
            icon={Trash2}
            label="Delete Account"
            sublabel="Permanently delete your account and data"
            danger
            onPress={() => toast.error('Please contact support to delete your account')}
          />
        </div>

        {/* Version */}
        <p className="text-center text-[10px] text-white/15 mt-8 mb-4 tracking-widest">LENZLY v1.0 · Made for photographers</p>

      </div>
    </div>
  )
}
