import { supabase } from './supabase'

/**
 * Upload a file to Supabase Storage with real upload progress.
 * Returns the public URL on success, throws on error.
 */
export async function uploadWithProgress(
  bucket: string,
  filePath: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  // Get the Supabase project URL and anon key from the client
  const supabaseUrl = (supabase as any).supabaseUrl as string
  const supabaseKey = (supabase as any).supabaseKey as string

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? supabaseKey

  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 95)) // cap at 95 until confirmed
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`
        resolve(publicUrl)
      } else {
        try {
          const body = JSON.parse(xhr.responseText)
          reject(new Error(body.error ?? body.message ?? 'Upload failed'))
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

    xhr.send(file)
  })
}
