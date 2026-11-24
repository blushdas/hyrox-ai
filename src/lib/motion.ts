export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
export const DURATION_FAST = 0.15
export const DURATION_BASE = 0.22

export const springs = {
  snappy: { stiffness: 439, damping: 41.9, mass: 1 },
  default: { stiffness: 247, damping: 26.7, mass: 1 },
  smooth: { stiffness: 158, damping: 25.1, mass: 1 },
  bouncy: { stiffness: 158, damping: 17.6, mass: 1 },
} as const

export function staggerDelay(index: number) {
  return Math.min(7, Math.max(0, Number.isFinite(index) ? Math.floor(index) : 0)) * 40
}

// A document lifetime, rather than sessionStorage: a real cold reload can play again.
export function createColdStartGate() {
  let played = false
  return () => {
    if (played) return false
    played = true
    return true
  }
}

export function springTransition(reduced: boolean | null, preset: keyof typeof springs = "default") {
  if (!reduced) return { type: "spring" as const, ...springs[preset] }
  const styles = typeof document === "undefined" ? null : getComputedStyle(document.documentElement)
  return {
    type: "tween" as const,
    duration: durationSeconds(styles?.getPropertyValue("--dur-enter") ?? "", 0.21),
    ease: "easeOut" as const,
  }
}

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
