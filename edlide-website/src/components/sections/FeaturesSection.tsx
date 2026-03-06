export function FeaturesSection() {
  return (
    <section className="py-24 px-4 border-t">
      <div className="container max-w-6xl">
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4 text-primary">
            Ready to take control of your AI development?
          </h3>
          <p className="text-muted-foreground mb-8">
            Join thousands of developers who've already made the switch to true open source freedom.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Active Developers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Supported Models</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
            </div>
          </div>

          <p className="text-2xl font-bold mt-12 text-foreground">
            Powered by Chutes
          </p>
        </div>
      </div>
    </section>
  )
}