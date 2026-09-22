"use client"

import { useState, useEffect } from "react"

type CountdownResult = {
  days: number
  weeks: number
  hours: number
  isPast: boolean
}

export function useCountdown(raceDate: string): CountdownResult {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  if (!raceDate) {
    return { days: 0, weeks: 0, hours: 0, isPast: false }
  }

  const target = new Date(raceDate)
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, weeks: 0, hours: 0, isPast: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)

  return { days, weeks, hours, isPast: false }
}
