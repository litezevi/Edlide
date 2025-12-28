export default function TermsOfUse() {
  return (
    <div className="container max-w-3xl py-20 px-4">
      <h1 className="text-4xl font-bold mb-8 text-primary">Terms of Use</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground mb-6">
          Last updated: December 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By using edlide, you accept and agree to be bound by these Terms of Use and our Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. License</h2>
          <p className="text-muted-foreground mb-4">
            edlide is open source software licensed under the MIT License. You are free to use, modify, 
            and distribute this software in accordance with the license terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Usage Guidelines</h2>
          <p className="text-muted-foreground mb-4">
            When using edlide, you agree to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Comply with all applicable laws and regulations</li>
            <li>Respect the terms of service of third-party AI providers you use</li>
            <li>Not use the software for illegal or harmful purposes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. AI Services</h2>
          <p className="text-muted-foreground">
            Your use of AI models through edlide is subject to the terms of the respective AI providers. 
            We are not responsible for the content or behavior of third-party AI services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Disclaimer</h2>
          <p className="text-muted-foreground">
            The software is provided "as is" without warranty of any kind. We are not liable for any 
            damages arising from the use of this software.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about these Terms, please contact us through our support channels.
          </p>
        </section>
      </div>
    </div>
  )
}