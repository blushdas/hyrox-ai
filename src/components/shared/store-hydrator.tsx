"use client"

import { useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { hydrateFromAccount } from "@/lib/account/sync"

export function StoreHydrator() {
  useEffect(() => {
    void hydrateFromAccount({ native: Capacitor.isNativePlatform() })
  }, [])

  return null
}
