// CSS-only layered card stack — no images, no device frames

// Card 1 (front): Dashboard with countdown + phase banner + mini grid
function FrontCard() {
  return (
    <div className="absolute inset-0 bg-[#111111] rounded-md p-5 shadow-2xl shadow-black/50" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Week 6 of 12</div>
          <div className="text-sm font-black text-white">Build Phase</div>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.4)" }}>
          <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
        </div>
      </div>

      {/* Countdown */}
      <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <div className="text-[9px] text-[#9CA3AF] uppercase tracking-widest mb-1">Race Day</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-[#22C55E]">42</span>
          <span className="text-xs text-white font-medium">days to go</span>
        </div>
      </div>

      {/* Mini week grid */}
      <div className="mb-3">
        <div className="text-[9px] text-[#9CA3AF] uppercase tracking-widest mb-2">This Week</div>
        <div className="grid grid-cols-7 gap-1">
          {[
            { label: "M", color: "#3B82F6" },
            { label: "T", color: "rgba(255,255,255,0.08)" },
            { label: "W", color: "#EF4444" },
            { label: "T", color: "rgba(255,255,255,0.08)" },
            { label: "F", color: "#F97316" },
            { label: "S", color: "#EF4444" },
            { label: "S", color: "#22C55E" },
          ].map((day, i) => (
            <div key={i} className="text-center">
              <div className="text-[8px] text-[#9CA3AF] mb-0.5">{day.label}</div>
              <div
                className="rounded py-1"
                style={{ backgroundColor: day.color + (day.color.startsWith("rgba") ? "" : "33"), borderWidth: 1, borderColor: day.color + (day.color.startsWith("rgba") ? "" : "55") }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Next session */}
      <div className="rounded-xl p-3" style={{ backgroundColor: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
          <span className="text-[9px] text-[#9CA3AF] uppercase tracking-widest">Next</span>
        </div>
        <div className="text-xs font-bold text-white">Threshold Intervals</div>
        <div className="text-[9px] text-[#9CA3AF] mt-0.5">50 min · 4×6 min @ RPE 8</div>
      </div>
    </div>
  )
}

// Card 2 (middle): Week calendar grid
function MiddleCard() {
  const sessions = [
    { day: "Mon", type: "Engine Builder", color: "#3B82F6", duration: "45 min" },
    { day: "Wed", type: "Station Work", color: "#EF4444", duration: "60 min" },
    { day: "Fri", type: "Threshold Run", color: "#F97316", duration: "50 min" },
    { day: "Sat", type: "Stations + Strength", color: "#EF4444", duration: "75 min" },
  ]

  return (
    <div className="absolute inset-0 bg-[#111111] rounded-md p-5 shadow-2xl shadow-black/50" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mb-3">Week Schedule</div>
      <div className="space-y-2">
        {sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-white truncate">{s.type}</div>
              <div className="text-[9px] text-[#9CA3AF]">{s.day} · {s.duration}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Card 3 (back): Session detail card
function BackCard() {
  return (
    <div className="absolute inset-0 bg-[#111111] rounded-md p-5 shadow-2xl shadow-black/50" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
        <span className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Threshold</span>
      </div>
      <div className="text-sm font-black text-white mb-1">Threshold Intervals</div>
      <div className="text-[10px] text-[#9CA3AF] mb-4">50 min · Friday</div>
      <div className="space-y-2">
        {["Warmup: 10 min easy jog", "4×6 min @ RPE 8 / 2 min rest", "Cooldown: 8 min walk"].map((item, i) => (
          <div key={i} className="text-[10px] text-[#9CA3AF] rounded-lg px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppPreview() {
  return (
    <div className="relative w-full max-w-[420px] h-[480px] mx-auto">
      {/* Subtle glow */}
      <div className="absolute inset-0 -z-10 blur-3xl bg-[#22C55E]/5 rounded-full scale-90" />

      {/* Card 3 — back */}
      <div className="absolute inset-0" style={{ transform: "rotate(6deg) translateY(16px) translateX(12px)", opacity: 0.4 }}>
        <BackCard />
      </div>

      {/* Card 2 — middle */}
      <div className="absolute inset-0" style={{ transform: "rotate(2deg) translateY(8px)", opacity: 0.7 }}>
        <MiddleCard />
      </div>

      {/* Card 1 — front */}
      <div className="absolute inset-0">
        <FrontCard />
      </div>
    </div>
  )
}
