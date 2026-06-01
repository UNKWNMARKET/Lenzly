import { useState } from 'react'
import { useLocation } from 'wouter'
import {
  ChevronLeft, ChevronRight, Bell, Lock, Eye, CreditCard,
  HelpCircle, FileText, Shield, LogOut, Trash2,
  Smartphone, Globe, Star, MessageSquare, X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type SectionKey = 'notifications' | 'privacy' | null

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { deleteAccount } = useAuth()
  const [, navigate] = useLocation()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE'

  const handleDelete = async () => {
    if (!canDelete) return
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Your account has been deleted')
      navigate('/auth/login')
    } catch (e: any) {
      toast.error(e?.message || 'Could not delete account. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-lenz-card rounded-t-3xl border-t border-lenz-border p-6 pb-10 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-red-400 font-bold text-base tracking-wide">Delete Account</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X size={16} className="text-white/60" />
          </button>
        </div>

        <p className="text-sm text-white/60 leading-relaxed">
          This is permanent. Your profile, photos, spots, stories, messages, followers,
          and all other data will be erased immediately and cannot be recovered.
        </p>

        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
          <p className="text-xs text-red-300/90 leading-relaxed">
            If you have an active LENZLY Pro subscription, cancel it in your Apple ID
            settings — deleting your account here does not cancel App Store billing.
          </p>
        </div>

        <div>
          <p className="text-xs text-white/40 mb-2">Type <span className="font-bold text-white/70">DELETE</span> to confirm</p>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoCapitalize="characters"
            className="w-full bg-lenz-bg border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        <button onClick={handleDelete} disabled={!canDelete || deleting}
          className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm tracking-wide disabled:opacity-40 active:bg-red-600 transition-colors">
          {deleting ? 'Deleting…' : 'Permanently Delete My Account'}
        </button>
        <button onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-white/5 text-white/60 font-semibold text-sm active:bg-white/10 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [type, setType] = useState<'bug' | 'suggestion' | 'other'>('bug')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!message.trim()) { toast.error('Please describe the issue'); return }
    setSending(true)
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      type,
      message: message.trim(),
    })
    setSending(false)
    if (error) { toast.error('Failed to send. Try again.'); return }
    toast.success('Feedback sent — thank you!')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-lenz-card rounded-t-3xl border-t border-lenz-border p-6 pb-10 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-base tracking-wide">Send Feedback</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X size={16} className="text-white/60" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2">
          {(['bug', 'suggestion', 'other'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${type === t ? 'bg-gold text-lenz-bg' : 'bg-white/5 text-white/40 hover:text-white/70'}`}>
              {t === 'bug' ? '🐛 Bug' : t === 'suggestion' ? '💡 Idea' : '💬 Other'}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={type === 'bug' ? 'Describe what happened and how to reproduce it…' : type === 'suggestion' ? 'What feature or improvement would you like?' : "What's on your mind?"}
          rows={5}
          className="w-full bg-lenz-bg border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors resize-none"
        />

        <button onClick={send} disabled={sending || !message.trim()}
          className="btn-primary w-full py-3.5 text-sm font-semibold tracking-wider disabled:opacity-50">
          {sending ? 'Sending…' : 'Send Feedback'}
        </button>
      </div>
    </div>
  )
}

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
  const [showFeedback, setShowFeedback] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

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
      className="flex items-center gap-3 w-full pl-4 pr-5 py-4 border-b border-lenz-border/50 hover:bg-white/5 transition-colors active:bg-white/5"
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
            icon={MessageSquare}
            label="Send Feedback"
            sublabel="Report a bug or suggest a feature"
            onPress={() => setShowFeedback(true)}
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
            onPress={() => setShowDelete(true)}
          />
        </div>

        {/* Version */}
        <p className="text-center text-[10px] text-white/15 mt-8 mb-4 tracking-widest">LENZLY v1.0 · Made for photographers</p>
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}

      </div>
    </div>
  )
}
