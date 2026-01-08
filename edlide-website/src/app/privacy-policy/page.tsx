export default function PrivacyPolicy() {
  return (
    <div className="container max-w-3xl py-20 px-4">
      <h1 className="text-4xl font-bold mb-8 text-primary">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground mb-6">
          Last updated: January 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground">
            At Edlide, we believe privacy is fundamental. This Privacy Policy explains our commitment 
            to protecting your information when you use our AI-powered development environment.
          </p>
          <p className="text-muted-foreground mt-2">
            Edlide is a commercial, proprietary product and a fork of Void, which is licensed under 
            the Apache 2.0 License. We maintain minimal data practices to respect your privacy while 
            providing essential services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Data We Do Not Collect</h2>
          <p className="text-muted-foreground mb-4">
            Edlide is designed with privacy-first principles. We do NOT collect:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Your source code, project files, or codebases</li>
            <li>AI prompts, conversation content, or chat history</li>
            <li>Model outputs, generated code, or AI suggestions</li>
            <li>File contents or code analysis results</li>
            <li>User credentials beyond authentication tokens</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            Your code belongs to you. We do not access, store, or analyze your proprietary code or 
            intellectual property.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. AI Services and Confidential Computing</h2>
          <p className="text-muted-foreground mb-4">
            Edlide integrates with Chutes AI for inference services with enterprise-grade privacy:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li><strong>End-to-End Security:</strong> Your prompts and responses are encrypted throughout transmission</li>
            <li><strong>Confidential Compute:</strong> Run and protect AI workloads with end-to-end security</li>
            <li><strong>No Vendor Eyes:</strong> No Chutes provider eyes on your prompts or responses</li>
            <li><strong>Pure Inference:</strong> Processing without data retention, logging, or analysis</li>
            <li><strong>Zero Knowledge:</strong> Deploy proprietary models on decentralized infrastructure without fear</li>
            <li><strong>Pure Confidence:</strong> Just pure inference, without exposing your data to third parties</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            When you use Chutes AI through Edlide, your code and prompts go directly to Chutes for inference. 
            Edlide does not see, store, or analyze your content during this process.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Minimal Data Collection</h2>
          <p className="text-muted-foreground mb-4">
            We may collect minimal data strictly for service improvement and operational purposes. This includes:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li><strong>Account Information:</strong> Email address for authentication and account management</li>
            <li><strong>Usage Statistics:</strong> Anonymous metrics such as feature usage frequency (not linked to content)</li>
            <li><strong>Authentication Tokens:</strong> Secure tokens for provider integration and session management</li>
            <li><strong>Error Reports:</strong> Anonymous crash or error reports (without code content or user data)</li>
            <li><strong>Device Information:</strong> Basic device type and OS version for compatibility</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            <strong>Important:</strong> Usage statistics are never associated with specific code, prompts, model 
            content, or user data. We analyze only anonymous patterns to improve product performance, reliability, 
            and user experience. We never sell, rent, or share this data with third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Third-Party Services</h2>
          <p className="text-muted-foreground mb-4">
            Edlide integrates with the following third-party services:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li><strong>Supabase:</strong> Used for user authentication and account management. Subject to Supabase's privacy policy.</li>
            <li><strong>Chutes AI:</strong> Provides confidential AI inference with zero data retention. See Chutes privacy policy for details.</li>
            <li><strong>AI Providers:</strong> When you choose to use external providers (OpenAI, Anthropic, Google, etc.), their respective policies apply.</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            We encourage reviewing third-party privacy policies before using their services. 
            Edlide has contracts in place with service providers to protect your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Data Storage and Security</h2>
          <p className="text-muted-foreground mb-4">
            Data security practices:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Authentication tokens are encrypted and stored securely</li>
            <li>We use industry-standard encryption (TLS/SSL) for data transmission</li>
            <li>No code or content is logged or retained by Edlide servers</li>
            <li>Access to data is strictly controlled and limited to authorized personnel</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Cookies and Tracking</h2>
          <p className="text-muted-foreground mb-4">
            On our website and services:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>We use essential cookies for authentication and session management only</li>
            <li>We do not use third-party tracking cookies or pixels</li>
            <li>We do not sell your data to advertisers or third parties</li>
            <li>We do not engage in cross-site tracking or behavioral targeting</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Children's Privacy</h2>
          <p className="text-muted-foreground">
            Edlide is a professional development tool not intended for users under 13 years of age. 
            We do not knowingly collect information from children under 13. If we become aware of such 
            collection, we will take immediate steps to delete it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Subscriptions and Billing</h2>
          <p className="text-muted-foreground mb-4">
            For paid subscription tiers:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Payment processing is handled through secure third-party payment processors</li>
            <li>We do not store complete credit card numbers or payment details</li>
            <li>Billing information is used solely for subscription management</li>
            <li>You can review and cancel subscriptions at any time from your account settings</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Data Retention</h2>
          <p className="text-muted-foreground">
            Minimal usage data is retained only as necessary for service operation, security, and improvement. 
            We automatically delete anonymized usage data after 12 months. You may delete your account at 
            any time, which will immediately remove all stored information except legal compliance data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Your Rights</h2>
          <p className="text-muted-foreground mb-4">
            Depending on your location, you may have the right to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Access a copy of your personal information we hold</li>
            <li>Request deletion of your account and associated data</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Object to or restrict processing of your data</li>
            <li>Request data portability</li>
            <li>Revoke consent for data processing where applicable</li>
            <li>Withdraw authorization for third-party services</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            To exercise these rights, contact us through our support channels. We will respond within 
            30 days, subject to any applicable legal extensions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy occasionally to reflect changes in our practices or legal 
            requirements. Any significant changes will be notified through in-app notifications, email 
            (for account holders), or website announcements. Continued use constitutes acceptance of updated terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">13. International Data Transfers</h2>
          <p className="text-muted-foreground">
            When using external AI providers, your data may be transferred to and processed in countries 
            other than your own. We ensure that such transfers comply with applicable data protection laws 
            and that adequate safeguards are in place. Chutes AI provides confidential compute and does not 
            retain your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">14. Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy, need to exercise your rights, or have privacy 
            concerns, please contact us through our support channels.
          </p>
        </section>
      </div>
    </div>
  )
}