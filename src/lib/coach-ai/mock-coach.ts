import type { TrainingPlan } from "@/lib/types"
import type { ChatMessage, SuggestedPrompt } from "./types"
import { getNextSession, getWeekSummary } from "@/lib/train/selectors"
export const MAX_MESSAGE_CHARS = 2000
export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id:"week",label:"Why is this week built like this?",prompt:"Why is this week built like this?" },
  { id:"next",label:"What should I focus on in my next session?",prompt:"What should I focus on in my next session?" },
  { id:"pace",label:"How do I pace the sled push?",prompt:"How do I pace the sled push?" },
  { id:"race",label:"Am I on track for race day?",prompt:"Am I on track for race day?" },
]
export function buildCoachReply(prompt: string, plan: TrainingPlan, currentWeek: number, todayIsoWeekday: number, sessionId?: string): Pick<ChatMessage,"content"|"citations"|"status"|"errorMessage"> {
  if (prompt.length > MAX_MESSAGE_CHARS) return { content:"",citations:[],status:"error",errorMessage:"Message too long. Keep it under 2000 characters." }
  const all = plan.weeks.flatMap(w=>w.sessions)
  const week = plan.weeks.find(w=>w.week===currentWeek)
  const context = all.find(s=>s.id===sessionId)
  const next = getNextSession(plan,currentWeek,todayIsoWeekday)
  const lower = prompt.toLowerCase()
  const pacing = /pac|sled|station/.test(lower)
  const readiness = /race|track|ready/.test(lower)
  const weekly = /week|structure|built/.test(lower)
  const candidates = context ? [context,...(week?.sessions ?? [])] : pacing ? [...all.filter(s=>s.week>=currentWeek && (s.type==="stations" || s.type==="race_sim"))] : weekly || readiness ? week?.sessions ?? [] : next ? [next] : all
  const selected = [...new Map(candidates.map(s=>[s.id,s])).values()].slice(0,2)
  if (!selected.length) return {content:"There are no sessions to reference in this plan yet. Open Train to review your plan.",citations:[],status:"complete"}
  const summary = week ? getWeekSummary(week) : null
  const intro = context ? "Here is the role of this session in your plan." : pacing ? "Use the targets in your station work to keep effort repeatable." : readiness && summary ? `You have logged ${summary.completed} of ${summary.planned} sessions in week ${currentWeek} (${summary.compliancePct}% complete). Logged sessions show consistency; they do not predict a race result.` : weekly ? `Week ${currentWeek} develops your ${week?.phase ?? selected[0].phase} phase through these sessions.` : "Start with the next pending session and follow its prescribed effort."
  const content = intro + "\n\n" + selected.map((s,i)=>`${s.title}, week ${s.week} (${s.phase}), is planned for ${s.duration}. ${s.coachNote || "Follow the structured warm-up, main set and cool-down."} [${i+1}]`).join("\n\n")
  return {content,citations:selected.map(s=>({id:s.id,kind:"session",label:`W${String(s.week).padStart(2,"0")} · ${s.title}`,href:`/session/${s.id}`,sessionId:s.id,week:s.week,excerpt:s.coachNote})),status:"complete"}
}
export function chunkForStreaming(text: string, wordsPerChunk: number): string[] {
  const words = text.match(/\S+\s*|\s+/g) ?? []
  const chunks: string[] = []; const size = Math.max(1,Math.floor(wordsPerChunk) || 1)
  for(let i=0;i<words.length;i+=size) chunks.push(words.slice(i,i+size).join(""))
  return chunks
}
