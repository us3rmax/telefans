import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '@/components/LegalPage'

export const Route = createFileRoute('/terms')({
  head: () => ({ meta: [{ title: 'Terms & Conditions · TeleFans' }, { name: 'description', content: 'Terms and conditions for using TeleFans.' }] }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updatedAt="15 August 2026">
      <section>
        <h2>1. About TeleFans</h2>
        <p>TeleFans is a Telegram Mini App that helps users discover creators and interact with creator content. By accessing TeleFans, you agree to these Terms and Conditions.</p>
      </section>
      <section>
        <h2>2. Eligibility and age requirement</h2>
        <p>You must be at least 18 years old to use areas of TeleFans that contain adult or age-restricted content. You are responsible for providing accurate information and for complying with the laws that apply to you.</p>
      </section>
      <section>
        <h2>3. Accounts and Telegram access</h2>
        <p>TeleFans uses Telegram Mini App authentication for user access. You are responsible for keeping your Telegram account secure and for all activity performed through your account.</p>
      </section>
      <section>
        <h2>4. Creator content</h2>
        <p>Creators remain responsible for the content they publish. You may not copy, redistribute, resell, record, or use creator content outside the permissions granted by TeleFans or the applicable creator.</p>
      </section>
      <section>
        <h2>5. Prohibited conduct</h2>
        <p>You must not use TeleFans to abuse, harass, impersonate, defraud, exploit, or infringe the rights of another person. Content involving minors, non-consensual sexual material, or illegal activity is strictly prohibited.</p>
      </section>
      <section>
        <h2>6. Availability and changes</h2>
        <p>We may update, suspend, or discontinue features of TeleFans, including creator pages and media feeds. We may also update these terms when the service changes.</p>
      </section>
      <section>
        <h2>7. Contact</h2>
        <p>For questions about these terms or to report a violation, contact the TeleFans support team through the official Telegram channel associated with the Mini App.</p>
      </section>
    </LegalPage>
  )
}
