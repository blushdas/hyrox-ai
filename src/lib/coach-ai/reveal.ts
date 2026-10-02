export const REVEAL_FRAME_MS = 16
export const REVEAL_MAX_CHARS_PER_FRAME = 8
const BASE_RATE = 100
const MAX_RATE = 240

export type RevealState = { shown: number; rate: number; carry: number }
export const initialRevealState = (shown = 0): RevealState => ({ shown, rate: BASE_RATE, carry: 0 })

export const revealFrames = (elapsedMs: number) => Math.min(4, Math.max(0, elapsedMs / REVEAL_FRAME_MS))

// Rate changes over seconds, not on each arriving chunk. Fractional characters
// survive frames so the final few characters drain at the same cadence.
export function nextRevealState(state: RevealState, total: number, frames: number): RevealState {
  const pending = Math.max(0, total - state.shown)
  if (!pending) return { ...state, shown: Math.min(state.shown, total), carry: 0 }
  const seconds = revealFrames(frames * REVEAL_FRAME_MS) * REVEAL_FRAME_MS / 1000
  const desired = Math.min(MAX_RATE, BASE_RATE + pending / 8)
  const rate = state.rate + (desired - state.rate) * (1 - Math.exp(-seconds / 2))
  const available = state.carry + rate * seconds
  const step = Math.min(pending, REVEAL_MAX_CHARS_PER_FRAME, Math.floor(available))
  return { shown: state.shown + step, rate, carry: step === pending ? 0 : available - Math.floor(available) }
}
