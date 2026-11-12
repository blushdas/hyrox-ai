"use client"

import Link from "next/link"
import { PageHeader, Skeleton } from "@/components/shell/primitives"
import { useAthleteStore } from "@/stores/athlete-store"

export function BuildPlanEmptyState({ title }: { title: string }) {
  const completed = useAthleteStore(s => s.onboardingComplete)
  const syncStatus = useAthleteStore(s => s.syncStatus)
  if (!completed || (syncStatus !== "ready" && syncStatus !== "signedOut")) return <Skeleton />

  return <>
    <PageHeader title={title} />
    <section className="my-6 space-y-4 rounded-lg border border-border bg-surface-1 p-6">
      <h2 className="text-xl font-semibold">Build my plan</h2>
      <p className="text-sm text-muted-foreground">Ready when you are. Add your race details to create your training plan.</p>
      <Link href="/onboarding?redo=1" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary">Build my plan</Link>
    </section>
  </>
}
