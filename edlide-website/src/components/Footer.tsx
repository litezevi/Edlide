export function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="container flex flex-col md:flex-row h-auto md:h-16 items-center justify-between px-4 py-3 md:py-0 gap-2 md:gap-0">
        <div className="text-xs md:text-sm text-muted-foreground">
          © 2026 Edlide. All rights reserved.
        </div>
        <div className="flex flex-wrap md:flex-nowrap justify-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
          <a href="/privacy-policy" className="hover:text-foreground transition-colors whitespace-nowrap">Privacy Policy</a>
          <span className="text-muted-foreground/30">•</span>
          <a href="/terms-of-use" className="hover:text-foreground transition-colors whitespace-nowrap">Terms of Use</a>
          <span className="text-muted-foreground/30">•</span>
          <a href="/licenses" className="hover:text-foreground transition-colors whitespace-nowrap">Licenses</a>
          <span className="text-muted-foreground/30">•</span>
          <a href="/contact" className="hover:text-foreground transition-colors whitespace-nowrap">Contact Us</a>
        </div>
        <div className="text-xs md:text-sm text-muted-foreground">
          Built with Edlide
        </div>
      </div>
    </footer>
  )
}
