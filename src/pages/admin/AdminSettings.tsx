import { useEffect, useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { toast } from 'sonner'

interface Settings {
  appName: string
  tagline: string
  primaryColor: string
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  proMonthlyPrice: number
  proAnnualPrice: number
  supportEmail: string
  privacyEmail: string
  legalEmail: string
}

const DEFAULTS: Settings = {
  appName: 'LENZLY',
  tagline: 'Photography Platform',
  primaryColor: '#C9A84C',
  maintenanceMode: false,
  allowNewRegistrations: true,
  proMonthlyPrice: 19,
  proAnnualPrice: 149,
  supportEmail: 'support@lenzly.app',
  privacyEmail: 'privacy@lenzly.app',
  legalEmail: 'legal@lenzly.app',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/40 tracking-widest uppercase mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40 transition-colors'

export default function AdminSettings() {
  const { api } = useAdminAuth()
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const res = await api('/settings')
    if (res.ok) setSettings(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const res = await api('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
    if (res.ok) toast.success('Settings saved')
    else toast.error('Failed to save')
    setSaving(false)
  }

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  if (loading) return <div className="text-center py-12 text-white/30 text-sm">Loading…</div>

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-xs text-white/40 mt-0.5">App-wide configuration</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* General */}
      <section className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-white/40 tracking-widest uppercase">General</h2>
        <Field label="App Name">
          <input className={inputCls} value={settings.appName} onChange={e => set('appName', e.target.value)} />
        </Field>
        <Field label="Tagline">
          <input className={inputCls} value={settings.tagline} onChange={e => set('tagline', e.target.value)} />
        </Field>
        <Field label="Primary Color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.primaryColor}
              onChange={e => set('primaryColor', e.target.value)}
              className="w-10 h-10 rounded-lg border border-[#1e1e1e] bg-transparent cursor-pointer"
            />
            <input
              className={`${inputCls} flex-1`}
              value={settings.primaryColor}
              onChange={e => set('primaryColor', e.target.value)}
              maxLength={7}
            />
          </div>
        </Field>
      </section>

      {/* Toggles */}
      <section className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-white/40 tracking-widest uppercase">Access</h2>
        {([
          ['maintenanceMode', 'Maintenance Mode', 'Blocks all non-admin access'],
          ['allowNewRegistrations', 'Allow New Registrations', 'Let new users sign up'],
        ] as [keyof Settings, string, string][]).map(([key, label, desc]) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-white/35">{desc}</p>
            </div>
            <button
              onClick={() => set(key, !settings[key] as Settings[typeof key])}
              className={`relative w-10 h-5.5 rounded-full transition-colors ${settings[key] ? 'bg-[#C9A84C]' : 'bg-white/10'}`}
              style={{ height: '22px' }}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-white/40 tracking-widest uppercase">Pro Pricing (USD)</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monthly">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <input
                type="number"
                min={0}
                className={`${inputCls} pl-7`}
                value={settings.proMonthlyPrice}
                onChange={e => set('proMonthlyPrice', Number(e.target.value))}
              />
            </div>
          </Field>
          <Field label="Annual">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
              <input
                type="number"
                min={0}
                className={`${inputCls} pl-7`}
                value={settings.proAnnualPrice}
                onChange={e => set('proAnnualPrice', Number(e.target.value))}
              />
            </div>
          </Field>
        </div>
      </section>

      {/* Contact emails */}
      <section className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
        <h2 className="text-xs font-semibold text-white/40 tracking-widest uppercase">Contact Emails</h2>
        {([
          ['supportEmail', 'Support'],
          ['privacyEmail', 'Privacy'],
          ['legalEmail', 'Legal'],
        ] as [keyof Settings, string][]).map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              type="email"
              className={inputCls}
              value={settings[key] as string}
              onChange={e => set(key, e.target.value as Settings[typeof key])}
            />
          </Field>
        ))}
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#E2C170] text-[#080808] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save size={15} />
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}
