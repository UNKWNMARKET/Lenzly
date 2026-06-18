/**
 * Image helper — wraps Unsplash photo URLs.
 *
 * License: Unsplash License (https://unsplash.com/license)
 * Photos are free to use for commercial and non-commercial purposes.
 * Attribution is appreciated but not required under the Unsplash License.
 *
 * PRODUCTION NOTE: Replace demo images with user-uploaded content served
 * from your own CDN (AWS S3, Cloudflare R2, etc.) before app store submission.
 * The Unsplash API (api.unsplash.com) should be used for any programmatic
 * access at production scale.
 */

export const UNSPLASH_ATTRIBUTION = 'Photos provided by Unsplash (unsplash.com) under the Unsplash License.'

export function unsplashPhoto(id: string, width = 800): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`
}

export function picsumPhoto(seed: number, width = 800, height?: number): string {
  const h = height ?? width
  return `https://picsum.photos/seed/${seed}/${width}/${h}`
}
