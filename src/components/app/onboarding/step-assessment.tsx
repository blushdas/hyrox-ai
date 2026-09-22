"use client"

import type { AthleteProfile, FitnessLevel } from "@/lib/types"

type Props = {
  data: Partial<AthleteProfile>
  onChange: (updates: Partial<AthleteProfile>) => void
}

const levels: { value: FitnessLevel; label: string; desc: string }[] = [
  {
    value: "beginner_low",
    label: "Just getting started",
    desc: "I run occasionally. Not consistent with the gym. The race feels very ambitious.",
  },
  {
    value: "beginner_mid",
    label: "Some base fitness",
    desc: "I work out 2-3x/week. I can run 5K without stopping but it's hard.",
  },
  {
    value: "beginner_high",
    label: "Decent fitness",
    desc: "I train regularly. I run, lift, or do CrossFit. I just haven't done HYROX-specific prep.",
  },
]

export function StepAssessment({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-2">Where are you right now?</h2>
        <p className="text-muted-foreground text-sm">Be honest. This is just for calibration — not judgment.</p>
      </div>

      <div className="space-y-3">
        {levels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange({ fitnessLevel: level.value })}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              data.fitnessLevel === level.value
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:border-border/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`font-semibold text-sm mb-1 ${data.fitnessLevel === level.value ? "text-white" : "text-white"}`}>
                  {level.label}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{level.desc}</div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 transition-colors ${
                  data.fitnessLevel === level.value
                    ? "border-primary bg-primary"
                    : "border-border"
                }`}
              >
                {data.fitnessLevel === level.value && (
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">Ready to build your plan.</span> After this, we&apos;ll generate your personalized 12-week program.
        </p>
      </div>
    </div>
  )
}
