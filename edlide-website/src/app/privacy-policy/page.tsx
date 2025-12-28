export default function PrivacyPolicy() {
  return (
    <div className="container max-w-3xl py-20 px-4">
      <h1 className="text-4xl font-bold mb-8 text-primary">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground mb-6">
          Last updated: December 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
          <p className="text-muted-foreground">
            At edlide, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
            and protect your information when you use our IDE and services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Data Collection</h2>
          <p className="text-muted-foreground mb-4">
            We collect minimal data necessary to provide our services:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li>Account information (email) when you sign up</li>
            <li>Authentication tokens for AI provider integration</li>
            <li>Usage statistics to improve our services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Your Data</h2>
          <p className="text-muted-foreground">
            Your code, models, and AI interactions are yours. We do not collect, store, or analyze 
            your code or AI prompts. All processing happens locally or through your chosen AI providers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Third-Party Services</h2>
          <p className="text-muted-foreground">
            We use Supabase for authentication and Chutes for AI inference. Your data is subject to 
            their respective privacy policies when using these services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Contact</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy, please contact us through our support channels.
          </p>
        </section>
      </div>
    </div>
  )
}