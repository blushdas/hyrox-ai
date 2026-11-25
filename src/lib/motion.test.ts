import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { createColdStartGate, springs, springTransition, staggerDelay, DURATION_BASE, DURATION_FAST, EASE_OUT_EXPO, PLAN_DURATION, durationSeconds, motionTransition, planSequence, planStages, routeDirection } from "./motion"

describe("routeDirection", () => {
  it("enters deeper routes from the right and shallower routes from the left", () => {
    expect(routeDirection("/dashboard", "/session/open-w1-s1")).toBe(1)
    expect(routeDirection("/session/open-w1-s1", "/dashboard")).toBe(-1)
  })
  it("does not shift peers, trailing slashes, query strings or hashes", () => {
    expect(routeDirection("/dashboard", "/profile")).toBe(0)
    expect(routeDirection("/plan/", "/coach-ai?session=/session/one#source")).toBe(0)
    expect(routeDirection("/", "/dashboard")).toBe(1)
    expect(routeDirection("/dashboard", "/")).toBe(-1)
  })
})

describe("planSequence", () => {
  it("advances only at each exact stage boundary and completes only at the end", () => {
    let elapsed = 0
    planStages.forEach((stage, index) => {
      expect(planSequence(elapsed)).toEqual({ index, progress: (index + 1) / 3, complete: false })
      elapsed += stage.duration
      expect(planSequence(elapsed - 1).index).toBe(index)
      expect(planSequence(elapsed - 1).complete).toBe(false)
    })
    expect(elapsed).toBe(2400)
    expect(PLAN_DURATION).toBe(elapsed)
    expect(planSequence(elapsed)).toEqual({ index: 2, progress: 1, complete: true })
    expect(planSequence(elapsed + 500).complete).toBe(true)
    expect(planSequence(-1).index).toBe(0)
  })
})

it("keeps CSS and SSR motion tokens aligned and reduced motion instant", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")
  expect(css).toContain(`--duration-fast: ${DURATION_FAST * 1000}ms`)
  expect(css).toContain(`--duration-base: ${DURATION_BASE * 1000}ms`)
  expect(css).toContain(`--ease-out-expo: cubic-bezier(${EASE_OUT_EXPO.join(", ")})`)
  expect(motionTransition(false).duration).toBe(0.22)
  expect(motionTransition(false, true).duration).toBe(0.15)
  expect(motionTransition(true).duration).toBe(0)
})

it("reads both authored milliseconds and browser-normalized seconds", () => {
  expect(durationSeconds("220ms", DURATION_BASE)).toBe(0.22)
  expect(durationSeconds(".22s", DURATION_BASE)).toBe(0.22)
  expect(durationSeconds(" .15s ", DURATION_FAST)).toBe(0.15)
  expect(durationSeconds("", DURATION_BASE)).toBe(0.22)
})


describe("spring motion", () => {
  it("keeps each physical spring at the specified stiffness, damping and unit mass", () => {
    expect(springs).toEqual({
      snappy: { stiffness: 439, damping: 41.9, mass: 1 },
      default: { stiffness: 247, damping: 26.7, mass: 1 },
      smooth: { stiffness: 158, damping: 25.1, mass: 1 },
      bouncy: { stiffness: 158, damping: 17.6, mass: 1 },
    })
    expect(springTransition(false)).toEqual({ type: "spring", ...springs.default })
    expect(springTransition(false, "snappy")).toEqual({ type: "spring", ...springs.snappy })
    expect(springTransition(true)).toEqual({ type: "tween", duration: 0.21, ease: "easeOut" })
  })

  it("staggers eight items at 40ms and never delays later items beyond 280ms", () => {
    expect(Array.from({ length: 10 }, (_, index) => staggerDelay(index)))
      .toEqual([0, 40, 80, 120, 160, 200, 240, 280, 280, 280])
    expect(staggerDelay(-1)).toBe(0)
    expect(staggerDelay(2.9)).toBe(80)
    expect(staggerDelay(Number.NaN)).toBe(0)
    expect(staggerDelay(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it("allows only one splash per document, with independent cold starts", () => {
    const claim = createColdStartGate()
    expect(claim()).toBe(true)
    expect(claim()).toBe(false)
    expect(claim()).toBe(false)
    expect(createColdStartGate()()).toBe(true)
  })

  it("keeps the extended CSS durations and fallback springs aligned", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8")
    for (const [name, ms] of Object.entries({ press: 120, exit: 150, enter: 210, move: 400, sheet: 500, splash: 900 })) {
      expect(css).toContain(`--dur-${name}: ${ms}ms`)
    }
    expect(css).toContain("--stagger: 40ms")
    expect(css).toContain("@supports (transition-timing-function: linear(0, 1))")
    for (const preset of ["snappy", "default", "bouncy"]) {
      expect(css).toContain(`--spring-${preset}: cubic-bezier(0.22, 1, 0.36, 1)`)
      expect(css).toContain(`--spring-${preset}: linear(`)
    }
  })
})
