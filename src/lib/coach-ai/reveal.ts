export const REVEAL_FRAME_MS = 16
export const REVEAL_MAX_CHARS_PER_FRAME = 8
const BASE_RATE = 100
export const REVEAL_DRAIN_MS = 1200

export type RevealState = {
  shown: number
  rate: number
  carry: number
  received: number
  arrivalRate: number
  sinceArrival: number
  drainRate: number | null
}
export const initialRevealState = (shown = 0): RevealState => ({
  shown, rate: BASE_RATE, carry: 0, received: shown,
  arrivalRate: BASE_RATE, sinceArrival: 0.5, drainRate: null,
})

// A fixed eight-character ceiling cannot drain arbitrary reply lengths in 1.5s.
// Bound each update to a small fraction of the reply (plus the eight-char floor).
export const revealFrameCap = (total: number) => Math.max(REVEAL_MAX_CHARS_PER_FRAME, Math.ceil(total / 30))

export const revealFrames = (elapsedMs: number) => Math.min(4, Math.max(0, elapsedMs / REVEAL_FRAME_MS))

// Arrival estimates change only when a chunk arrives; the reveal rate then
// approaches that estimate gradually instead of sprinting on each burst.
export function nextRevealState(state: RevealState, total: number, frames: number, streaming = true): RevealState {
  const seconds = revealFrames(frames * REVEAL_FRAME_MS) * REVEAL_FRAME_MS / 1000
  const pending = Math.max(0, total - state.shown)
  const sinceArrival = state.sinceArrival + seconds
  const arrived = Math.max(0, total - state.received)
  const arrivalRate = arrived
    ? (state.received === 0 ? arrived / Math.max(0.25, sinceArrival) :
      state.arrivalRate + (arrived / Math.max(0.1, sinceArrival) - state.arrivalRate) * 0.5)
    : state.arrivalRate
  const drainRate = streaming ? null : state.drainRate ?? Math.max(state.rate, pending * 1000 / REVEAL_DRAIN_MS)
  const desired = drainRate ?? Math.max(BASE_RATE, arrivalRate) *
    (1 + Math.min(0.25, pending / Math.max(1, arrivalRate * 2)))
  const rate = state.rate + (desired - state.rate) * (1 - Math.exp(-seconds / (streaming ? 0.25 : 0.08)))
  const available = state.carry + rate * seconds
  const step = Math.min(pending, revealFrameCap(total), Math.floor(available))
  return {
    shown: Math.min(total, state.shown + step), rate,
    carry: step === pending ? 0 : available - Math.floor(available),
    received: total, arrivalRate, sinceArrival: arrived ? 0 : sinceArrival, drainRate,
  }
}
