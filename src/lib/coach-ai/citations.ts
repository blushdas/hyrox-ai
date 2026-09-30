import type { TrainingPlan } from "@/lib/types"
import type { Citation } from "./types"
// Reparse accumulated text so chunk boundaries never expose incomplete markers.
export function resolveCitations(raw: string, plan: TrainingPlan) {
  const sessions = new Map(plan.weeks.flatMap(w => w.sessions).map(s => [s.id, s]))
  const citations: Citation[] = []
  let content = raw.replace(/\[\[session:([^\]]*)\]\]/g, (_, id: string) => {
    const session = sessions.get(id)
    if (!session) return ""
    let index = citations.findIndex(c => c.id === id)
    if (index < 0) {
      index = citations.length
      citations.push({ id, kind: "session", label: `W${String(session.week).padStart(2, "0")} · ${session.title}`, href: `/session/${encodeURIComponent(id)}`, sessionId: id, week: session.week, excerpt: session.coachNote })
    }
    return `[${index + 1}]`
  })
  const start = content.lastIndexOf("[[")
  if (start >= 0 && !content.slice(start).includes("]]")) content = content.slice(0, start)
  else if (content.endsWith("[")) content = content.slice(0, -1)
  return { content, citations }
}
