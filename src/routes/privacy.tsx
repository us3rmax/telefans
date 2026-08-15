import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '@/components/LegalPage'

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: 'Privacy Policy · TeleFans' }, { name: 'description', content: 'Privacy policy for TeleFans.' }] }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updatedAt="15 August 2026">
      <section>
        <h2>1. Information we receive</h2>
        <p>When you open TeleFans through Telegram, we may receive the Telegram information made available to the Mini App, such as your Telegram identifier, display name, username, profile photo, and authentication data.</p>
      </section>
      <section>
        <h2>2. How we use information</h2>
        <p>We use this information to authenticate your session, display your profile, save creator follows and interactions, provide requested features, protect the service, and respond to support requests.</p>
      </section>
      <section>
        <h2>3. Content and interactions</h2>
        <p>Likes, comments, follows, and other interactions may be stored with your Telegram identifier so that they remain available across sessions and devices.</p>
      </section>
      <section>
        <h2>4. Storage and service providers</h2>
        <p>TeleFans uses Supabase for application data, authentication support, and media storage, and Telegram for Mini App access and sharing features. These providers process information only as needed to provide the service.</p>
      </section>
      <section>
        <h2>5. Retention and deletion</h2>
        <p>We retain information for as long as it is needed to provide the service, maintain security, resolve disputes, or meet legal obligations. You may request correction or deletion of information by contacting the TeleFans support team.</p>
      </section>
      <section>
        <h2>6. Third-party links and content</h2>
        <p>Creator pages and links may lead to services operated by third parties. Their privacy practices are governed by their own policies, and TeleFans is not responsible for external services.</p>
      </section>
      <section>
        <h2>7. Updates and contact</h2>
        <p>We may update this policy as TeleFans evolves. The latest version will be available on this page. For privacy requests or questions, contact the official TeleFans support team through Telegram.</p>
      </section>
    </LegalPage>
  )
}
