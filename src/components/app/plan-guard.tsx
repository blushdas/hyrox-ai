"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePlanStore } from "@/stores/plan-store"

export function PlanGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const plan = usePlanStore(s => s.plan)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !plan) {
      router.replace("/onboarding")
    }
  }, [mounted, plan, router])

  if (!mounted || !plan) return null

  return <>{children}</>
}
