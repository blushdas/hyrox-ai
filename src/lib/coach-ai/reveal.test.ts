import { describe, expect, it } from "vitest"
import { initialRevealState, nextRevealState, revealFrames, REVEAL_MAX_CHARS_PER_FRAME } from "./reveal"

describe("steady reveal", () => {
  it("bounds step variance across bursty arrivals without sprinting then crawling", () => {
    let state = initialRevealState()
    let total = 300
    const steps: number[] = []
    for (let frame = 0; frame < 240; frame++) {
      if (frame === 60 || frame === 150) total += 350
      const next = nextRevealState(state, total, 1)
      steps.push(next.shown - state.shown)
      expect(next.shown).toBeLessThanOrEqual(total)
      expect(next.shown).toBeGreaterThanOrEqual(state.shown)
      state = next
    }
    expect(Math.min(...steps)).toBeGreaterThanOrEqual(1)
    expect(Math.max(...steps) - Math.min(...steps)).toBeLessThanOrEqual(2)
    expect(Math.abs(steps[60] - steps[59])).toBeLessThanOrEqual(1)
    expect(Math.abs(steps[150] - steps[149])).toBeLessThanOrEqual(1)
  })
  it("caps delayed frames even with a huge backlog", () => {
    let state = initialRevealState()
    for (let frame = 0; frame < 1000; frame++) {
      const next = nextRevealState(state, 100_000, 100)
      expect(next.shown - state.shown).toBeLessThanOrEqual(REVEAL_MAX_CHARS_PER_FRAME)
      state = next
    }
  })
  it("drains short leftovers over multiple frames with no overshoot or instant flush", () => {
    let state = initialRevealState(90)
    const first = nextRevealState(state, 100, 1)
    expect(first.shown).toBeLessThan(100)
    for (let frame = 0; frame < 20; frame++) state = nextRevealState(state, 100, 1)
    expect(state.shown).toBe(100)
    expect(nextRevealState(state, 100, 1).shown).toBe(100)
  })
  it("carries fractional progress at high refresh rates", () => {
    let state = initialRevealState()
    for (let frame = 0; frame < 120; frame++) state = nextRevealState(state, 1000, revealFrames(1000 / 120))
    expect(state.shown).toBeGreaterThan(100)
    expect(state.shown).toBeLessThan(140)
  })
  it("does not bank time while waiting for another chunk", () => {
    const idle = nextRevealState({ shown: 10, rate: 100, carry: 0.9 }, 10, 4)
    expect(idle.carry).toBe(0)
    expect(nextRevealState(idle, 500, 1).shown).toBe(11)
  })
  it("uses actual sub-frame time and bounds long stalls", () => {
    expect(revealFrames(0)).toBe(0)
    expect(revealFrames(8)).toBe(0.5)
    expect(revealFrames(32)).toBe(2)
    expect(revealFrames(500)).toBe(4)
  })
})
