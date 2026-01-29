import Link from "next/link"
import { ArrowLeft } from "lucide-react"

const TERMS_OF_USE_TEXT = `Terms of Use

Last updated: January 2026

1. Acceptance of Terms

By using Edlide, you accept and agree to be bound by these Terms of Use and our Privacy Policy. 
These terms constitute a legally binding agreement between you and Edlide.

2. About Edlide

Edlide is an AI-powered development environment and is a commercial, proprietary product licensed 
under the Apache 2.0 License.

Ownership: Edlide and all associated intellectual property, including the Edlide 
name, logo, trademarks, branding, proprietary code, features, and functionality, are the exclusive 
property of Edlide.

You may not use Edlide's name, logo, trademarks, or branding without explicit written permission. 
Edlide is a closed, proprietary product.

3. Pricing and Subscriptions

Edlide is currently available for free. We reserve the right to introduce paid subscription tiers 
and pricing plans in the future, which may include:

- Premium features and AI capabilities
- Chutes AI integration with enhanced limits
- Priority support and early access to new features
- Enterprise and team plans

Any changes to pricing will be communicated to users in advance. Free users may continue to use 
previously free features, but new or enhanced features may require a subscription.

4. Usage Guidelines

When using Edlide, you agree to:

- Comply with all applicable laws and regulations
- Respect the terms of service of third-party AI providers you use
- Not use the software for illegal or harmful purposes
- Not attempt to reverse engineer, decompile, or disassemble the software
- Not copy, modify, or distribute Edlide except as permitted by law
- Not use automated means to access or use the service abusively
- Not interfere with or disrupt the service or servers

5. AI Services and Data Flow

Edlide integrates with Chutes AI for inference services with the following privacy characteristics:

- Your prompts and code are sent directly to Chutes for inference
- Chutes provides confidential compute with end-to-end security
- No vendor or provider eyes on your prompts or responses
- Pure inference without data retention by intermediaries
- Deploy proprietary models on decentralized infrastructure without fear

Your use of AI models through Edlide is subject to the terms of the respective AI providers, 
including Chutes AI. Edlide is not responsible for the content or behavior of third-party AI services.

6. Data Collection

Edlide does not collect your code, prompts, or AI interactions. We may collect minimal usage 
data for service improvements. This data:

- Is never linked to specific code content or model prompts
- May include anonymous usage patterns (e.g., feature usage frequency)
- Is used solely for improving the product and user experience
- Is never sold, rented, or shared with third parties

7. Disclaimer of Warranties

Edlide is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, 
whether express or implied. To the maximum extent permitted by law, Edlide expressly disclaims 
all warranties, including but not limited to:

- That the product will always work without errors or interruptions
- That the product is suitable for any specific purpose or business need
- The accuracy, reliability, or completeness of AI-generated results or suggestions
- Security or protection against all threats, vulnerabilities, or attacks
- The absence of bugs, defects, errors, or data loss
- System uptime, availability, or performance guarantees
- Compatibility with all systems, platforms, or third-party software
- The quality, safety, or effectiveness of code generated or suggested by AI
- Any specific outcomes, results, revenue, profit, or success from using the product
- That errors will be corrected or that the product will meet your requirements

8. Limitation of Liability

To the maximum extent permitted by applicable law, Edlide, its developers, officers, directors, 
employees, agents, contractors, affiliates, and suppliers shall not be liable for any indirect, 
incidental, special, consequential, or punitive damages, including but not limited to:

- Loss of data, information, or business opportunities
- Damages or losses from code errors, bugs, or AI inaccuracies
- Damages from system failures, crashes, downtime, or service interruptions
- Loss of profits, revenue, income, or business relationships
- Damages from security breaches, unauthorized access, or data exposure
- Any damages from third-party AI provider services or outages
- Damages from incorrect, incomplete, or harmful AI suggestions
- Time lost or costs incurred debugging, troubleshooting, or recovering from issues
- Damages from incompatibility with other software, systems, or services
- Any indirect damages resulting from product use or inability to use the product
- Costs of recovering, replacing, or restoring lost or damaged data
- Damages from AI-generated code that contains errors, vulnerabilities, or security issues
- Any other damages arising from the use, non-use, or inability to use the product

In no event shall Edlide's total aggregate liability to you for all claims exceed the greater 
of (a) the amount you actually paid, if any, for accessing or using the product, or (b) $100.00.

Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, 
so the above limitations may not apply to you. In such jurisdictions, our liability is limited 
to the maximum extent permitted by applicable law.

9. Intellectual Property

Edlide Ownership: Edlide and all associated intellectual property rights, including:

- The Edlide name, brand identity, and company name
- Edlide logos, trademarks, service marks, and trade dress
- Website design, layout, and content
- Proprietary code, features, and functionality
- Documentation, marketing materials, promotional content, and assets
- Product designs, user interfaces, and user experience

Are the exclusive property of Edlide. All rights reserved.

Your Code: You retain ownership of all code you create using Edlide. 
Edlide claims no ownership of your code or projects.

Apache 2.0 License: Edlide is licensed under the Apache 2.0 License. 
See our Licenses page for the full license text.

10. Account Security and Access

You are responsible for:

- Maintaining the confidentiality of your account credentials
- All activities that occur under your account
- Notifying Edlide immediately of any unauthorized use
- Providing accurate and complete account information

Edlide reserves the right to suspend or terminate accounts for violations of these Terms, 
fraudulent activity, or any reason at Edlide's sole discretion.

11. Modifications to Terms

Edlide reserves the right to modify these Terms at any time. Continued use of the product after 
changes constitutes acceptance of the updated Terms. We will notify users of significant changes 
through in-app notifications or website announcements.

12. Termination

Edlide may terminate or suspend your access to the service at any time, with or without cause, 
with or without notice. Upon termination, your right to use the service will immediately cease.

13. Governing Law and Dispute Resolution

These Terms shall be governed by the laws of the jurisdiction in which Edlide is registered. 
Any disputes shall be resolved through binding arbitration, and you waive your right to a jury trial.

14. Severability

If any provision of these Terms is found to be unenforceable or invalid, such provision shall 
be limited or eliminated to the minimum extent necessary and the remaining provisions shall 
remain in full force and effect.

15. Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
Edlide regarding your use of the service.

16. Contact

If you have questions about these Terms, please contact us through our support channels.
`

export default function TermsOfUse() {
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

        <h1 className="text-3xl font-bold mb-8 text-primary">Terms of Use</h1>

        <section>
          <pre className="bg-surface border border-border rounded-lg p-6 text-sm overflow-x-auto whitespace-pre-wrap">
            {TERMS_OF_USE_TEXT}
          </pre>
        </section>
      </div>
    </div>
  )
}