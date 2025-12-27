export default function DocsPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-4xl font-bold text-primary mb-8">Documentation</h1>
      
      <div className="space-y-8">
        <section className="border rounded-lg p-6 bg-card">
          <h2 className="text-2xl font-semibold text-primary mb-4">Getting Started</h2>
          <p className="text-muted-foreground mb-4">
            Welcome to Edlide IDE documentation. Here you'll find everything you need to get started with open source AI model development.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Installation and setup instructions</li>
            <li>• Working with your first open source model</li>
            <li>• Basic configuration and preferences</li>
          </ul>
        </section>

        <section className="border rounded-lg p-6 bg-card">
          <h2 className="text-2xl font-semibold text-primary mb-4">Model Integration</h2>
          <p className="text-muted-foreground mb-4">
            Learn how to integrate and work with various open source AI models in Edlide.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Supported model formats and frameworks</li>
            <li>• Model optimization and quantization</li>
            <li>• Fine-tuning workflows</li>
          </ul>
        </section>

        <section className="border rounded-lg p-6 bg-card">
          <h2 className="text-2xl font-semibold text-primary mb-4">Advanced Topics</h2>
          <p className="text-muted-foreground mb-4">
            Deep dive into advanced features and customization options.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Custom model development tools</li>
            <li>• Performance optimization</li>
            <li>• Plugin development</li>
          </ul>
        </section>
      </div>
    </div>
  )
}