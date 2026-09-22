import { WaitlistForm } from "./waitlist-form"

export function CtaSection() {
  return (
    <section
      id="cta"
      className="py-32 px-4 sm:px-6"
      style={{ backgroundColor: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>
          Free During Alpha
        </p>
        <h2
          className="font-normal text-white mb-6"
          style={{ fontSize: "clamp(32px,4vw,56px)", lineHeight: "1.1", letterSpacing: "-0.02em" }}
        >
          Your Race Date Is Set.<br />Your Plan Should Be Too.
        </h2>
        <p className="text-base mb-12 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
          Join founding athletes. Get early access before launch. Free forever for founding members.
        </p>
        <WaitlistForm className="max-w-xl mx-auto" />
      </div>
    </section>
  )
}
