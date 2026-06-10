import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zdmtiyyfljzwveaowjxq.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const SITE_URL = process.env.SITE_URL || 'https://lenzly-git-master-eisdorferjesse-1667s-projects.vercel.app'

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let p = ''
  for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p + '!'
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Lenzly <lenzlyadmin@gmail.com>',
      to,
      subject,
      html,
    }),
  })
  return res.ok
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { applicationId, action } = req.body as { applicationId: string; action: 'approve' | 'reject' }
  if (!applicationId || !action) return res.status(400).json({ error: 'Missing fields' })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Fetch the application
  const { data: app, error: fetchErr } = await admin
    .from('brand_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (fetchErr || !app) return res.status(404).json({ error: 'Application not found' })

  if (action === 'approve') {
    const tempPassword = generatePassword()

    // Create Supabase auth user
    const { data: userData } = await admin.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
    })

    // Update application
    await admin.from('brand_applications').update({
      status: 'approved',
      temp_password: tempPassword,
      brand_user_id: userData?.user?.id || null,
      reviewed_at: new Date().toISOString(),
    }).eq('id', applicationId)

    const loginUrl = `${SITE_URL}/business/login`
    const onboardingUrl = `${SITE_URL}/business/onboarding`

    await sendEmail(
      app.email,
      `You're approved — Welcome to Lenzly, ${app.company}!`,
      `
      <div style="font-family:Inter,sans-serif;background:#0b0b0d;color:#fff;max-width:560px;margin:0 auto;padding:40px 32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:22px;font-weight:800;letter-spacing:0.25em;color:#ecc85c;margin:0 0 8px;">LENZLY</h1>
          <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">Business Portal</p>
        </div>
        <h2 style="font-size:20px;font-weight:600;margin:0 0 12px;">You're in, ${app.company} 🎉</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
          Your brand application has been approved. Use the credentials below to access the Lenzly Business Portal and start discovering photographers.
        </p>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
          <p style="margin:0 0 12px;font-size:13px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;">Your login credentials</p>
          <p style="margin:0 0 8px;font-size:14px;"><span style="color:rgba(255,255,255,0.4);">Email:</span> <strong style="color:#fff;">${app.email}</strong></p>
          <p style="margin:0;font-size:14px;"><span style="color:rgba(255,255,255,0.4);">Temp Password:</span> <strong style="color:#ecc85c;font-family:monospace;">${tempPassword}</strong></p>
        </div>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${onboardingUrl}" style="display:inline-block;background:#ecc85c;color:#0b0b0d;font-weight:700;font-size:14px;padding:14px 32px;border-radius:100px;text-decoration:none;">
            Set Up Your Business Profile →
          </a>
        </div>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">
          You can also log in directly at <a href="${loginUrl}" style="color:#ecc85c;">${loginUrl}</a><br/>
          Change your password after your first login.
        </p>
      </div>
      `
    )

    return res.status(200).json({ success: true, tempPassword, brandUserId: userData?.user?.id })
  }

  if (action === 'reject') {
    await admin.from('brand_applications').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', applicationId)

    await sendEmail(
      app.email,
      `Update on your Lenzly brand application`,
      `
      <div style="font-family:Inter,sans-serif;background:#0b0b0d;color:#fff;max-width:560px;margin:0 auto;padding:40px 32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:22px;font-weight:800;letter-spacing:0.25em;color:#ecc85c;margin:0 0 8px;">LENZLY</h1>
          <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">Business Portal</p>
        </div>
        <h2 style="font-size:20px;font-weight:600;margin:0 0 12px;">Application Update</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
          Thank you for your interest in Lenzly, ${app.company}. After reviewing your application, we're unable to approve your request at this time.
        </p>
        <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
          If you believe this is an error or have questions, please reply to this email.
        </p>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">© Lenzly · lenzlyadmin@gmail.com</p>
      </div>
      `
    )

    return res.status(200).json({ success: true })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
