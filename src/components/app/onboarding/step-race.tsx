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
        <h2 className="text-[22px] leading-7 font-semibold tracking-tight text-foreground mb-2">
          When&apos;s your race?
        </h2>
        <p className="text-muted-foreground text-sm">
          We&apos;ll set you up with a 12-week HYROX plan for your category.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Race Date *
          </label>
          <Input
            aria-label="Race Date"
            type="date"
            value={data.raceDate ?? ""}
            onChange={(e) => onChange({ raceDate: e.target.value })}
            className="bg-surface-2 border-border text-foreground"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Location (optional)
          </label>
          <Input
            aria-label="Location"
            type="text"
            placeholder="e.g. London, Manchester, Sydney"
            value={data.location ?? ""}
            onChange={(e) => onChange({ location: e.target.value })}
            className="bg-surface-2 border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Category
          </label>
          <div className="space-y-0">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                aria-pressed={data.category === cat.value}
                onClick={() => onChange({ category: cat.value })}
                className={`w-full flex items-center justify-between p-4 border-b transition-colors ${
                  data.category === cat.value
                    ? "border-primary bg-accent-soft text-foreground"
                    : "border-border bg-surface-2 text-muted-foreground hover:border-border/80"
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm">{cat.label}</div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">
                    {cat.desc}
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className={`size-4 shrink-0 rounded-xs border ${data.category === cat.value ? "border-accent bg-accent" : "border-hairline-strong"}`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
