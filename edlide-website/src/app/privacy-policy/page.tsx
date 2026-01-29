import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const PRIVACY_POLICY_TEXT = `Privacy Policy

Last updated: January 2026

1. Introduction

At Edlide, we believe privacy is fundamental. This Privacy Policy explains our commitment 
to protecting your information when you use our AI-powered development environment.

Edlide is a commercial, proprietary product licensed under Apache 2.0. We maintain minimal 
data practices to respect your privacy while providing essential services.

2. Data We Do Not Collect

Edlide is designed with privacy-first principles. We do NOT collect:

- Your source code, project files, or codebases
- AI prompts, conversation content, or chat history
- Model outputs, generated code, or AI suggestions
- File contents or code analysis results
- User credentials beyond authentication tokens

Your code belongs to you. We do not access, store, or analyze your proprietary code or 
intellectual property.

3. AI Services and Confidential Computing

Edlide integrates with Chutes AI for inference services with enterprise-grade privacy:

- End-to-End Security: Your prompts and responses are encrypted throughout transmission
- Confidential Compute: Run and protect AI workloads with end-to-end security
- No Vendor Eyes: No Chutes provider eyes on your prompts or responses
- Pure Inference: Processing without data retention, logging, or analysis
- Zero Knowledge: Deploy proprietary models on decentralized infrastructure without fear
- Pure Confidence: Just pure inference, without exposing your data to third parties

When you use Chutes AI through Edlide, your code and prompts go directly to Chutes for inference. 
Edlide does not see, store, or analyze your content during this process.

4. Minimal Data Collection

We may collect minimal data strictly for service improvement and operational purposes. This includes:

- Account Information: Email address for authentication and account management
- Usage Statistics: Anonymous metrics such as feature usage frequency (not linked to content)
- Authentication Tokens: Secure tokens for provider integration and session management
- Error Reports: Anonymous crash or error reports (without code content or user data)
- Device Information: Basic device type and OS version for compatibility

Important: Usage statistics are never associated with specific code, prompts, model 
content, or user data. We analyze only anonymous patterns to improve product performance, reliability, 
and user experience. We never sell, rent, or share this data with third parties.

5. Third-Party Services

Edlide integrates with the following third-party services:

- Supabase: Used for user authentication and account management. Subject to Supabase's privacy policy.
- Chutes AI: Provides confidential AI inference with zero data retention. See Chutes privacy policy for details.
- AI Providers: When you choose to use external providers (OpenAI, Anthropic, Google, etc.), their respective policies apply.

We encourage reviewing third-party privacy policies before using their services. 
Edlide has contracts in place with service providers to protect your data.

6. Data Storage and Security

Data security practices:

- Authentication tokens are encrypted and stored securely
- We use industry-standard encryption (TLS/SSL) for data transmission
- No code or content is logged or retained by Edlide servers
- Access to data is strictly controlled and limited to authorized personnel

7. Cookies and Tracking

On our website and services:

- We use essential cookies for authentication and session management only
- We do not use third-party tracking cookies or pixels
- We do not sell your data to advertisers or third parties
- We do not engage in cross-site tracking or behavioral targeting

8. Children's Privacy

Edlide is a professional development tool not intended for users under 13 years of age. 
We do not knowingly collect information from children under 13. If we become aware of such 
collection, we will take immediate steps to delete it.

9. Subscriptions and Billing

For paid subscription tiers:

- Payment processing is handled through secure third-party payment processors
- We do not store complete credit card numbers or payment details
- Billing information is used solely for subscription management
- You can review and cancel subscriptions at any time from your account settings

10. Data Retention

Minimal usage data is retained only as necessary for service operation, security, and improvement. 
We automatically delete anonymized usage data after 12 months. You may delete your account at 
any time, which will immediately remove all stored information except legal compliance data.

11. Your Rights

Depending on your location, you may have the right to:

- Access a copy of your personal information we hold
- Request deletion of your account and associated data
- Correct inaccurate or incomplete information
- Object to or restrict processing of your data
- Request data portability
- Revoke consent for data processing where applicable
- Withdraw authorization for third-party services

To exercise these rights, contact us through our support channels. We will respond within 
30 days, subject to any applicable legal extensions.

12. Changes to This Policy

We may update this Privacy Policy occasionally to reflect changes in our practices or legal 
requirements. Any significant changes will be notified through in-app notifications, email 
(for account holders), or website announcements. Continued use constitutes acceptance of updated terms.

13. International Data Transfers

When using external AI providers, your data may be transferred to and processed in countries 
other than your own. We ensure that such transfers comply with applicable data protection laws 
and that adequate safeguards are in place. Chutes AI provides confidential compute and does not 
retain your data.

14. Contact

If you have questions about this Privacy Policy, need to exercise your rights, or have privacy 
concerns, please contact us through our support channels.
`

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-8 text-primary">Privacy Policy</h1>

        <section>
          <pre className="bg-surface border border-border rounded-lg p-6 text-sm overflow-x-auto whitespace-pre-wrap">
            {PRIVACY_POLICY_TEXT}
          </pre>
        </section>
      </div>
    </div>
  )
}