import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { DURATION_BASE, DURATION_FAST, EASE_OUT_EXPO, PLAN_DURATION, durationSeconds, motionTransition, planSequence, planStages, routeDirection } from "./motion"

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
