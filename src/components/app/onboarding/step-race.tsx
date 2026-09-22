"use client"

import { Input } from "@/components/ui/input"
import type { AthleteProfile, RaceCategory } from "@/lib/types"

type Props = {
  data: Partial<AthleteProfile>
  onChange: (updates: Partial<AthleteProfile>) => void
}

const categories: { value: RaceCategory; label: string; desc: string }[] = [
  { value: "open", label: "Open", desc: "Individual, any pace" },
  { value: "pro", label: "Pro", desc: "Competitive waves" },
  { value: "doubles", label: "Doubles", desc: "Team of 2" },
]

export function StepRace({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-2">When&apos;s your race?</h2>
        <p className="text-muted-foreground text-sm">We&apos;ll build your plan backwards from race day.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Race Date *</label>
          <Input
            type="date"
            value={data.raceDate ?? ""}
            onChange={(e) => onChange({ raceDate: e.target.value })}
            className="bg-surface border-border text-white"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Location (optional)</label>
          <Input
            type="text"
            placeholder="e.g. London, Manchester, Sydney"
            value={data.location ?? ""}
            onChange={(e) => onChange({ location: e.target.value })}
            className="bg-surface border-border text-white placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-3 block">Category</label>
          <div className="space-y-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => onChange({ category: cat.value })}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  data.category === cat.value
                    ? "border-primary bg-primary/10 text-white"
                    : "border-border bg-surface text-muted-foreground hover:border-border/80"
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm">{cat.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{cat.desc}</div>
                </div>
                {data.category === cat.value && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
