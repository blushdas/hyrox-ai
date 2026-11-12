"use client"
import { useEffect, useSyncExternalStore } from "react"
import { useAthleteStore } from "@/stores/athlete-store"
import { Skeleton } from "@/components/shell/primitives"
import { useRouter } from "next/navigation"
import { usePlanStore } from "@/stores/plan-store"
import { Capacitor } from "@capacitor/core"
import { Button } from "@/components/ui/button"
import { hydrateFromAccount, isSyncSettled, shouldRedirectToOnboarding } from "@/lib/account/sync"

const hasHydrated = () => usePlanStore.persist.hasHydrated() && useAthleteStore.persist.hasHydrated()
const subscribeHydration = (notify: () => void) => {
  const cleanups = [usePlanStore.persist, useAthleteStore.persist].flatMap((persist) => [
    persist.onHydrate(notify), persist.onFinishHydration(notify),
  ])
  return () => cleanups.forEach((unsubscribe) => unsubscribe())
}

export function PlanGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hasPlan = usePlanStore(s => s.plan !== null)
  // Native has no account to ask yet, so a saved local plan stands in for "onboarded" there only.
  const onboardingComplete = useAthleteStore(s => s.onboardingComplete) || (Capacitor.isNativePlatform() && hasPlan)
  const syncStatus = useAthleteStore(s => s.syncStatus)
  const hydrated = useSyncExternalStore(subscribeHydration, hasHydrated, () => false)

  useEffect(() => {
    if (syncStatus === "signedOut") router.replace("/sign-in")
    if (shouldRedirectToOnboarding(hydrated, syncStatus, onboardingComplete)) {
      router.replace("/onboarding")
    }
  }, [hydrated, syncStatus, onboardingComplete, router])

  if (!hydrated || !isSyncSettled(syncStatus)) return <Skeleton />
  if (syncStatus === "error") {
    return (
      <div role="alert" className="space-y-4 py-6">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load your account. Check your connection and try again.</p>
        <Button onClick={() => void hydrateFromAccount({ native: Capacitor.isNativePlatform() })}>Try again</Button>
      </div>
    )
  }
  if (!onboardingComplete) return <Skeleton />

  return <>{children}</>
}
