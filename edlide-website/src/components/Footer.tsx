export function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">
          © 2026 Edlide. All rights reserved.
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <span className="text-muted-foreground/30">|</span>
          <a href="/terms-of-use" className="hover:text-foreground transition-colors">Terms of Use</a>
          <span className="text-muted-foreground/30">|</span>
          <a href="/licenses" className="hover:text-foreground transition-colors">Licenses</a>
        </div>
        <div className="text-sm text-muted-foreground">
          Built with Edlide
        </div>
      </div>
    </footer>
  )
}
