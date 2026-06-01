// ============================================================================
// LENZLY — send-push Edge Function
// Sends a OneSignal push when a row is inserted into `notifications`
// (likes / comments / follows) or `messages` (direct messages).
//
// Deploy:   supabase functions deploy send-push --no-verify-jwt
// Secrets:  supabase secrets set ONESIGNAL_APP_ID=...  ONESIGNAL_REST_API_KEY=...
//           (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically)
//
// Wire two Database Webhooks (Supabase → Database → Webhooks), both POSTing to
// this function's URL on INSERT:
//   1. table: public.notifications
//   2. table: public.messages
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function sendPush(externalIds: string[], title: string, message: string, data: Record<string, unknown>) {
  if (externalIds.length === 0) return
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Modern OneSignal REST API keys use the "Key" scheme (legacy used "Basic")
      Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: externalIds },
      target_channel: 'push',
      headings: { en: title },
      contents: { en: message },
      data,
    }),
  })
}

async function usernameOf(userId: string): Promise<string> {
  const { data } = await admin.from('profiles').select('username, name').eq('id', userId).maybeSingle()
  return data?.username || data?.name || 'Someone'
}

Deno.serve(async (req) => {
  try {
    const body = await req.json()
    const table: string = body.table
    const record: any = body.record

    if (!record) return new Response('no record', { status: 200 })

    // ── Likes / comments / follows (notifications table) ──────────────────
    if (table === 'notifications') {
      const recipient = record.user_id
      const actor = record.actor_id
      if (!recipient || recipient === actor) return new Response('skip', { status: 200 })

      const name = await usernameOf(actor)
      const verb =
        record.type === 'like' ? 'liked your post' :
        record.type === 'comment' ? 'commented on your post' :
        record.type === 'follow' ? 'started following you' :
        'sent you a notification'

      await sendPush([recipient], 'LENZLY', `@${name} ${verb}`, {
        type: record.type, post_id: record.post_id ?? null,
      })
      return new Response('ok', { status: 200 })
    }

    // ── Direct messages (messages table) ──────────────────────────────────
    if (table === 'messages') {
      const sender = record.sender_id
      const conversationId = record.conversation_id
      if (!sender || !conversationId) return new Response('skip', { status: 200 })

      const { data: parts } = await admin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', sender)

      const recipients = (parts ?? []).map((p: any) => p.user_id)
      const name = await usernameOf(sender)
      const preview = (record.content ?? '').toString().slice(0, 80) || 'Sent you a message'

      await sendPush(recipients, `@${name}`, preview, {
        type: 'message', conversation_id: conversationId,
      })
      return new Response('ok', { status: 200 })
    }

    return new Response('ignored', { status: 200 })
  } catch (e) {
    return new Response(`error: ${e}`, { status: 200 }) // 200 so webhook isn't retried forever
  }
})
