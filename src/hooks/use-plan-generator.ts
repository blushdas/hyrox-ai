"use client"

import { useCallback } from "react"
import { usePlanStore } from "@/stores/plan-store"
import { generateBeginnerPlan } from "@/lib/mock-data"
import type { AthleteProfile, TrainingPlan } from "@/lib/types"

export function usePlanGenerator() {
  const { setPlan } = usePlanStore()

  const generatePlan = useCallback((profile: AthleteProfile): TrainingPlan => {
    const weeks = generateBeginnerPlan(profile.raceDate)

    const plan: TrainingPlan = {
      id: `plan-${Date.now()}`,
      totalWeeks: 12,
      raceDate: profile.raceDate,
      weeks,
    }

    setPlan(plan)
    return plan
  }, [setPlan])

  return { generatePlan }
}
