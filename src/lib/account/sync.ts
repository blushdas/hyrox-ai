import { Capacitor } from "@capacitor/core"
import type { AthleteProfile, SessionStatus, TrainingPlan } from "@/lib/types"
import { useAthleteStore, type SyncStatus } from "@/stores/athlete-store"
import { usePlanStore } from "@/stores/plan-store"
import { useCoachAIStore } from "@/stores/coach-ai-store"
import {
  getAccountPlan,
  getAccountProfile,
  getSessionUserId,
  patchAccountSession,
  postAccountPlan,
  putAccountProfile,
} from "./client"

export type SaveResult = "saved" | "quota" | "failed" | "skipped"

// Stale hydrate runs (React strict mode runs effects twice) must never apply their results.
let generation = 0

export const isSyncSettled = (status: SyncStatus): boolean =>
  status === "ready" || status === "signedOut" || status === "error"

export const shouldRedirectToOnboarding = (hydrated: boolean, status: SyncStatus, plan: TrainingPlan | null): boolean =>
  hydrated && isSyncSettled(status) && plan === null

function setOwners(userId: string) {
  useAthleteStore.getState().setOwner(userId)
  usePlanStore.getState().setOwner(userId)
}

export async function hydrateFromAccount({ native }: { native: boolean }): Promise<void> {
  const run = ++generation
  useAthleteStore.getState().setSyncStatus("loading")
  useAthleteStore.persist.rehydrate()
  usePlanStore.persist.rehydrate()
  if (native) {
    useAthleteStore.getState().setSyncStatus("ready")
    return
  }

  const userId = await getSessionUserId()
  if (run !== generation) return
  useAthleteStore.getState().setSessionUserId(userId)
  if (userId === null) {
    useAthleteStore.getState().setSyncStatus("signedOut")
    return
  }

  if (useAthleteStore.getState().ownerUserId !== userId || usePlanStore.getState().ownerUserId !== userId) {
    // Local data belongs to someone else or to nobody; drop it before any server data is applied.
    useAthleteStore.getState().clearProfile()
    usePlanStore.getState().clearPlan()
    useCoachAIStore.getState().reset()
  }

  const [profileResult, planResult] = await Promise.all([getAccountProfile(), getAccountPlan()])
  if (run !== generation) return
  if (profileResult.kind !== "ok" || planResult.kind !== "ok") {
    useAthleteStore.getState().setSyncStatus("error")
    return
  }

  const { profile, onboardingCompletedAt } = profileResult.value
  const { plan } = planResult.value
  if (profile === null) {
    useAthleteStore.getState().clearProfile()
    usePlanStore.getState().clearPlan()
  } else {
    useAthleteStore.getState().setProfile(profile)
    useAthleteStore.getState().setOnboardingComplete(onboardingCompletedAt !== null)
    if (plan === null) usePlanStore.getState().clearPlan()
    else usePlanStore.getState().setPlan(plan)
    setOwners(userId)
  }
  useAthleteStore.getState().setSyncStatus("ready")
}

export async function saveProfileAndPlan(
  profile: AthleteProfile,
  plan: TrainingPlan,
  options: { onboardingComplete?: boolean },
): Promise<SaveResult> {
  if (Capacitor.isNativePlatform()) return "skipped"
  const userId = useAthleteStore.getState().sessionUserId
  if (userId === null) return "failed"

  const saved = await putAccountProfile(profile, options.onboardingComplete)
  if (saved.kind !== "ok") return "failed"

  const created = await postAccountPlan(plan)
  if (created.kind === "ok") {
    const current = usePlanStore.getState().plan
    if (current) usePlanStore.getState().setPlan({ ...current, id: created.value.plan.id })
    setOwners(userId)
    return "saved"
  }
  if (created.kind !== "quota") return "failed"

  // The old active plan is untouched on the server; show that one instead of the unsaved local plan.
  const active = await getAccountPlan()
  if (active.kind === "ok" && active.value.plan !== null) {
    usePlanStore.getState().setPlan(active.value.plan)
    setOwners(userId)
  }
  return "quota"
}

export async function saveSessionStatus(id: string, status: SessionStatus): Promise<boolean> {
  if (Capacitor.isNativePlatform()) return true
  if (useAthleteStore.getState().sessionUserId === null) return false
  const result = await patchAccountSession(id, status)
  return result.kind === "ok"
}
