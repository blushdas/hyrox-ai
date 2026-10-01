import { fenceEnd, fenceStart } from "./markdown"

export function splitStreaming(text: string): { finalized: string[]; tail: string } {
  const normalized = text.replace(/\r\n/g, "\n")
  const finalized: string[] = []
  let fence: string | undefined
  let start = 0
  let offset = 0
  const lines = normalized.split("\n")
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i]
    if (fence) {
      if (fenceEnd(line, fence)) fence = undefined
    } else {
      const opening = fenceStart(line)
      if (opening) fence = opening[1]
      else if (!line.trim()) {
        const block = normalized.slice(start, offset).trimEnd()
        if (block) finalized.push(block)
        start = offset + line.length + 1
      }
    }
    offset += line.length + 1
  }
  return { finalized, tail: normalized.slice(start) }
}

// Withhold ambiguous trailing delimiters until the next chunk resolves them.
// Complete inline markup is flattened, so the live tail stays plain text.
export function pendingTail(text: string): string {
  return text.replace(/\[\d*$/, "").replace(/[*_`]+$/, "")
}
