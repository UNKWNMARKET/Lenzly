# LENZLY — Push Notifications Setup (OneSignal)

The code is done. These are the one-time external steps to make push live.
Events covered: **likes, comments, new followers, direct messages**.

---

## 1. Create a OneSignal app

1. Sign up at https://onesignal.com (free).
2. **New App/Website** → name it "LENZLY" → platform **Apple iOS (APNs)**.
3. Upload your **APNs Auth Key** (.p8):
   - Apple Developer → Certificates, IDs & Profiles → **Keys** → **+**
   - Enable **Apple Push Notifications service (APNs)** → download the `.p8`
   - In OneSignal paste the **Key ID**, **Team ID**, and the `.p8` file.
   - Bundle ID: `com.unkwnmarket.lenzly`
4. After setup, copy these from **Settings → Keys & IDs**:
   - **OneSignal App ID**  → used by the app
   - **REST API Key**      → used by the Edge Function (secret)

---

## 2. App configuration (Codemagic / .env)

Add this environment variable to your build (Codemagic → Environment variables,
same place as `VITE_REVENUECAT_IOS_KEY`):

```
VITE_ONESIGNAL_APP_ID = <your OneSignal App ID>
```

The app reads it in `src/lib/onesignal.ts` and registers each signed-in device
under the user's Supabase id (external id).

---

## 3. Xcode capability (already wired in the repo)

- `ios/App/App/App.entitlements` adds `aps-environment = production`.
- The Xcode project now references it via `CODE_SIGN_ENTITLEMENTS`.
- The OneSignal pod is pulled in by `onesignal-cordova-plugin` (in package.json).

> After pulling, run `npm install && npx cap sync ios` locally if you build in
> Xcode. Codemagic does this in its build steps.

> Optional (rich/confirmed-delivery): add a **Notification Service Extension**
> in Xcode named `OneSignalNotificationServiceExtension`. Not required for basic
> pushes to work.

---

## 4. Deploy the Edge Function

From the repo root (needs the Supabase CLI + `supabase login`):

```bash
supabase functions deploy send-push --no-verify-jwt --project-ref zdmtiyyfljzwveaowjxq

supabase secrets set \
  ONESIGNAL_APP_ID=<your OneSignal App ID> \
  ONESIGNAL_REST_API_KEY=<your REST API Key> \
  --project-ref zdmtiyyfljzwveaowjxq
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the function
automatically — you don't set those.)

---

## 5. Wire the Database Webhooks

Supabase Dashboard → **Database → Webhooks → Create a new hook**. Create **two**,
both pointing at the `send-push` function URL, method **POST**, event **Insert**:

| Hook name        | Table                  |
|------------------|------------------------|
| push_on_notify   | `public.notifications` |
| push_on_message  | `public.messages`      |

The function URL looks like:
`https://zdmtiyyfljzwveaowjxq.supabase.co/functions/v1/send-push`

That's it. Likes/comments/follows already insert into `notifications`, and new
DMs insert into `messages`, so both will now fire a push.

---

## Test

1. Build the app to a real device (push does not work in the simulator).
2. Accept the notification permission prompt on first launch.
3. From a second account, like your post / follow you / send a DM.
4. The push should arrive within a couple of seconds.
