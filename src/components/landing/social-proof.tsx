export function SocialProof() {
  const stats = [
    { value: "1.3M+", label: "HYROX Athletes" },
    { value: "5,000+", label: "Affiliated Gyms" },
    { value: "8", label: "Race Stations" },
    { value: "85+", label: "Countries" },
  ]

  return (
    <section
      className="px-4 sm:px-6 py-16"
      style={{
        backgroundColor: "#0A0A0A",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <div
              className="font-normal text-white text-4xl sm:text-5xl mb-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              {stat.value}
            </div>
            <div
              className="text-xs uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
