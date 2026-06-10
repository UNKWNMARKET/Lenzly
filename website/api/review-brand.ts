import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zdmtiyyfljzwveaowjxq.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const SITE_URL = process.env.SITE_URL || 'https://lenzly-git-master-eisdorferjesse-1667s-projects.vercel.app'
// Resend requires a verified sender. Gmail addresses can't be verified, so we
// send from Resend's address (or a custom domain via FROM_EMAIL) and set
// reply-to so responses go to the work Gmail.
const FROM_EMAIL = process.env.FROM_EMAIL || 'Lenzly <onboarding@resend.dev>'
const REPLY_TO = process.env.REPLY_TO || 'lenzlyadmin@gmail.com'

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let p = ''
  for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p + '!'
}

async function sendEmail(to: string, subject: string, html: string): Promise<string | null> {
  if (!RESEND_API_KEY) return 'RESEND_API_KEY is not set in Vercel environment variables'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      reply_to: REPLY_TO,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return `Resend error ${res.status}: ${body.slice(0, 300)}`
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { applicationId, action } = req.body as { applicationId: string; action: 'approve' | 'reject' | 'revoke' }
  if (!applicationId || !action) return res.status(400).json({ error: 'Missing fields' })
  if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set in Vercel environment variables' })

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

    // Create Supabase auth user. If the email already has an account, update
    // that account's password instead so the credentials we show stay valid.
    let brandUserId: string | null = null
    const { data: userData, error: createErr } = await admin.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
    })

    if (createErr) {
      const alreadyExists = createErr.message?.toLowerCase().includes('already') ||
        (createErr as any).code === 'email_exists'
      if (!alreadyExists) {
        return res.status(500).json({ error: `Could not create brand account: ${createErr.message}` })
      }
      // Find the existing user by email and reset their password to the new temp one
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = list?.users?.find(u => u.email?.toLowerCase() === app.email.toLowerCase())
      if (!existing) {
        return res.status(500).json({ error: 'Account exists but could not be located to reset password.' })
      }
      brandUserId = existing.id
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password: tempPassword,
        email_confirm: true,
      })
      if (updErr) {
        return res.status(500).json({ error: `Could not reset password: ${updErr.message}` })
      }
    } else {
      brandUserId = userData?.user?.id || null
    }

    // Update application
    await admin.from('brand_applications').update({
      status: 'approved',
      temp_password: tempPassword,
      brand_user_id: brandUserId,
      reviewed_at: new Date().toISOString(),
    }).eq('id', applicationId)

    const loginUrl = `${SITE_URL}/business/login`
    const onboardingUrl = `${SITE_URL}/business/onboarding`

    const emailError = await sendEmail(
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

    return res.status(200).json({ success: true, tempPassword, brandUserId, emailError })
  }

  if (action === 'reject') {
    await admin.from('brand_applications').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
    }).eq('id', applicationId)

    const emailError = await sendEmail(
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

    return res.status(200).json({ success: true, emailError })
  }

  if (action === 'revoke') {
    // Ban the brand's auth account so they can no longer sign in.
    let located: string | null = app.brand_user_id || null
    if (!located) {
      const { data: list } = await admin.auth.admin.listUsers()
      located = list?.users?.find(u => u.email?.toLowerCase() === app.email.toLowerCase())?.id || null
    }
    if (located) {
      // Set a 100-year ban (effectively permanent) to block sign-in.
      const { error: banErr } = await admin.auth.admin.updateUserById(located, {
        ban_duration: '876000h',
      })
      if (banErr) {
        return res.status(500).json({ error: `Could not revoke access: ${banErr.message}` })
      }
    }

    await admin.from('brand_applications').update({
      status: 'revoked',
      reviewed_at: new Date().toISOString(),
    }).eq('id', applicationId)

    const emailError = await sendEmail(
      app.email,
      `Your Lenzly business access has been revoked`,
      `
      <div style="font-family:Inter,sans-serif;background:#0b0b0d;color:#fff;max-width:560px;margin:0 auto;padding:40px 32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="font-size:22px;font-weight:800;letter-spacing:0.25em;color:#ecc85c;margin:0 0 8px;">LENZLY</h1>
          <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">Business Portal</p>
        </div>
        <h2 style="font-size:20px;font-weight:600;margin:0 0 12px;">Access Revoked</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
          Hi ${app.company}, your access to the Lenzly Business Portal has been revoked due to a violation of our rules and guidelines. You can no longer sign in.
        </p>
        <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 28px;">
          If you believe this was made in error, please reply to this email to appeal.
        </p>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">© Lenzly · lenzlyadmin@gmail.com</p>
      </div>
      `
    )

    return res.status(200).json({ success: true, emailError })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
