import { Capacitor } from "@capacitor/core"
import type { AthleteProfile, SessionStatus, TrainingPlan } from "@/lib/types"
import { useAthleteStore, type SyncStatus } from "@/stores/athlete-store"
import { usePlanStore } from "@/stores/plan-store"
import { useCoachAIStore } from "@/stores/coach-ai-store"
import {
  getAccountPlan,
  getAccountProfile,
  getSessionUser,
  patchAccountSession,
  postAccountPlan,
  putAccountProfile,
} from "./client"

export type SaveResult = "saved" | "quota" | "failed" | "skipped"

// Stale hydrate runs (React strict mode runs effects twice) must never apply their results.
let generation = 0

export const isSyncSettled = (status: SyncStatus): boolean =>
  status === "ready" || status === "signedOut" || status === "error"

// An error is not an answer: with no plan we show a retry state rather than sending the user to onboarding.
export const shouldRedirectToOnboarding = (hydrated: boolean, status: SyncStatus, plan: TrainingPlan | null): boolean =>
  hydrated && (status === "ready" || status === "signedOut") && plan === null

function setOwners(userId: string) {
  useAthleteStore.getState().setOwner(userId)
  usePlanStore.getState().setOwner(userId)
}

export async function hydrateFromAccount({ native }: { native: boolean }): Promise<void> {
  const run = ++generation
  try {
    await hydrate(run, native)
  } catch (error) {
    // An unexpected throw must never leave the app on the loading skeleton.
    console.error("Account hydrate failed", error instanceof Error ? error.name : "unknown")
    if (run === generation && useAthleteStore.getState().syncStatus === "loading") {
      useAthleteStore.getState().setSyncStatus("error")
    }
  }
}

async function hydrate(run: number, native: boolean): Promise<void> {
  useAthleteStore.getState().setSyncStatus("loading")
  useAthleteStore.persist.rehydrate()
  usePlanStore.persist.rehydrate()
  if (native) {
    useAthleteStore.getState().setSyncStatus("ready")
    return
  }

  const session = await getSessionUser()
  if (run !== generation) return
  if (session.kind === "failed") {
    // Who is signed in is unknown, so owned local data may belong to someone else: never render or push it.
    useAthleteStore.getState().setSessionUserId(null)
    if (useAthleteStore.getState().ownerUserId !== null || usePlanStore.getState().ownerUserId !== null) {
      useAthleteStore.getState().clearProfile()
      usePlanStore.getState().clearPlan()
      useCoachAIStore.getState().reset()
    }
    useAthleteStore.getState().setSyncStatus("error")
    return
  }
  if (session.kind === "signedOut") {
    useAthleteStore.getState().setSessionUserId(null)
    useAthleteStore.getState().setSyncStatus("signedOut")
    return
  }
  const userId = session.id
  useAthleteStore.getState().setSessionUserId(userId)

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
    // A newer save may have replaced the posted plan while this request was in flight.
    if (current && current.id === plan.id) usePlanStore.getState().setPlan({ ...current, id: created.value.plan.id })
    setOwners(userId)
    return "saved"
  }
  if (created.kind !== "quota") return "failed"

  // The old active plan is untouched on the server; show that one instead of the unsaved local plan.
  const active = await getAccountPlan()
  if (active.kind !== "ok") return "failed"
  if (active.value.plan !== null) {
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
