import { Capacitor } from '@capacitor/core'

// OneSignal App ID — safe to ship in the app (it is NOT a secret).
// Set VITE_ONESIGNAL_APP_ID in Codemagic / .env. Get it from
// OneSignal dashboard → Settings → Keys & IDs → OneSignal App ID.
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined

let initialized = false

/**
 * Initialise OneSignal once and tie this device to the logged-in Supabase user
 * via an external id. The send-push Edge Function targets users by that same
 * external id, so no device-token table is needed on our side.
 */
export async function initOneSignal(appUserId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return // push only works on a real device
  if (!ONESIGNAL_APP_ID) return

  // The plugin attaches itself to the global window object at runtime.
  const OneSignal = (window as any).OneSignal
  if (!OneSignal) return

  try {
    if (!initialized) {
      OneSignal.initialize(ONESIGNAL_APP_ID)
      initialized = true
      // Ask for permission the first time (iOS shows the system prompt).
      OneSignal.Notifications.requestPermission(true)
    }
    // Associate the device with our user so we can target them server-side.
    OneSignal.login(appUserId)
  } catch {
    /* push will simply be unavailable — non-fatal */
  }
}

/** Detach the device from the user on sign-out so they stop getting their pushes. */
export async function logoutOneSignal(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !ONESIGNAL_APP_ID) return
  const OneSignal = (window as any).OneSignal
  if (!OneSignal) return
  try { OneSignal.logout() } catch { /* noop */ }
}
