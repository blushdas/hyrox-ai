import { Capacitor } from "@capacitor/core"
import { signOut } from "next-auth/react"
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
  putSkipOnboarding,
} from "./client"

export type SaveResult = "saved" | "quota" | "failed" | "skipped"

// Stale hydrate runs (React strict mode runs effects twice) must never apply their results.
let generation = 0
const backfills = new Map<string, Promise<{
  profile: Awaited<ReturnType<typeof getAccountProfile>>;
  plan: Awaited<ReturnType<typeof getAccountPlan>>;
}>>()
let skipPending: Promise<SaveResult> | null = null

export const isSyncSettled = (status: SyncStatus): boolean =>
  status === "ready" || status === "signedOut" || status === "error"

// An error is not an answer: with no plan we show a retry state rather than sending the user to onboarding.
export const shouldRedirectToOnboarding = (hydrated: boolean, status: SyncStatus, onboardingComplete: boolean): boolean =>
  hydrated && status === "ready" && !onboardingComplete

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
  useAthleteStore.getState().setOnboardingComplete(false)
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
    useAthleteStore.getState().setOnboardingComplete(false)
    backfills.clear()
    useAthleteStore.getState().setSessionUserId(null)
    useAthleteStore.getState().setSyncStatus("signedOut")
    return
  }
  const userId = session.id
  useAthleteStore.getState().setSessionUserId(userId)

  const athleteOwner = useAthleteStore.getState().ownerUserId
  const planOwner = usePlanStore.getState().ownerUserId
  if (athleteOwner === null && planOwner === null) {
    // Pre-account local data (made before owners existed) is claimed once by the first account to sign in on this device.
    setOwners(userId)
  } else if (athleteOwner !== userId || planOwner !== userId) {
    // Local data belongs to someone else; drop it before any server data is applied.
    useAthleteStore.getState().clearProfile()
    usePlanStore.getState().clearPlan()
    useCoachAIStore.getState().reset()
  }

  const [profileResult, planResult] = await Promise.all([getAccountProfile(), getAccountPlan()])
  if (run !== generation) return
  if (profileResult.kind === "unauthorized" || planResult.kind === "unauthorized") {
    useAthleteStore.getState().clearProfile()
    usePlanStore.getState().clearPlan()
    useAthleteStore.getState().setSessionUserId(null)
    useAthleteStore.getState().setSyncStatus("signedOut")
    // Clear the dead session first: the proxy sends token holders on /sign-in straight back to /dashboard.
    await signOut({ callbackUrl: "/sign-in" })
    return
  }
  if (profileResult.kind !== "ok" || planResult.kind !== "ok") {
    useAthleteStore.getState().setSyncStatus("error")
    return
  }

  const localProfile = useAthleteStore.getState().profile
  const localPlan = usePlanStore.getState().plan
  const missingProfile = profileResult.value.profile === null && profileResult.value.onboardingCompletedAt === null && localProfile !== null
  // A plan is never pushed to an account that has no profile row (a skipped account), or the two would disagree.
  const accountHasProfile = profileResult.value.profile !== null || missingProfile
  const missingPlan = planResult.value.plan === null && localPlan !== null && accountHasProfile
  // An empty account only takes a complete local pair; a lone local entity is never pushed as "completed".
  const accountEmpty = profileResult.value.profile === null && profileResult.value.onboardingCompletedAt === null && planResult.value.plan === null
  const partialLocal = accountEmpty && !(localProfile && localPlan)
  if ((missingProfile || missingPlan) && !partialLocal
      && useAthleteStore.getState().ownerUserId === userId && usePlanStore.getState().ownerUserId === userId) {
    let pending = backfills.get(userId)
    if (!pending) {
      pending = (async () => {
        let profile: Awaited<ReturnType<typeof getAccountProfile>> = profileResult
        if (missingProfile && localProfile) {
          const saved = await putAccountProfile(localProfile, true, true)
          profile = saved.kind === "precondition" ? await getAccountProfile() : saved
        }
        if (useAthleteStore.getState().sessionUserId !== userId) return { profile, plan: { kind: "failed" } as const }
        let plan: Awaited<ReturnType<typeof getAccountPlan>> = planResult
        if (missingPlan && localPlan) {
          // The server's conditional insert protects a plan created since the initial read.
          plan = await postAccountPlan(localPlan, true)
        }
        return { profile, plan }
      })()
      backfills.set(userId, pending)
    }
    const backfill = await pending
    if (run !== generation || useAthleteStore.getState().sessionUserId !== userId) return
    if (backfill.profile.kind !== "ok" || backfill.plan.kind !== "ok") {
      backfills.delete(userId)
      console.error("Account backfill failed", backfill.profile.kind, backfill.plan.kind)
      if (backfill.profile.kind === "ok") useAthleteStore.getState().setOnboardingComplete(backfill.profile.value.onboardingCompletedAt !== null)
      useAthleteStore.getState().setSyncStatus("error")
      return
    }
    profileResult.value = backfill.profile.value
    planResult.value = backfill.plan.value
  }
  const { profile, onboardingCompletedAt } = profileResult.value
  const { plan } = planResult.value
  if (profile === null) {
    useAthleteStore.getState().clearProfile()
  } else {
    useAthleteStore.getState().setProfile(profile)
    useAthleteStore.getState().setOnboardingComplete(onboardingCompletedAt !== null)
    setOwners(userId)
  }
  if (plan === null) usePlanStore.getState().clearPlan()
  else usePlanStore.getState().setPlan(plan)
  useAthleteStore.getState().setOnboardingComplete(onboardingCompletedAt !== null)
  setOwners(userId)
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

  const firstCompletion = options.onboardingComplete === true && !useAthleteStore.getState().onboardingComplete
  const saved = await putAccountProfile(profile, options.onboardingComplete)
  if (saved.kind !== "ok" || useAthleteStore.getState().sessionUserId !== userId) return "failed"

  useAthleteStore.getState().setOnboardingComplete(saved.value.onboardingCompletedAt !== null)
  setOwners(userId)
  const created = await postAccountPlan(plan, firstCompletion)
  if (useAthleteStore.getState().sessionUserId !== userId) return "failed"
  if (created.kind === "ok") {
    const current = usePlanStore.getState().plan
    // A newer save may have replaced the posted plan while this request was in flight.
    if (current && current.id === plan.id) usePlanStore.getState().setPlan({ ...current, id: created.value.plan.id })
    setOwners(userId)
    return "saved"
  }
  if (created.kind !== "quota") {
    console.error("Account plan save failed", created.kind)
    return "failed"
  }

  // The old active plan is untouched on the server; show that one instead of the unsaved local plan.
  const active = await getAccountPlan()
  if (active.kind !== "ok" || useAthleteStore.getState().sessionUserId !== userId) return "failed"
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

export function saveSkippedOnboarding(): Promise<SaveResult> {
  if (skipPending) return skipPending
  skipPending = (async (): Promise<SaveResult> => {
    if (Capacitor.isNativePlatform()) {
      // Native has no account; skipping lets this launch reach the dashboard.
      useAthleteStore.getState().setOnboardingComplete(true)
      return "skipped"
    }
    const userId = useAthleteStore.getState().sessionUserId
    if (!userId) return "failed"
    const result = await putSkipOnboarding()
    if (result.kind !== "ok" || result.value.onboardingCompletedAt === null
        || useAthleteStore.getState().sessionUserId !== userId) return "failed"
    if (result.value.profile) useAthleteStore.getState().setProfile(result.value.profile)
    useAthleteStore.getState().setOnboardingComplete(true)
    setOwners(userId)
    return "saved"
  })().finally(() => { skipPending = null })
  return skipPending
}
