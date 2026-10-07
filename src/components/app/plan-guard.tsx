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
  const plan = usePlanStore(s => s.plan)
  const syncStatus = useAthleteStore(s => s.syncStatus)
  const hydrated = useSyncExternalStore(subscribeHydration, hasHydrated, () => false)

  useEffect(() => {
    if (shouldRedirectToOnboarding(hydrated, syncStatus, plan)) {
      router.replace("/onboarding")
    }
  }, [hydrated, syncStatus, plan, router])

  if (!hydrated || !isSyncSettled(syncStatus)) return <Skeleton />
  if (syncStatus === "error" && !plan) {
    return (
      <div role="alert" className="space-y-4 py-6">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load your account. Check your connection and try again.</p>
        <Button onClick={() => void hydrateFromAccount({ native: Capacitor.isNativePlatform() })}>Retry</Button>
      </div>
    )
  }
  if (!plan) return <Skeleton />

  return <>{children}</>
}
