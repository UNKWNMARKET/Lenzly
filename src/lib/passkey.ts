// Passkey / biometric login helpers using the Credential Management API.
// On iOS (WKWebView, Safari), this uses iCloud Keychain + Face ID / Touch ID.
// On Android, it uses the device biometric store.
// Falls back gracefully when the API isn't available.

const PASSKEY_AVAILABLE_KEY = 'lenzly_passkey_saved'

export function isCredentialManagementSupported(): boolean {
  return typeof window !== 'undefined' && 'credentials' in navigator
}

// Save email+password to the device Keychain after a successful login.
// iOS will prompt Face ID / Touch ID on retrieval.
export async function savePasskeyCredential(email: string, password: string): Promise<boolean> {
  if (!isCredentialManagementSupported()) return false
  try {
    // @ts-ignore — PasswordCredential not in all TS lib versions
    const cred = new (window as any).PasswordCredential({ id: email, password, name: email })
    await navigator.credentials.store(cred)
    localStorage.setItem(PASSKEY_AVAILABLE_KEY, email)
    return true
  } catch {
    return false
  }
}

// Returns the saved credential using Face ID / Touch ID, or null if none saved.
export async function getPasskeyCredential(): Promise<{ email: string; password: string } | null> {
  if (!isCredentialManagementSupported()) return null
  const savedEmail = localStorage.getItem(PASSKEY_AVAILABLE_KEY)
  if (!savedEmail) return null
  try {
    const cred = await navigator.credentials.get({
      // @ts-ignore
      password: true,
      mediation: 'optional',
    } as any)
    if (!cred) return null
    const pc = cred as any
    if (pc.type === 'password' && pc.id && pc.password) {
      return { email: pc.id, password: pc.password }
    }
    return null
  } catch {
    return null
  }
}

export function hasSavedPasskey(): boolean {
  return !!localStorage.getItem(PASSKEY_AVAILABLE_KEY)
}

export function clearSavedPasskey(): void {
  localStorage.removeItem(PASSKEY_AVAILABLE_KEY)
  if (isCredentialManagementSupported()) {
    navigator.credentials.preventSilentAccess?.()
  }
}
