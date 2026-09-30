export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
export const DURATION_FAST = 0.15
export const DURATION_BASE = 0.22

export function routeDirection(from: string, to: string): -1 | 0 | 1 {
  const depth = (path: string) => path.split(/[?#]/)[0].split("/").filter(Boolean).length
  return Math.sign(depth(to) - depth(from)) as -1 | 0 | 1
}

export const planStages = [
  { label: "Reading your profile", duration: 800 },
  { label: "Building your 12 weeks", duration: 800 },
  { label: "Scheduling sessions", duration: 800 },
] as const

export const PLAN_DURATION = planStages.reduce((total, stage) => total + stage.duration, 0)

export function planSequence(elapsed: number) {
  let boundary = 0
  for (let index = 0; index < planStages.length; index++) {
    boundary += planStages[index].duration
    if (elapsed < boundary) {
      return { index, progress: (index + 1) / planStages.length, complete: false }
    }
  }
  return { index: planStages.length - 1, progress: 1, complete: true }
}

export function durationSeconds(value: string, fallback: number) {
  const duration = Number.parseFloat(value)
  if (!Number.isFinite(duration)) return fallback
  // Production CSS can normalize 220ms to .22s.
  return value.trim().endsWith("ms") ? duration / 1000 : duration
}

// CSS owns the theme tokens; these constants also support SSR and pure tests.
export function motionTransition(reduced: boolean | null, fast = false) {
  const styles = typeof document === "undefined" ? null : getComputedStyle(document.documentElement)
  const duration = durationSeconds(
    styles?.getPropertyValue(fast ? "--duration-fast" : "--duration-base") ?? "",
    fast ? DURATION_FAST : DURATION_BASE,
  )
  const easing = styles?.getPropertyValue("--ease-out-expo").match(/[\d.]+/g)?.map(Number)
  return {
    type: "tween" as const,
    duration: reduced ? 0 : duration,
    ease: easing?.length === 4 ? easing as [number, number, number, number] : EASE_OUT_EXPO,
  }
}
