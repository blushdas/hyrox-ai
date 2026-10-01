import { describe, expect, it } from "vitest"
import { nextRevealLength, revealFrames } from "./reveal"

describe("nextRevealLength", () => {
  it("reveals at least one char per frame", () => {
    expect(nextRevealLength(0, 5, 1)).toBe(1)
  })
  it("catches up on a large backlog, capped at 400 per frame", () => {
    expect(nextRevealLength(0, 10_000, 1)).toBe(400)
  })
  it("scales the step with pending text", () => {
    expect(nextRevealLength(0, 120, 1)).toBe(10)
  })
  it("never overshoots the total", () => {
    expect(nextRevealLength(98, 100, 4)).toBe(100)
    expect(nextRevealLength(100, 100, 1)).toBe(100)
    expect(nextRevealLength(120, 100, 1)).toBe(100)
  })
  it("clamps frame time between 1 and 4 frames", () => {
    expect(revealFrames(1)).toBe(1)
    expect(revealFrames(16)).toBe(1)
    expect(revealFrames(32)).toBe(2)
    expect(revealFrames(500)).toBe(4)
  })
})
