"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AthleteProfile, RaceCategory, FitnessLevel } from "@/lib/types"

export type SyncStatus = "idle" | "loading" | "ready" | "signedOut" | "error"

type AthleteState = {
  profile: AthleteProfile | null
  onboardingComplete: boolean
  ownerUserId: string | null
  syncStatus: SyncStatus
  sessionUserId: string | null
  setOwner: (id: string | null) => void
  setSyncStatus: (status: SyncStatus) => void
  setSessionUserId: (id: string | null) => void
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
      ownerUserId: null,
      syncStatus: "idle",
      sessionUserId: null,
      setOwner: (id) => set({ ownerUserId: id }),
      setSyncStatus: (status) => set({ syncStatus: status }),
      setSessionUserId: (id) => set({ sessionUserId: id }),
      setProfile: (profile) => set({ profile }),
      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...partial } : { ...defaultProfile, ...partial },
        })),
      clearProfile: () => set({ profile: null, onboardingComplete: false, ownerUserId: null }),
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
    }),
    {
      name: "finisher-athlete",
      skipHydration: true,
      // Sync status and the session user describe this tab, not the saved data.
      partialize: (state) => ({
        profile: state.profile,
        onboardingComplete: state.onboardingComplete,
        ownerUserId: state.ownerUserId,
      }),
    }
  )
)
