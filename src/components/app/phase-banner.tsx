import { PHASE_NAMES } from "@/lib/mock-data"
import type { Phase } from "@/lib/types"

type PhaseBannerProps = {
  phase: Phase
  phaseWeek: number
  totalPhaseWeeks: number
  totalWeek: number
  totalWeeks: number
}

export function PhaseBanner({ phase, phaseWeek, totalPhaseWeeks, totalWeek, totalWeeks }: PhaseBannerProps) {
  const overallProgress = Math.round((totalWeek / totalWeeks) * 100)

  return (
    <div className="flex items-stretch border-y border-[#1A1A1A]">
      <div className="flex-1 px-4 py-3 border-r border-[#1A1A1A]">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280] mb-0.5">Phase</div>
        <div className="text-sm font-semibold text-white">{PHASE_NAMES[phase] ?? phase}</div>
      </div>
      <div className="flex-1 px-4 py-3 border-r border-[#1A1A1A]">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280] mb-0.5">Week</div>
        <div className="text-sm font-semibold text-white tnum">{totalWeek}/{totalWeeks}</div>
      </div>
      <div className="flex-1 px-4 py-3 border-r border-[#1A1A1A]">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280] mb-0.5">Phase</div>
        <div className="text-sm font-semibold text-white tnum">{phaseWeek}/{totalPhaseWeeks}</div>
      </div>
      <div className="flex-1 px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280] mb-0.5">Overall</div>
        <div className="text-sm font-semibold text-primary tnum">{overallProgress}%</div>
      </div>
    </div>
  )
}
