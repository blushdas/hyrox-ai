"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function IOSAppEntry() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      router.replace("/dashboard")
    }
  }, [mounted, router])

  return null
}
