"use client"

import type { AthleteProfile } from "@/lib/types"

type Props = {
  data: Partial<AthleteProfile>
  onChange: (updates: Partial<AthleteProfile>) => void
}

const dayOptions = [
  { value: 3 as const, label: "3 days", desc: "Minimum effective" },
  { value: 4 as const, label: "4 days", desc: "Recommended for beginners (used by Coach AI)" },
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
        <h2 className="text-[22px] leading-7 font-semibold tracking-tight text-foreground mb-2">
          Training availability
        </h2>
        <p className="text-muted-foreground text-sm">
          Be honest — the plan only works if you can show up.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Days per week
          </label>
          <div className="space-y-0">
            {dayOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={data.daysPerWeek === opt.value}
                onClick={() => onChange({ daysPerWeek: opt.value })}
                className={`w-full flex items-center justify-between p-4 border-b transition-colors ${
                  data.daysPerWeek === opt.value
                    ? "border-primary bg-accent-soft text-foreground"
                    : "border-border bg-surface-2 text-muted-foreground hover:border-border/80"
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">
                    {opt.desc}
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className={`size-4 shrink-0 rounded-xs border ${data.daysPerWeek === opt.value ? "border-accent bg-accent" : "border-hairline-strong"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Session length
          </label>
          <div className="flex flex-col">
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={data.sessionLength === opt.value}
                onClick={() => onChange({ sessionLength: opt.value })}
                className={`min-h-11 flex items-center justify-between p-3 border-b text-left text-sm font-medium transition-colors ${
                  data.sessionLength === opt.value
                    ? "border-primary bg-accent-soft text-foreground"
                    : "border-border bg-surface-2 text-muted-foreground hover:border-border/80"
                }`}
              >
                <span className="font-mono">{opt.label}</span>
                <span
                  aria-hidden="true"
                  className={`size-4 border ${data.sessionLength === opt.value ? "bg-accent border-accent" : "border-hairline-strong"}`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
