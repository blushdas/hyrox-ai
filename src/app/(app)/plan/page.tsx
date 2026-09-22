"use client"

import { usePlanStore } from "@/stores/plan-store"
import { IntensityChart } from "@/components/app/intensity-chart"

const SESSION_TYPE_META = [
  { label: "Foundation / Power", color: "#EF4444", dot: "bg-red-500" },
  { label: "Engine Builder", color: "#3B82F6", dot: "bg-blue-500" },
  { label: "Aerobic / Recovery", color: "#22C55E", dot: "bg-green-500" },
  { label: "Race Simulation", color: "#8B5CF6", dot: "bg-violet-500" },
]

export default function PlanPage() {
  const { plan, currentWeek } = usePlanStore()

  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">No plan yet. Complete onboarding to generate your plan.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Training Load</h1>
        <p className="text-sm text-muted-foreground mt-0.5">12-week intensity overview</p>
      </div>

      {/* Chart card */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Weekly Intensity</span>
          <span className="text-xs text-primary font-medium">Week {currentWeek} of {plan.totalWeeks}</span>
        </div>
        <IntensityChart plan={plan} currentWeek={currentWeek} />
      </div>

      {/* Legend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Session Types</p>
        <div className="grid grid-cols-2 gap-2">
          {SESSION_TYPE_META.map(({ label, color, dot }) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`}
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phase breakdown */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Phase Breakdown</p>
        <div className="space-y-2">
          {[
            { label: "Base", weeks: "1–4", color: "#3B82F6", desc: "Movement prep + aerobic foundation" },
            { label: "Build", weeks: "5–8", color: "#F97316", desc: "Pace development + station volume" },
            { label: "Peak", weeks: "9–11", color: "#EF4444", desc: "Race-pace intervals + full simulations" },
            { label: "Taper", weeks: "12", color: "#22C55E", desc: "Sharpen, recover, race ready" },
          ].map(({ label, weeks, color, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-1 h-full min-h-[36px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: color }} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-white">{label}</span>
                  <span className="text-xs text-muted-foreground">Weeks {weeks}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
