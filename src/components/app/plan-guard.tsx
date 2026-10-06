"use client"
import { useEffect, useSyncExternalStore } from "react"
import { useAthleteStore } from "@/stores/athlete-store"
import { Skeleton } from "@/components/shell/primitives"
import { useRouter } from "next/navigation"
import { usePlanStore } from "@/stores/plan-store"
import { isSyncSettled, shouldRedirectToOnboarding } from "@/lib/account/sync"

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

  if (!hydrated || !isSyncSettled(syncStatus) || !plan) return <Skeleton />

  return <>{children}</>
}
