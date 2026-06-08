/**
 * Client-side AES-GCM encryption for private chat photos.
 * Keys are derived from the conversation ID using PBKDF2 and never leave the device.
 * Feed photos use watermarking + signed URL protection instead.
 */

const ALGO = 'AES-GCM'
const KEY_LEN = 256
const IV_LEN = 12 // bytes

// Derive a stable AES key from a conversation ID (PBKDF2 with fixed salt per conv)
export async function deriveConvKey(convId: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(convId),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('lenzly-chat-photo-v1'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGO, length: KEY_LEN },
    false,
    ['encrypt', 'decrypt'],
  )
}

// Encrypt a Blob → returns a new Blob with IV prepended
export async function encryptBlob(blob: Blob, key: CryptoKey): Promise<Blob> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const plaintext = await blob.arrayBuffer()
  const ciphertext = await crypto.subtle.encrypt({ name: ALGO, iv }, key, plaintext)
  // Layout: [12 bytes IV][ciphertext]
  const out = new Uint8Array(IV_LEN + ciphertext.byteLength)
  out.set(iv, 0)
  out.set(new Uint8Array(ciphertext), IV_LEN)
  return new Blob([out], { type: 'application/octet-stream' })
}

// Decrypt a Blob (IV-prefixed) → returns the original image Blob
export async function decryptBlob(blob: Blob, key: CryptoKey, mimeType = 'image/jpeg'): Promise<Blob> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const iv = bytes.slice(0, IV_LEN)
  const ciphertext = bytes.slice(IV_LEN)
  const plaintext = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ciphertext)
  return new Blob([plaintext], { type: mimeType })
}

// Fetch an encrypted image URL, decrypt it, return an object URL safe to display
const decryptedCache = new Map<string, string>()

export async function decryptImageUrl(
  url: string,
  key: CryptoKey,
  mimeType = 'image/jpeg',
  _authToken?: string,
): Promise<string> {
  const cached = decryptedCache.get(url)
  if (cached) return cached

  // Extract storage path from URL (works for both public and private buckets)
  const match = url.match(/\/chat-photos\/(.+)$/)
  let blob: Blob
  if (match) {
    // Use Supabase SDK download — handles auth automatically
    const { supabase } = await import('./supabase')
    const { data, error } = await supabase.storage.from('chat-photos').download(match[1])
    if (error || !data) throw new Error('Failed to fetch encrypted image')
    blob = data
  } else {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch encrypted image')
    blob = await res.blob()
  }

  const decrypted = await decryptBlob(blob, key, mimeType)
  const objectUrl = URL.createObjectURL(decrypted)
  decryptedCache.set(url, objectUrl)
  return objectUrl
}

export function clearDecryptedCache() {
  decryptedCache.forEach(url => URL.revokeObjectURL(url))
  decryptedCache.clear()
}
