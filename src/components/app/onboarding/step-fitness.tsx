"use client"

import { Input } from "@/components/ui/input"
import type { AthleteProfile } from "@/lib/types"

type Props = {
  data: Partial<AthleteProfile>
  onChange: (updates: Partial<AthleteProfile>) => void
}

export function StepFitness({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white mb-2">Your fitness baseline</h2>
        <p className="text-muted-foreground text-sm">This helps us calibrate your plan intensity. Estimates are fine.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white mb-1 block">5K Time</label>
          <div className="text-xs text-muted-foreground mb-2">Your best or recent 5K run time</div>
          <Input
            type="text"
            placeholder="MM:SS (e.g. 28:00)"
            value={data.fiveKTime ?? ""}
            onChange={(e) => onChange({ fiveKTime: e.target.value })}
            className="bg-surface border-border text-white placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-1 block">10K Time</label>
          <div className="text-xs text-muted-foreground mb-2">Your best or recent 10K run time</div>
          <Input
            type="text"
            placeholder="MM:SS (e.g. 58:00)"
            value={data.tenKTime ?? ""}
            onChange={(e) => onChange({ tenKTime: e.target.value })}
            className="bg-surface border-border text-white placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-white mb-1 block">
            Previous HYROX Time <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="text-xs text-muted-foreground mb-2">Leave blank if this is your first race</div>
          <Input
            type="text"
            placeholder="HH:MM:SS (e.g. 1:45:00)"
            value={data.hyroxTime ?? ""}
            onChange={(e) => onChange({ hyroxTime: e.target.value })}
            className="bg-surface border-border text-white placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="p-3 bg-surface/50 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground">
          Don&apos;t know your times? That&apos;s fine — skip them. We&apos;ll use your training availability and self-assessment to calibrate your plan.
        </p>
      </div>
    </div>
  )
}
