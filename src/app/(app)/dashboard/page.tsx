"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import { RaceCountdown } from "@/components/app/race-countdown"
import { PhaseBanner } from "@/components/app/phase-banner"
import { CalendarView } from "@/components/app/calendar-view"
import { useAthleteStore } from "@/stores/athlete-store"
import { usePlanStore } from "@/stores/plan-store"
import { PHASE_NAMES } from "@/lib/mock-data"

export default function DashboardPage() {
  const router = useRouter()
  const { profile, onboardingComplete } = useAthleteStore()
  const { plan, currentWeek, setCurrentWeek } = usePlanStore()

  useEffect(() => {
    if (!onboardingComplete || !profile) {
      router.replace("/onboarding")
    }
  }, [onboardingComplete, profile, router])

  if (!plan || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#6B7280]">Loading your plan...</p>
        </div>
      </div>
    )
  }

  const weekPlan = plan.weeks.find((w) => w.week === currentWeek) ?? plan.weeks[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Header — sticky, full-width */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-[#1A1A1A] px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <span className="text-[10px] uppercase tracking-[0.1em] text-[#6B7280]">
          Week {currentWeek} · {PHASE_NAMES[weekPlan.phase] ?? weekPlan.phase}
        </span>
      </div>

      {/* Race countdown strip — flush */}
      <RaceCountdown raceDate={profile.raceDate} />

      {/* Phase stat strip — flush */}
      <PhaseBanner
        phase={weekPlan.phase}
        phaseWeek={weekPlan.phaseWeek}
        totalPhaseWeeks={weekPlan.totalPhaseWeeks}
        totalWeek={currentWeek}
        totalWeeks={plan.totalWeeks}
      />

      {/* Calendar — full-width */}
      <CalendarView
        weekPlan={weekPlan}
        currentWeek={currentWeek}
        totalWeeks={plan.totalWeeks}
        onPrevWeek={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
        onNextWeek={() => setCurrentWeek(Math.min(plan.totalWeeks, currentWeek + 1))}
      />
    </div>
  )
}
