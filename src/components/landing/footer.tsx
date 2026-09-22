import { Logo } from "@/components/shared/logo"
import Link from "next/link"

export function Footer() {
  return (
    <footer
      className="px-4 sm:px-6 pt-16 pb-10"
      style={{ backgroundColor: "#070707", borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* 4-column grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground mt-3 max-w-[200px]">
              Personalized HYROX training plans. Built from the official coaching manual.
            </p>
            <p className="text-xs text-muted-foreground mt-4">Built by Astra Applications</p>
          </div>

          {/* Col 2: Product */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="/onboarding" className="text-sm text-muted-foreground hover:text-white transition-colors">App</Link></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li><span className="text-sm text-muted-foreground">About</span></li>
              <li><span className="text-sm text-muted-foreground">Blog</span></li>
              <li><span className="text-sm text-muted-foreground">Press</span></li>
            </ul>
          </div>

          {/* Col 4: Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><span className="text-sm text-muted-foreground">Privacy</span></li>
              <li><span className="text-sm text-muted-foreground">Terms</span></li>
              <li><span className="text-sm text-muted-foreground">Contact</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FINISHER. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            HYROX is a registered trademark of HYROX GmbH. FINISHER is not affiliated with HYROX GmbH.
          </p>
        </div>
      </div>
    </footer>
  )
}
