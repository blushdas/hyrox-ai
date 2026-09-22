"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AthleteProfile, RaceCategory, FitnessLevel } from "@/lib/types"

type AthleteState = {
  profile: AthleteProfile | null
  onboardingComplete: boolean
  setProfile: (profile: AthleteProfile) => void
  updateProfile: (partial: Partial<AthleteProfile>) => void
  clearProfile: () => void
  setOnboardingComplete: (complete: boolean) => void
}

const defaultProfile: AthleteProfile = {
  raceDate: "",
  location: "",
  category: "open" as RaceCategory,
  fiveKTime: "",
  tenKTime: "",
  hyroxTime: "",
  age: null,
  gender: "",
  weight: null,
  weightUnit: "kg",
  daysPerWeek: 4,
  sessionLength: 60,
  fitnessLevel: "beginner_mid" as FitnessLevel,
}

export const useAthleteStore = create<AthleteState>()(
  persist(
    (set) => ({
      profile: null,
      onboardingComplete: false,
      setProfile: (profile) => set({ profile }),
      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...partial } : { ...defaultProfile, ...partial },
        })),
      clearProfile: () => set({ profile: null, onboardingComplete: false }),
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
    }),
    {
      name: "finisher-athlete",
      skipHydration: true,
    }
  )
)
