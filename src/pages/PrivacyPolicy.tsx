import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'

export default function PrivacyPolicy() {
  const [, nav] = useLocation()
  const updated = 'May 26, 2026'

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none">
    <div className="min-h-full bg-lenz-bg pb-24 animate-fade-in">
      <header className="sticky top-0 z-40 glass-dark px-4 py-4 flex items-center gap-3 safe-top">
        <button onClick={() => nav('/')} className="p-1 -ml-1 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-[0.12em] gold-text">PRIVACY POLICY</h1>
      </header>

      <div className="px-4 py-6 space-y-6 text-sm text-white/70 leading-relaxed max-w-[430px]">
        <p className="text-xs text-white/30">Last updated: {updated}</p>

        {[
          {
            title: '1. Information We Collect',
            body: `We collect information you provide when creating an account: name, email address, username, profile photo, bio, and portfolio link. When you share photos or location data, we collect that content and associated metadata. We may also collect device information, IP address, and usage analytics to improve the app.`,
          },
          {
            title: '2. How We Use Your Information',
            body: `We use your information to operate and improve LENZLY, personalize your experience, send service-related notifications, connect photographers with brands (with your consent), display your public profile to other users and brands, and to comply with legal obligations.`,
          },
          {
            title: '3. Location Data',
            body: `Photo spot and GPS data you share is used to show location-based content. Precise location is only accessed with your explicit permission. You may disable location access in your device settings at any time.`,
          },
          {
            title: '4. Sharing Your Information',
            body: `Your public profile, portfolio, and shared photos are visible to all LENZLY users. If you opt into the Brand Discovery feature (Pro accounts), your profile is also visible to verified brand partners. We do not sell your personal data to third parties.`,
          },
          {
            title: '5. Third-Party Services',
            body: `LENZLY uses third-party services including Open-Meteo (weather data, open-source, no personal data shared), OpenStreetMap / CartoDB (map tiles), and Unsplash (demo photo content under the Unsplash License). Each third party has its own privacy policy.`,
          },
          {
            title: '6. Data Retention',
            body: `We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us at privacy@lenzly.app.`,
          },
          {
            title: '7. Children\'s Privacy',
            body: `LENZLY is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it promptly.`,
          },
          {
            title: '8. Your Rights',
            body: `Depending on your location, you may have rights to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@lenzly.app. California residents have additional rights under CCPA.`,
          },
          {
            title: '9. Security',
            body: `We use industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure. We encourage you to use a strong, unique password for your account.`,
          },
          {
            title: '10. Changes to This Policy',
            body: `We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notification or email. Continued use of LENZLY after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: '11. Contact',
            body: `Questions? Contact us at privacy@lenzly.app or write to: LENZLY Inc., [Your Business Address].`,
          },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-sm font-bold text-white mb-2">{title}</h2>
            <p>{body}</p>
          </div>
        ))}

        <div className="mt-8 pt-4 border-t border-lenz-border">
          <p className="text-xs text-white/25">
            Photo content in this app may include images licensed under the Unsplash License (unsplash.com/license). Map data © OpenStreetMap contributors, © CARTO. Weather data provided by Open-Meteo (open-meteo.com).
          </p>
        </div>
      </div>
    </div>
    </div>
  )
}
