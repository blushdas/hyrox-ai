import Link from "next/link"
import { AppPreview } from "./app-preview"

export function Hero() {
  return (
    <section className="min-h-screen flex items-center pt-20 pb-16 px-4 sm:px-6" style={{ backgroundColor: "#070707" }}>
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left content */}
          <div className="lg:col-span-7 space-y-10">
            {/* Eyebrow */}
            <div className="inline-flex px-3 py-1" style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem" }}>
              <span className="text-xs font-normal tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>Now in Alpha</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1
                className="font-normal tracking-tight text-white"
                style={{ fontSize: "clamp(32px,3.5vw,52px)", lineHeight: "1.1", letterSpacing: "-0.02em" }}
              >
                Your First HYROX<br />
                Finish Line<br />
                Starts Here
              </h1>
              <p className="text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.5)" }}>
                FINISHER builds your personalized race-day plan from the official HYROX coaching manual.
                Every session. Every rep. Every week to race day.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Link
                href="#cta"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#22C55E] text-[#0F1A0E] text-sm font-medium rounded-lg hover:bg-[#22C55E]/90 transition-colors"
              >
                Get Early Access
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-normal transition-colors"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                See how it works →
              </Link>
            </div>
          </div>

          {/* Right — layered card stack */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <AppPreview />
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center mt-20 lg:mt-24">
          <Link href="#features" className="flex flex-col items-center gap-2 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="text-xs tracking-widest uppercase">scroll</span>
            <div className="w-px h-8" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
          </Link>
        </div>
      </div>
    </section>
  )
}
