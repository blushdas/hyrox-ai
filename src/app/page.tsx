import { LandingHeader } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { SocialProof } from "@/components/landing/social-proof"
import { Features } from "@/components/landing/features"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <main className="min-h-screen" style={{ backgroundColor: "#070707" }}>
        <LandingHeader />
        <div id="hero">
          <Hero />
        </div>
        <SocialProof />
        <Features />
        <CtaSection />
        <Footer />
      </main>
    </div>
  )
}
