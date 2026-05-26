import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'

export default function TermsOfService() {
  const [, nav] = useLocation()
  const updated = 'May 26, 2026'

  return (
    <div className="min-h-screen bg-lenz-bg pb-24 animate-fade-in">
      <header className="sticky top-0 z-40 glass-dark px-4 py-4 flex items-center gap-3 safe-top">
        <button onClick={() => nav('/')} className="p-1 -ml-1 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-[0.12em] gold-text">TERMS OF SERVICE</h1>
      </header>

      <div className="px-4 py-6 space-y-6 text-sm text-white/70 leading-relaxed">
        <p className="text-xs text-white/30">Last updated: {updated} · Effective immediately</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By downloading, installing, or using LENZLY ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.',
          },
          {
            title: '2. Eligibility',
            body: 'You must be at least 13 years old to use LENZLY. By using the App, you represent that you meet this requirement. Users under 18 must have parental consent.',
          },
          {
            title: '3. User Accounts',
            body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use at support@lenzly.app.',
          },
          {
            title: '4. User Content',
            body: 'You retain ownership of photos and content you upload. By posting content, you grant LENZLY a non-exclusive, royalty-free, worldwide license to display, distribute, and promote your content within the App and for marketing purposes. You represent that you own or have rights to all content you post.',
          },
          {
            title: '5. Prohibited Content',
            body: 'You may not post content that is illegal, violates third-party intellectual property rights, contains nudity, harassment, hate speech, or spam. LENZLY reserves the right to remove content and terminate accounts that violate these rules.',
          },
          {
            title: '6. Photography Locations',
            body: 'You are responsible for obtaining any necessary permits or permissions before photographing on private property. Location data shared in the App is user-generated and LENZLY does not verify the accuracy or legality of shooting at any location.',
          },
          {
            title: '7. Brand & Photographer Connections',
            body: 'LENZLY facilitates introductions between brands and photographers. Any agreements, contracts, or payments between brands and photographers are solely between those parties. LENZLY is not a party to any such agreements and takes no responsibility for disputes.',
          },
          {
            title: '8. Pro Subscriptions',
            body: 'Pro subscriptions are billed monthly or annually. Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. Refunds are provided in accordance with Apple App Store / Google Play policies.',
          },
          {
            title: '9. Intellectual Property',
            body: 'The LENZLY name, logo, and App design are proprietary to LENZLY Inc. You may not use these without written permission. Third-party trademarks remain the property of their respective owners.',
          },
          {
            title: '10. Disclaimers',
            body: 'THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. LENZLY DOES NOT GUARANTEE UNINTERRUPTED SERVICE OR ACCURACY OF WEATHER FORECASTS, LOCATION DATA, OR PHOTOGRAPHER AVAILABILITY.',
          },
          {
            title: '11. Limitation of Liability',
            body: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, LENZLY SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE APP.',
          },
          {
            title: '12. Governing Law',
            body: 'These Terms are governed by the laws of [Your State/Country], without regard to conflict of law provisions.',
          },
          {
            title: '13. Changes to Terms',
            body: 'We may update these Terms at any time. Continued use after changes constitutes acceptance. Material changes will be communicated via in-app notice.',
          },
          {
            title: '14. Contact',
            body: 'Questions about these Terms? Contact us at legal@lenzly.app.',
          },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-sm font-bold text-white mb-2">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
