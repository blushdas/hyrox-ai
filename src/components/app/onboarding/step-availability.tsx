"use client"

import type { AthleteProfile } from "@/lib/types"

type Props = {
  data: Partial<AthleteProfile>
  onChange: (updates: Partial<AthleteProfile>) => void
}

const dayOptions = [
  { value: 3 as const, label: "3 days", desc: "Minimum effective" },
  { value: 4 as const, label: "4 days", desc: "Recommended for beginners" },
  { value: 5 as const, label: "5 days", desc: "Full program" },
]

const durationOptions = [
  { value: 45 as const, label: "45 min" },
  { value: 60 as const, label: "60 min" },
  { value: 75 as const, label: "75 min" },
  { value: 90 as const, label: "90 min" },
]

export function StepAvailability({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-2">Training availability</h2>
        <p className="text-muted-foreground text-sm">Be honest — the plan only works if you can show up.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-white mb-3 block">Days per week</label>
          <div className="space-y-2">
            {dayOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ daysPerWeek: opt.value })}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  data.daysPerWeek === opt.value
                    ? "border-primary bg-primary/10 text-white"
                    : "border-border bg-surface text-muted-foreground hover:border-border/80"
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                </div>
                {data.daysPerWeek === opt.value && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-3 block">Session length</label>
          <div className="grid grid-cols-2 gap-2">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ sessionLength: opt.value })}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  data.sessionLength === opt.value
                    ? "border-primary bg-primary/10 text-white"
                    : "border-border bg-surface text-muted-foreground hover:border-border/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
