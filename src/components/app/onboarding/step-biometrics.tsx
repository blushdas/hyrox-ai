"use client"

import { Input } from "@/components/ui/input"
import type { AthleteProfile } from "@/lib/types"

type Props = {
  data: Partial<AthleteProfile>
  onChange: (updates: Partial<AthleteProfile>) => void
}

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say"]

export function StepBiometrics({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] leading-7 font-semibold tracking-tight text-foreground mb-2">
          About you
        </h2>
        <p className="text-muted-foreground text-sm">
          Used to tailor station weights and recovery recommendations.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Age
          </label>
          <Input
            type="number"
            placeholder="e.g. 32"
            aria-label="Age"
            value={data.age ?? ""}
            onChange={(e) =>
              onChange({
                age: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="bg-surface-2 border-border text-foreground placeholder:text-muted-foreground"
            min={16}
            max={80}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Gender
          </label>
          <div className="flex flex-col">
            {genderOptions.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={data.gender === g}
                onClick={() => onChange({ gender: g })}
                className={`min-h-11 flex items-center justify-between p-3 border-b text-left text-sm font-medium transition-colors ${
                  data.gender === g
                    ? "border-primary bg-accent-soft text-foreground"
                    : "border-border bg-surface-2 text-muted-foreground hover:border-border/80"
                }`}
              >
                {g}
                <span
                  aria-hidden="true"
                  className={`size-4 border ${data.gender === g ? "bg-accent border-accent" : "border-hairline-strong"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Weight
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={data.weightUnit === "lbs" ? "e.g. 165" : "e.g. 75"}
              aria-label="Weight"
              value={data.weight ?? ""}
              onChange={(e) =>
                onChange({
                  weight: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="bg-surface-2 border-border text-foreground placeholder:text-muted-foreground flex-1"
            />
            <div className="flex rounded-sm border border-border overflow-hidden">
              {(["kg", "lbs"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  aria-pressed={data.weightUnit === unit}
                  onClick={() => onChange({ weightUnit: unit })}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    data.weightUnit === unit
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-2 text-muted-foreground hover:bg-surface-3"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
