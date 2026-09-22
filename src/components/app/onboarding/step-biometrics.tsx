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
        <h2 className="text-2xl font-black text-white mb-2">About you</h2>
        <p className="text-muted-foreground text-sm">Used to tailor station weights and recovery recommendations.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Age</label>
          <Input
            type="number"
            placeholder="e.g. 32"
            value={data.age ?? ""}
            onChange={(e) => onChange({ age: e.target.value ? parseInt(e.target.value) : null })}
            className="bg-surface border-border text-white placeholder:text-muted-foreground"
            min={16}
            max={80}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {genderOptions.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onChange({ gender: g })}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  data.gender === g
                    ? "border-primary bg-primary/10 text-white"
                    : "border-border bg-surface text-muted-foreground hover:border-border/80"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-2 block">Weight</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={data.weightUnit === "lbs" ? "e.g. 165" : "e.g. 75"}
              value={data.weight ?? ""}
              onChange={(e) => onChange({ weight: e.target.value ? parseFloat(e.target.value) : null })}
              className="bg-surface border-border text-white placeholder:text-muted-foreground flex-1"
            />
            <div className="flex rounded-xl border border-border overflow-hidden">
              {(["kg", "lbs"] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => onChange({ weightUnit: unit })}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    data.weightUnit === unit
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground hover:bg-surface-alt"
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
