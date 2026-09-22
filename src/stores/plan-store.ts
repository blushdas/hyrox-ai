"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { TrainingPlan, SessionStatus } from "@/lib/types"

type PlanState = {
  plan: TrainingPlan | null
  currentWeek: number
  setPlan: (plan: TrainingPlan) => void
  clearPlan: () => void
  updateSessionStatus: (sessionId: string, status: SessionStatus) => void
  setCurrentWeek: (week: number) => void
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      currentWeek: 1,
      setPlan: (plan) => set({ plan }),
      clearPlan: () => set({ plan: null, currentWeek: 1 }),
      updateSessionStatus: (sessionId, status) =>
        set((state) => {
          if (!state.plan) return state
          return {
            plan: {
              ...state.plan,
              weeks: state.plan.weeks.map((week) => ({
                ...week,
                sessions: week.sessions.map((session) =>
                  session.id === sessionId ? { ...session, status } : session
                ),
              })),
            },
          }
        }),
      setCurrentWeek: (week) => set({ currentWeek: week }),
    }),
    {
      name: "finisher-plan",
      skipHydration: true,
    }
  )
)
