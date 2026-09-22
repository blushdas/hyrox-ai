"use client"

import { useEffect } from "react"
import { useAthleteStore } from "@/stores/athlete-store"
import { usePlanStore } from "@/stores/plan-store"

export function StoreHydrator() {
  useEffect(() => {
    useAthleteStore.persist.rehydrate()
    usePlanStore.persist.rehydrate()
  }, [])

  return null
}
