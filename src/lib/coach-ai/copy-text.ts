import { parseCoachTake, TAKE_LABELS } from "./coach-take"
export function toCopyText(content: string): string {
  const take = parseCoachTake(content)
  if (take) content = [take.preamble, take.headline && `${TAKE_LABELS[0]}\n${take.headline}\n${take.summary}`, ...take.sections.map(section => `${section.label}\n${section.items.join("\n")}`), take.nextMove && `Next move\n${take.nextMove}`, take.confidence && `Confidence: ${take.confidence.level} - ${take.confidence.basis}`].filter(Boolean).map(section => String(section).trim()).join("\n\n").replace(/\*\*/g, "")
  return content.replace(/ ?\[\d+\]/g, "")
}
