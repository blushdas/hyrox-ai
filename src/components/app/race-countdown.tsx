"use client"

import { useCountdown } from "@/hooks/use-countdown"

type RaceCountdownProps = {
  raceDate: string
}

export function RaceCountdown({ raceDate }: RaceCountdownProps) {
  const { days, weeks, isPast } = useCountdown(raceDate)

  if (isPast) {
    return (
      <div className="flex items-stretch border-b border-[#1A1A1A]">
        <div className="px-4 py-3">
          <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280] mb-0.5">Race Day</div>
          <div className="text-xl font-black text-primary">You did it!</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-stretch border-b border-[#1A1A1A]">
      <div className="px-4 py-3">
        <div className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280] mb-0.5">Race Day</div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-primary tnum">{days}</span>
          <span className="text-xs text-[#6B7280]">d</span>
          <span className="text-xl font-semibold text-white tnum ml-2">{weeks}</span>
          <span className="text-xs text-[#6B7280]">wk</span>
        </div>
      </div>
    </div>
  )
}
