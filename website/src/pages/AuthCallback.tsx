import { useEffect } from 'react'

export default function AuthCallback() {
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      // Forward tokens to the Capacitor app via custom URL scheme
      window.location.href = `lenzly://auth/callback${hash}`
    }
  }, [])

  return (
    <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #ecc85c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
