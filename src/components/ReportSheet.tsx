import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

type TargetType = 'post' | 'user' | 'comment' | 'story'

const REASONS = [
  'Spam or misleading',
  'Nudity or sexual content',
  'Hate speech or harassment',
  'Violence or dangerous content',
  'Intellectual property violation',
  'Something else',
]

export default function ReportSheet({
  targetType, targetId, onClose,
}: {
  targetType: TargetType
  targetId: string
  onClose: () => void
}) {
  const { user } = useAuth()
  const [reason, setReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!user) { toast.error('Sign in to report'); return }
    if (!reason) { toast.error('Please pick a reason'); return }
    setSending(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    })
    setSending(false)
    if (error) { toast.error('Could not submit report. Try again.'); return }
    toast.success('Report submitted. Thank you — our team will review it.')
    onClose()
  }

  const label = targetType === 'user' ? 'this account' : `this ${targetType}`

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-lenz-card rounded-t-3xl border-t border-lenz-border p-6 pb-10 space-y-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-red-400" />
            <h3 className="text-white font-bold text-base tracking-wide">Report {label}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X size={16} className="text-white/60" />
          </button>
        </div>

        <p className="text-sm text-white/50">Why are you reporting {label}? Your report is anonymous.</p>

        <div className="space-y-2">
          {REASONS.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors border ${
                reason === r
                  ? 'bg-gold/10 border-gold/40 text-white'
                  : 'bg-white/4 border-transparent text-white/70 hover:bg-white/8'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="Add any details (optional)…"
          rows={3}
          className="w-full bg-lenz-bg border border-lenz-border rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-gold/50 transition-colors resize-none"
        />

        <button
          onClick={submit}
          disabled={!reason || sending}
          className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm tracking-wide disabled:opacity-40 active:bg-red-600 transition-colors"
        >
          {sending ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}
