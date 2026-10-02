import { describe, expect, it } from "vitest"
import { initialRevealState, nextRevealState, revealFrames, revealFrameCap } from "./reveal"

const frame = (hz: number) => revealFrames(1000 / hz)

describe("steady reveal", () => {
  it("smooths burst arrivals instead of changing speed in one frame", () => {
    let state = initialRevealState()
    let total = 0
    let previousStep = 0
    for (let tick = 0; tick < 600; tick++) {
      if (tick % 30 === 0) total += 500
      const next = nextRevealState(state, total, frame(60))
      const step = next.shown - state.shown
      expect(next.shown).toBeLessThanOrEqual(total)
      expect(next.shown).toBeGreaterThanOrEqual(state.shown)
      if (tick > 60 && state.received - state.shown > state.rate / 60 && next.shown < total) expect(Math.abs(step - previousStep)).toBeLessThanOrEqual(2)
      if (tick % 30 === 0 && tick > 60 && state.received - state.shown > state.rate / 60) expect(step - previousStep).toBeLessThanOrEqual(1)
      state = next
      previousStep = step
    }
  })
  it("tracks a fast long reply without retaining a growing backlog", () => {
    let state = initialRevealState()
    let total = 0
    let lateBacklog = 0
    for (let tick = 0; tick < 600; tick++) {
      if (tick % 15 === 0) total += 400
      state = nextRevealState(state, total, frame(60))
      if (tick >= 300) lateBacklog = Math.max(lateBacklog, total - state.shown)
    }
    expect(state.arrivalRate).toBeGreaterThan(1500)
    expect(state.rate).toBeGreaterThan(1000)
    expect(lateBacklog).toBeLessThan(450)
    expect(total - state.shown).toBeLessThan(100)
  })
  it.each([30, 60, 120])("drains arbitrarily long final backlogs within 1.5s at %iHz", hz => {
    for (const total of [1500, 4000, 10000, 100000, 1000000]) {
      let state = initialRevealState()
      let ticks = 0
      let maxStep = 0
      const first = nextRevealState(state, total, frame(hz), false)
      expect(first.shown).toBeGreaterThan(0)
      expect(first.shown).toBeLessThan(total)
      while (state.shown < total && ticks < hz * 1.5) {
        const next = nextRevealState(state, total, frame(hz), false)
        maxStep = Math.max(maxStep, next.shown - state.shown)
        expect(next.shown).toBeGreaterThanOrEqual(state.shown)
        expect(next.shown).toBeLessThanOrEqual(total)
        state = next
        ticks++
      }
      expect(state.shown).toBe(total)
      expect(ticks * 1000 / hz).toBeLessThanOrEqual(1500)
      expect(maxStep).toBeLessThanOrEqual(revealFrameCap(total))
      expect(maxStep).toBeLessThan(Math.ceil(total / 20))
    }
  })
  it("drains a large backlog from an actual bursty 1500-character stream", () => {
    let state = initialRevealState()
    let total = 0
    for (let tick = 0; tick < 30; tick++) {
      if (tick % 6 === 0) total += 300
      state = nextRevealState(state, total, frame(60))
    }
    expect(total).toBe(1500)
    expect(total - state.shown).toBeGreaterThan(500)
    let ticks = 0
    while (state.shown < total && ticks < 90) {
      state = nextRevealState(state, total, frame(60), false)
      ticks++
    }
    expect(state.shown).toBe(total)
    expect(ticks).toBeLessThanOrEqual(90)
  })
  it("caps delayed frames and never overshoots", () => {
    let state = initialRevealState()
    for (let tick = 0; tick < 1000; tick++) {
      const next = nextRevealState(state, 100000, 100)
      expect(next.shown - state.shown).toBeLessThanOrEqual(revealFrameCap(100000))
      expect(next.shown).toBeLessThanOrEqual(100000)
      state = next
    }
  })
  it("keeps fractional cadence for short leftovers without flushing", () => {
    let state = initialRevealState(90)
    expect(nextRevealState(state, 100, 1, false).shown).toBeLessThan(100)
    for (let tick = 0; tick < 20; tick++) state = nextRevealState(state, 100, 1, false)
    expect(state.shown).toBe(100)
    expect(nextRevealState(state, 100, 1, false).shown).toBe(100)
  })
  it("keeps the arrival estimate stable during gaps without banking character credit", () => {
    const state = { ...initialRevealState(10), carry: 0.9, arrivalRate: 500 }
    const idle = nextRevealState(state, 10, 4)
    expect(idle.carry).toBe(0)
    expect(idle.arrivalRate).toBe(500)
    expect(nextRevealState(idle, 500, 1).shown - idle.shown).toBeLessThan(8)
  })
  it("has comparable fractional progress at 60Hz and 120Hz", () => {
    const sample = (hz: number) => {
      let state = initialRevealState()
      for (let tick = 0; tick < hz; tick++) state = nextRevealState(state, 1000, frame(hz))
      return state.shown
    }
    expect(Math.abs(sample(60) - sample(120))).toBeLessThan(20)
  })
  it("uses actual sub-frame time and bounds long stalls", () => {
    expect(revealFrames(0)).toBe(0)
    expect(revealFrames(8)).toBe(0.5)
    expect(revealFrames(32)).toBe(2)
    expect(revealFrames(500)).toBe(4)
  })
})
