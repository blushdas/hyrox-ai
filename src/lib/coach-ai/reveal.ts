export const REVEAL_FRAME_MS = 16
export const REVEAL_CATCHUP_FRAMES = 12
export const REVEAL_MAX_CHARS_PER_FRAME = 400

export const revealFrames = (elapsedMs: number) => Math.min(4, Math.max(1, elapsedMs / REVEAL_FRAME_MS))

export const nextRevealLength = (shown: number, total: number, frames: number) => {
  const pending = total - shown
  if (pending <= 0) return total
  const step = Math.min(
    REVEAL_MAX_CHARS_PER_FRAME,
    Math.max(Math.ceil(frames), Math.ceil((pending * frames) / REVEAL_CATCHUP_FRAMES)),
  )
  return Math.min(total, shown + step)
}
