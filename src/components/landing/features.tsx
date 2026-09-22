// Feature visuals — pure CSS, no images

type VisualProps = { light?: boolean }

function PlanVisual({ light }: VisualProps) {
  const phases = [
    { label: "Foundation", weeks: "Wk 1–4", color: "#22C55E", width: "25%" },
    { label: "Build", weeks: "Wk 5–8", color: "#3B82F6", width: "25%" },
    { label: "Peak", weeks: "Wk 9–11", color: "#F97316", width: "19%" },
    { label: "Taper", weeks: "Wk 12", color: "#8B5CF6", width: "6%" },
  ]
  return (
    <div
      className="rounded-md p-6"
      style={
        light
          ? { backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.08)" }
          : { backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }
      }
    >
      <div className="text-xs uppercase tracking-widest mb-4" style={{ color: light ? "#666" : "rgba(255,255,255,0.4)" }}>
        12-Week Plan
      </div>
      <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-px">
        {phases.map((p) => (
          <div key={p.label} className="h-full rounded-full" style={{ width: p.width, backgroundColor: p.color }} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {phases.map((p) => (
          <div key={p.label}>
            <div className="w-2 h-2 rounded-full mb-1" style={{ backgroundColor: p.color }} />
            <div className="text-[10px] font-bold" style={{ color: light ? "#111" : "#fff" }}>{p.label}</div>
            <div className="text-[9px]" style={{ color: light ? "#666" : "rgba(255,255,255,0.4)" }}>{p.weeks}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionVisual({ light }: VisualProps) {
  const sets = [
    { label: "Warmup", detail: "10 min easy run", color: "#22C55E" },
    { label: "Main Set", detail: "4×6 min @ RPE 8 / 2 min rest", color: "#F97316" },
    { label: "Station Work", detail: "3×15 SkiErg + 10 Burpee Broad Jump", color: "#EF4444" },
    { label: "Cooldown", detail: "8 min walk + stretch", color: "#3B82F6" },
  ]
  return (
    <div
      className="rounded-md p-6 space-y-3"
      style={
        light
          ? { backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.08)" }
          : { backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }
      }
    >
      <div className="text-xs uppercase tracking-widest" style={{ color: light ? "#666" : "rgba(255,255,255,0.4)" }}>
        Threshold Session · 60 min
      </div>
      {sets.map((s) => (
        <div key={s.label} className="flex gap-3 items-start">
          <div className="w-1 h-full min-h-[32px] rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: s.color }} />
          <div>
            <div className="text-xs font-bold" style={{ color: light ? "#111" : "#fff" }}>{s.label}</div>
            <div className="text-[11px]" style={{ color: light ? "#666" : "rgba(255,255,255,0.4)" }}>{s.detail}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProgressVisual({ light }: VisualProps) {
  const weeks = [3, 5, 4, 6, 5, 7, 6, 4]
  const max = Math.max(...weeks)
  return (
    <div
      className="rounded-md p-6"
      style={
        light
          ? { backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.08)" }
          : { backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }
      }
    >
      <div className="text-xs uppercase tracking-widest mb-4" style={{ color: light ? "#666" : "rgba(255,255,255,0.4)" }}>
        Sessions Completed
      </div>
      <div className="flex items-end gap-2 h-20">
        {weeks.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${(v / max) * 64}px`,
                backgroundColor:
                  i === weeks.length - 1
                    ? "#22C55E"
                    : light
                    ? "rgba(0,0,0,0.08)"
                    : "rgba(255,255,255,0.08)",
              }}
            />
            <div className="text-[8px]" style={{ color: light ? "#666" : "rgba(255,255,255,0.4)" }}>W{i + 1}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
        <span className="text-[11px]" style={{ color: light ? "#666" : "rgba(255,255,255,0.4)" }}>38 of 48 sessions complete</span>
      </div>
    </div>
  )
}

const panels = [
  {
    number: "01",
    title: "Race-Day Ready Plans",
    description:
      "12-week periodized training built on the official HYROX coaching framework. Foundation → Build → Peak → Taper. Every phase has a purpose.",
    Visual: PlanVisual,
    dark: true,
    flip: false,
  },
  {
    number: "02",
    title: "Session-Level Detail",
    description:
      "Every warmup, working set, pace, RPE, and rest interval is prescribed. No guesswork. Show up, execute, repeat.",
    Visual: SessionVisual,
    dark: false,
    flip: true,
  },
  {
    number: "03",
    title: "Track Your Journey",
    description:
      "Mark sessions complete, skip when life happens, see your progress week over week. Race day confidence comes from the log.",
    Visual: ProgressVisual,
    dark: true,
    flip: false,
  },
]

export function Features() {
  return (
    <div id="features">
      {panels.map((panel) => (
        <section key={panel.number} style={{ backgroundColor: panel.dark ? "#0A0A0A" : "#F5F5F5" }}>
          <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
            <div className={panel.flip ? "lg:order-2" : ""}>
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ color: panel.dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}
              >
                {panel.number} —
              </p>
              <h2
                className="font-normal tracking-tight mb-6"
                style={{
                  fontSize: "clamp(28px,3vw,44px)",
                  lineHeight: "1.1",
                  letterSpacing: "-0.02em",
                  color: panel.dark ? "#fff" : "#111",
                }}
              >
                {panel.title}
              </h2>
              <p
                className="text-base leading-relaxed max-w-md"
                style={{ color: panel.dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}
              >
                {panel.description}
              </p>
            </div>
            <div className={panel.flip ? "lg:order-1" : ""}>
              <panel.Visual light={!panel.dark} />
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
