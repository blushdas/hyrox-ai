import { describe, expect, it } from "vitest"
import { advanceRevealBatches, nextRevealLength, revealFrames, REVEAL_FADE_MS, REVEAL_FINISH_MAX_MS, splitFadeText, withholdLiveCitation, type RevealBatch } from "./reveal"

// Round 2 explicitly replaces arrival-rate smoothing with the reference formula.
// Sub-16ms rAF callbacks are gated by the hook, not banked by this pure step.
describe("reference reveal pacing", () => {
  it.each([1, 8, 100, 1500, 1000000])("matches the reference formula for %i pending characters", pending => {
    for (const frames of [0, 1, 1.04, 2, 4, 100]) {
      const bounded = Math.min(4, Math.max(1, frames))
      const expected = Math.min(pending, 400, Math.max(Math.ceil(bounded), Math.ceil(pending * bounded / 12)))
      expect(nextRevealLength(20, 20 + pending, frames)).toBe(20 + expected)
    }
  })
  it("tracks sustained burst arrivals without accumulating a growing backlog", () => {
    let shown = 0
    let total = 0
    let lateBacklog = 0
    for (let tick = 0; tick < 600; tick++) {
      if (tick % 15 === 0) total += 400
      const next = nextRevealLength(shown, total, revealFrames(1000 / 60))
      expect(next).toBeGreaterThanOrEqual(shown)
      expect(next).toBeLessThanOrEqual(total)
      shown = next
      if (tick >= 300) lateBacklog = Math.max(lateBacklog, total - shown)
    }
    expect(lateBacklog).toBeLessThan(510)
    expect(total - shown).toBeLessThan(150)
  })
  it.each([30, 60, 120])("drains a large final 1500-character backlog in 1.5s at %iHz", hz => {
    let shown = 0
    let elapsed = 0
    let sinceFrame = 0
    while (shown < 1500 && elapsed < 1500) {
      elapsed += 1000 / hz
      sinceFrame += 1000 / hz
      if (sinceFrame < 16) continue
      const next = nextRevealLength(shown, 1500, revealFrames(sinceFrame))
      expect(next - shown).toBeLessThanOrEqual(400)
      expect(next).toBeLessThanOrEqual(1500)
      shown = next
      sinceFrame = 0
    }
    expect(shown).toBe(1500)
    expect(elapsed).toBeLessThan(1350)
  })
  it("caps a stalled frame and never overshoots or moves backward", () => {
    let shown = 0
    for (let tick = 0; tick < 3000; tick++) {
      const next = nextRevealLength(shown, 1000000, 100)
      expect(next - shown).toBeLessThanOrEqual(400)
      expect(next).toBeGreaterThanOrEqual(shown)
      expect(next).toBeLessThanOrEqual(1000000)
      shown = next
    }
    expect(shown).toBe(1000000)
  })
  it("requires the finish guard for an arbitrary huge backlog under the fixed frame cap", () => {
    let shown = 0
    for (let tick = 0; tick < 81; tick++) shown = nextRevealLength(shown, 1000000, 1)
    expect(shown).toBeLessThan(1000000)
    expect(REVEAL_FINISH_MAX_MS).toBeLessThan(1500)
  })
  it("reveals short leftovers gradually without overshoot", () => {
    expect(nextRevealLength(90, 100, 1)).toBe(91)
    let shown = 90
    for (let tick = 0; tick < 10; tick++) shown = nextRevealLength(shown, 100, 1)
    expect(shown).toBe(100)
    expect(nextRevealLength(shown, 100, 1)).toBe(100)
  })
  it("does not bank credit while no text is pending", () => {
    expect(nextRevealLength(10, 10, 4)).toBe(10)
    expect(nextRevealLength(10, 500, 1)).toBe(51)
  })
  it("clamps elapsed time to the reference's one-to-four frames", () => {
    expect(revealFrames(0)).toBe(1)
    expect(revealFrames(8)).toBe(1)
    expect(revealFrames(32)).toBe(2)
    expect(revealFrames(500)).toBe(4)
  })
})

describe("reveal fade batches", () => {
  it("keeps batch IDs stable and merges settled text after 140ms", () => {
    const first = advanceRevealBatches([], 0, 10, 0, 0)
    const second = advanceRevealBatches(first.batches, 10, 20, first.nextId, 16)
    expect(second.batches.map(batch => batch.id)).toEqual([0, 1])
    const merged = advanceRevealBatches(second.batches, 20, 20, second.nextId, 140)
    expect(merged.batches.map(batch => batch.id)).toEqual([1])
    expect(splitFadeText("abcdefghijklmnopqrst", 0, merged.batches)).toEqual([
      { key: "settled-0", text: "abcdefghij", born: null },
      { key: "batch-1", text: "klmnopqrst", born: 16 },
    ])
  })
  it("bounds active elements in a long unbroken paragraph", () => {
    let batches: RevealBatch[] = []
    let id = 0
    for (let tick = 0; tick < 10000; tick++) {
      const next = advanceRevealBatches(batches, tick * 10, (tick + 1) * 10, id, tick * 16)
      batches = next.batches
      id = next.nextId
      expect(batches.length).toBeLessThanOrEqual(Math.ceil(REVEAL_FADE_MS / 16))
    }
    expect(id).toBe(10000)
  })
  it("intersects batches with formatted leaves without dropping or duplicating text", () => {
    const batches = [{ id: 3, start: 8, end: 16, born: 100 }, { id: 4, start: 16, end: 24, born: 116 }]
    const pieces = splitFadeText("abcdefghi", 12, batches)
    expect(pieces.map(piece => piece.text).join("")).toBe("abcdefghi")
    expect(pieces.map(piece => piece.key)).toEqual(["batch-3", "batch-4"])
    expect(splitFadeText("old", 0, batches)).toEqual([{ key: "settled-0", text: "old", born: null }])
  })
  it.each(["[", "[1", "[123"])("withholds incomplete numeric citation %s", marker => {
    expect(withholdLiveCitation(`A claim ${marker}`)).toBe("A claim ")
  })
  it("keeps complete citations and nonnumeric brackets", () => {
    expect(withholdLiveCitation("A claim [1]")).toBe("A claim [1]")
    expect(withholdLiveCitation("A claim [link")).toBe("A claim [link")
  })
})
