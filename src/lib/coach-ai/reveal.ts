export const REVEAL_FRAME_MS = 16
export const REVEAL_CATCHUP_FRAMES = 12
export const REVEAL_MAX_CHARS_PER_FRAME = 400
export const REVEAL_FADE_MS = 140
export const REVEAL_FINISH_MAX_MS = 1350

export const revealFrames = (elapsedMs: number) => Math.min(4, Math.max(1, elapsedMs / REVEAL_FRAME_MS))

// The reference's time-based, backlog-proportional step. No arrival estimator.
export function nextRevealLength(shown: number, total: number, frames: number) {
  const pending = total - shown
  if (pending <= 0) return total
  const bounded = Math.min(4, Math.max(1, frames))
  const step = Math.min(REVEAL_MAX_CHARS_PER_FRAME,
    Math.max(Math.ceil(bounded), Math.ceil(pending * bounded / REVEAL_CATCHUP_FRAMES)))
  return Math.min(total, shown + step)
}

export type RevealBatch = { id: number; start: number; end: number; born: number }
export function advanceRevealBatches(batches: RevealBatch[], shown: number, next: number, id: number, now: number) {
  const young = batches.filter(batch => now - batch.born < REVEAL_FADE_MS)
  if (next > shown) young.push({ id, start: shown, end: next, born: now })
  return { batches: young, nextId: next > shown ? id + 1 : id }
}

export type FadePiece = { key: string; text: string; born: number | null }
export function splitFadeText(text: string, start: number, batches: RevealBatch[]): FadePiece[] {
  const pieces: FadePiece[] = []
  const end = start + text.length
  let cursor = start
  for (const batch of batches) {
    const from = Math.max(cursor, batch.start)
    const to = Math.min(end, batch.end)
    if (to <= from) continue
    if (from > cursor) pieces.push({ key: `settled-${cursor}`, text: text.slice(cursor - start, from - start), born: null })
    pieces.push({ key: `batch-${batch.id}`, text: text.slice(from - start, to - start), born: batch.born })
    cursor = to
  }
  if (cursor < end) pieces.push({ key: `settled-${cursor}`, text: text.slice(cursor - start), born: null })
  return pieces
}

export const withholdLiveCitation = (text: string) => text.replace(/\[\d*$/, "")
