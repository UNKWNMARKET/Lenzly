import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'

export default function TermsOfService() {
  const [, nav] = useLocation()
  const updated = 'May 26, 2026'

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-none">
    <div className="min-h-full bg-lenz-bg pb-24 animate-fade-in">
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
            body: 'By downloading, installing, accessing, or using LENZLY ("the App," "Platform," or "Service"), you agree to be legally bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to all of these Terms, you are prohibited from using the App and must immediately discontinue use.',
          },
          {
            title: '2. Age Requirement — 18+ Only',
            body: 'You must be at least 18 years of age to create an account or use LENZLY. By registering, you represent and warrant that you are 18 years of age or older. If we discover or reasonably suspect that a user is under 18, we will immediately terminate that account and delete all associated content. LENZLY is not intended for minors and we do not knowingly collect data from persons under 18.',
          },
          {
            title: '3. User Accounts',
            body: 'You are solely responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account, whether or not authorized by you. You agree to notify us immediately of any unauthorized access or suspected breach at support@lenzly.app. LENZLY is not liable for any loss or damage arising from your failure to safeguard your credentials.',
          },
          {
            title: '4. User Content — Ownership and Responsibility',
            body: 'You retain full ownership of all photographs, images, text, and other content ("User Content") you upload or post to LENZLY. However, you are solely and exclusively responsible for all User Content you post. LENZLY acts solely as a passive conduit and hosting service for User Content and does not pre-screen, review, or take editorial responsibility for any User Content. By posting content, you grant LENZLY a non-exclusive, royalty-free, sublicensable, worldwide license to use, display, reproduce, distribute, and promote your content within the Platform and for marketing purposes. You represent and warrant that: (a) you own or have all necessary rights, licenses, and permissions to post your content; (b) your content does not infringe any third-party intellectual property, privacy, or publicity rights; and (c) your content complies with all applicable laws.',
          },
          {
            title: '5. Copyright and Intellectual Property',
            body: 'You warrant that you are the original creator or authorized licensee of all content you post, and that such content does not infringe the copyright, trademark, trade secret, or other intellectual property rights of any third party. You agree not to upload photographs taken by others without their express written permission. LENZLY respects intellectual property rights and will respond to properly submitted DMCA takedown notices. Repeat infringers will have their accounts terminated. The LENZLY name, logo, branding, and App design are proprietary to LENZLY and may not be used without prior written authorization.',
          },
          {
            title: '6. Prohibited Content and Conduct',
            body: 'You agree not to post, upload, share, or transmit any content or engage in any conduct that: (a) is illegal under any applicable law or regulation; (b) infringes the intellectual property, privacy, or publicity rights of any third party; (c) is defamatory, libelous, fraudulent, or deceptive; (d) is obscene, pornographic, sexually explicit, or exploits minors in any way; (e) constitutes harassment, bullying, hate speech, or discrimination based on race, ethnicity, gender, religion, sexual orientation, disability, or national origin; (f) contains malware, viruses, or harmful code; (g) constitutes unauthorized commercial solicitation or spam; (h) impersonates any person or entity; (i) promotes violence, self-harm, or dangerous activities; or (j) violates these Terms or any applicable law. LENZLY reserves the right, in its sole discretion, to remove any content and terminate any account that violates these prohibitions, without notice or liability.',
          },
          {
            title: '7. Indemnification',
            body: 'YOU AGREE TO FULLY INDEMNIFY, DEFEND, AND HOLD HARMLESS LENZLY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, AND SERVICE PROVIDERS FROM AND AGAINST ANY AND ALL CLAIMS, LIABILITIES, DAMAGES, JUDGMENTS, AWARDS, LOSSES, COSTS, EXPENSES, OR FEES (INCLUDING REASONABLE ATTORNEYS\' FEES) ARISING OUT OF OR RELATING TO: (a) YOUR USE OF THE PLATFORM; (b) ANY USER CONTENT YOU POST OR SUBMIT; (c) YOUR VIOLATION OF THESE TERMS; (d) YOUR VIOLATION OF ANY THIRD-PARTY RIGHTS, INCLUDING INTELLECTUAL PROPERTY OR PRIVACY RIGHTS; OR (e) ANY CLAIM THAT YOUR CONTENT CAUSED DAMAGE TO A THIRD PARTY. This indemnification obligation will survive termination of your account and these Terms.',
          },
          {
            title: '8. Limitation of Liability',
            body: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LENZLY AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, PARTNERS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO: (a) YOUR ACCESS TO OR USE OF (OR INABILITY TO USE) THE PLATFORM; (b) ANY CONDUCT OR CONTENT OF ANY USER OR THIRD PARTY ON THE PLATFORM; (c) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT; (d) PLATFORM OUTAGES, DOWNTIME, OR DATA LOSS; OR (e) ANY OTHER MATTER RELATING TO THE PLATFORM. IN NO EVENT SHALL LENZLY\'S AGGREGATE LIABILITY EXCEED THE GREATER OF $100 USD OR THE AMOUNT YOU PAID TO LENZLY IN THE TWELVE MONTHS PRECEDING THE CLAIM. SOME JURISDICTIONS DO NOT ALLOW LIMITATION OF CERTAIN WARRANTIES OR LIABILITY, SO SOME OF THESE LIMITATIONS MAY NOT APPLY TO YOU.',
          },
          {
            title: '9. Photography Locations and Third-Party Arrangements',
            body: 'You are solely responsible for obtaining all necessary permits, permissions, and authorizations before photographing on any property. Location data shared in the App is user-generated and unverified. LENZLY facilitates introductions between brands and photographers; any contracts, agreements, or payments between such parties are solely between those parties. LENZLY is not a party to any such arrangements and bears no responsibility for disputes, non-payment, or other issues arising therefrom.',
          },
          {
            title: '10. Pro Subscriptions and Payments',
            body: 'Pro subscriptions are billed monthly or annually at the then-current rates. Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. Refunds are governed by Apple App Store or Google Play policies. LENZLY reserves the right to change pricing with 30 days\' notice.',
          },
          {
            title: '11. Disclaimer of Warranties',
            body: 'THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED, ERROR-FREE OPERATION. LENZLY DOES NOT WARRANT THAT THE PLATFORM WILL MEET YOUR REQUIREMENTS OR THAT ANY ERRORS WILL BE CORRECTED.',
          },
          {
            title: '12. Account Termination',
            body: 'LENZLY reserves the right, in its sole and absolute discretion, to suspend or permanently terminate your account at any time, with or without notice, for any reason, including but not limited to violation of these Terms, posting prohibited content, engaging in fraudulent or abusive behavior, or for no reason at all. Upon termination, your right to use the Platform immediately ceases. Provisions of these Terms that by their nature should survive termination — including indemnification, limitation of liability, and dispute resolution — shall survive.',
          },
          {
            title: '13. Mandatory Arbitration',
            body: 'PLEASE READ THIS SECTION CAREFULLY. ANY DISPUTE, CLAIM, OR CONTROVERSY ARISING OUT OF OR RELATING TO THESE TERMS OR THE PLATFORM SHALL BE RESOLVED EXCLUSIVELY BY BINDING ARBITRATION ADMINISTERED BY THE AMERICAN ARBITRATION ASSOCIATION (AAA) UNDER ITS CONSUMER ARBITRATION RULES. THE ARBITRATOR\'S DECISION SHALL BE FINAL AND BINDING. ARBITRATION SHALL TAKE PLACE ON AN INDIVIDUAL BASIS. YOU AND LENZLY EACH WAIVE ANY RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE PROCEEDING. If a court determines that the class action waiver is unenforceable, then the arbitration clause shall not apply to the relevant claim.',
          },
          {
            title: '14. Class Action Waiver',
            body: 'YOU AND LENZLY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, PRIVATE ATTORNEY GENERAL, OR REPRESENTATIVE PROCEEDING. Unless both you and LENZLY agree, no arbitrator or court may consolidate more than one person\'s claims or otherwise preside over any form of representative or class proceeding.',
          },
          {
            title: '15. Governing Law and Dispute Resolution',
            body: 'These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict of law principles. For any claims not subject to arbitration, you consent to the exclusive jurisdiction and venue of the state and federal courts located in Delaware. Any claim or cause of action arising from your use of the Platform must be filed within one (1) year after the claim arose; otherwise it is permanently barred.',
          },
          {
            title: '16. Changes to Terms',
            body: 'LENZLY reserves the right to modify these Terms at any time. We will provide notice of material changes through in-app notification or email. Your continued use of the Platform after any modification constitutes your acceptance of the updated Terms. If you do not agree to modified Terms, you must stop using the Platform.',
          },
          {
            title: '17. Contact',
            body: 'Questions about these Terms? Contact us at legal@lenzly.app. For DMCA takedown notices, contact dmca@lenzly.app.',
          },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="text-sm font-bold text-white mb-2">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}
