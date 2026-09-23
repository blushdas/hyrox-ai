"use client"

import { useCallback } from "react"
import { usePlanStore } from "@/stores/plan-store"
import { generateBeginnerPlan, generateOpenPlan, generateProPlan } from "@/lib/mock-data"
import type { AthleteProfile, TrainingPlan, WeekPlan } from "@/lib/types"

export function usePlanGenerator() {
  const { setPlan } = usePlanStore()

  const generatePlan = useCallback((profile: AthleteProfile): TrainingPlan => {
    // Persisted profiles can contain legacy categories outside RaceCategory.
    const category: string = profile.category
    let weeks: WeekPlan[]
    switch (category) {
      case "open":
        weeks = generateOpenPlan(profile.raceDate)
        break
      case "pro":
        weeks = generateProPlan(profile.raceDate)
        break
      case "beginner":
        weeks = generateBeginnerPlan(profile.raceDate)
        break
      case "doubles":
      default:
        // No DOUBLES source data exists yet; unknown categories use beginner too.
        weeks = generateBeginnerPlan(profile.raceDate)
        break
    }

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
