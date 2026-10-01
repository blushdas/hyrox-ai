export const TAKE_LABELS = ["Coach's take", "Pros and cons", "Watch-outs", "What's working", "Next move"] as const
export type CoachTake = {
  preamble: string
  headline: string
  summary: string
  sections: { label: string; items: string[] }[]
  nextMove: string
  confidence?: { level: "Low" | "Medium" | "High"; basis: string }
}
const clean = (line: string) => line.trim().replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").replace(/:$/, "").trim()
const prose = (line: string) => line.replace(/^\s*(?:[-*+] |\d+[.)] )/, "").trim()
/** Duplicate headers merge in encounter order. Linear scans only; malformed text falls back. */
export function parseCoachTake(text: string): CoachTake | null {
  if (typeof text !== "string") return null
  const bodies: string[][] = TAKE_LABELS.map(() => [])
  const preamble: string[] = []
  let current = -1
  let confidence: CoachTake["confidence"]
  for (const raw of text.split(/\r?\n/)) {
    const line = clean(raw)
    const header = TAKE_LABELS.findIndex(label => label.toLowerCase() === line.toLowerCase())
    if (header >= 0) { current = header; continue }
    const match = /^confidence:\s*(low|medium|high)\s*[-–—]\s*(.+)$/i.exec(line)
    if (match) {
      confidence = { level: (match[1][0].toUpperCase() + match[1].slice(1).toLowerCase()) as "Low" | "Medium" | "High", basis: match[2] }
      continue
    }
    if (raw.trim()) (current < 0 ? preamble : bodies[current]).push(prose(raw))
  }
  if (bodies.filter(body => body.some(Boolean)).length < 2) return null
  return {
    preamble: preamble.join("\n"), headline: bodies[0][0] ?? "", summary: bodies[0].slice(1).join(" "),
    sections: bodies.slice(1, 4).map((items, i) => ({ label: TAKE_LABELS[i + 1], items: items.filter(Boolean) })).filter(section => section.items.length),
    nextMove: bodies[4].join(" "), confidence,
  }
}
