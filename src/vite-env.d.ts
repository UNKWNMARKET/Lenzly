/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVENUECAT_IOS_KEY?: string
  readonly VITE_GOOGLE_PLACES_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
