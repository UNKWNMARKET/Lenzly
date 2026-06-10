import { useState } from 'react'
import { Plus, MapPin, Calendar, DollarSign, Briefcase, X, Trash2, Eye, EyeOff, Wifi } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useMyJobs, type Job, type JobDraft } from '../../hooks/useJobs'

const PROJECT_TYPES = ['Editorial', 'Commercial', 'Events', 'Product', 'Fashion', 'Campaign', 'Portrait', 'Real Estate', 'Food', 'Other']
const BUDGETS = ['Under $500', '$500–$2k', '$2k–$5k', '$5k–$10k', '$10k+', 'Negotiable']

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BusinessJobs() {
  const { user } = useAuth()
  const { jobs, loading, create, remove, toggleStatus } = useMyJobs(user?.id)
  const [showForm, setShowForm] = useState(false)

  const openCount = jobs.filter(j => j.status === 'open').length

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] text-gold/60 tracking-[0.25em] uppercase font-semibold mb-2">Hiring</p>
          <h1 className="text-3xl font-serif text-white mb-2">Photography Jobs</h1>
          <p className="text-sm text-white/35">{openCount} open {openCount === 1 ? 'job' : 'jobs'} · visible to photographers across Lenzly.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm bg-gold text-lenz-bg font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity shrink-0">
          <Plus size={15} /> Post a Job
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-white/30 text-sm">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase size={30} className="text-white/10 mx-auto mb-4" />
          <p className="text-sm text-white/40 mb-1">No jobs posted yet</p>
          <p className="text-xs text-white/25 mb-6">Post a photography job and photographers can discover and apply.</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 text-sm text-gold border border-gold/25 rounded-xl px-5 py-2.5 hover:bg-gold/8 transition-colors">
            <Plus size={14} /> Post your first job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => <JobCard key={job.id} job={job} onDelete={remove} onToggle={toggleStatus} />)}
        </div>
      )}

      {showForm && <JobForm onClose={() => setShowForm(false)} onCreate={async (d) => { await create(d); setShowForm(false) }} />}
    </div>
  )
}

function JobCard({ job, onDelete, onToggle }: { job: Job; onDelete: (id: string) => void; onToggle: (j: Job) => void }) {
  const open = job.status === 'open'
  return (
    <div className={`card p-5 ${!open ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-base font-semibold text-white truncate">{job.title}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${open ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/10'}`}>
              {open ? 'Open' : 'Closed'}
            </span>
          </div>
          {job.description && <p className="text-sm text-white/50 leading-relaxed mb-3 line-clamp-2">{job.description}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/40">
            {job.project_type && <span className="flex items-center gap-1.5"><Briefcase size={12} /> {job.project_type}</span>}
            {(job.location || job.is_remote) && <span className="flex items-center gap-1.5"><MapPin size={12} /> {job.is_remote ? 'Remote' : job.location}</span>}
            {job.budget && <span className="flex items-center gap-1.5"><DollarSign size={12} /> {job.budget}</span>}
            {job.shoot_date && <span className="flex items-center gap-1.5"><Calendar size={12} /> {fmtDate(job.shoot_date)}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={() => onToggle(job)} title={open ? 'Close job' : 'Reopen job'}
            className="flex items-center gap-1.5 text-xs text-white/50 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors">
            {open ? <><EyeOff size={12} /> Close</> : <><Eye size={12} /> Reopen</>}
          </button>
          <button onClick={() => onDelete(job.id)} title="Delete job"
            className="flex items-center justify-center text-white/30 hover:text-red-400 border border-white/10 hover:border-red-500/20 rounded-lg px-3 py-2 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function JobForm({ onClose, onCreate }: { onClose: () => void; onCreate: (d: JobDraft) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectType, setProjectType] = useState('')
  const [location, setLocation] = useState('')
  const [isRemote, setIsRemote] = useState(false)
  const [budget, setBudget] = useState('')
  const [shootDate, setShootDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await onCreate({
      title: title.trim(),
      description: description.trim() || null,
      project_type: projectType || null,
      location: isRemote ? null : (location.trim() || null),
      is_remote: isRemote,
      budget: budget || null,
      shoot_date: shootDate || null,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={submit} className="relative bg-lenz-card border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 bg-lenz-card z-10">
          <h2 className="text-lg font-serif text-white">Post a Photography Job</h2>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Field label="Job title *">
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Fashion campaign photographer"
              className="input" />
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Describe the shoot, deliverables, style, and any requirements…"
              className="input resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Project type">
              <select value={projectType} onChange={e => setProjectType(e.target.value)} className="input">
                <option value="">Select…</option>
                {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Budget">
              <select value={budget} onChange={e => setBudget(e.target.value)} className="input">
                <option value="">Select…</option>
                {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <input value={location} onChange={e => setLocation(e.target.value)} disabled={isRemote}
                placeholder="City, State" className="input disabled:opacity-40" />
            </Field>
            <Field label="Shoot date">
              <input type="date" value={shootDate} onChange={e => setShootDate(e.target.value)} className="input" />
            </Field>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button type="button" onClick={() => setIsRemote(v => !v)}
              className={`w-9 h-5 rounded-full transition-colors relative ${isRemote ? 'bg-gold' : 'bg-white/15'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isRemote ? 'left-4' : 'left-0.5'}`} />
            </button>
            <span className="flex items-center gap-1.5 text-sm text-white/60"><Wifi size={13} /> Remote / multiple locations</span>
          </label>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/8 sticky bottom-0 bg-lenz-card">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-medium hover:bg-white/5">
            Cancel
          </button>
          <button type="submit" disabled={!title.trim() || saving}
            className="flex-1 py-3 rounded-xl bg-gold text-lenz-bg text-sm font-semibold hover:opacity-90 disabled:opacity-40">
            {saving ? 'Posting…' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
