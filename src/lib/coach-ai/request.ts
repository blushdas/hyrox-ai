import type { PlanContext } from "./prompt"
export const MAX_BODY_BYTES = 64 * 1024
export const MAX_TOKENS = 800
export const MAX_TURNS = 10
export type CoachRequest = { webSearch: boolean; messages: { role: "user" | "assistant"; content: string }[]; context: PlanContext }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)
const text = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max
const integer = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && Number(v) >= min && Number(v) <= max
export function validateRequest(value: unknown): CoachRequest {
  if (!object(value) || !Array.isArray(value.messages) || !value.messages.length || !object(value.context)) throw new Error("Invalid request")
  if (value.webSearch !== undefined && typeof value.webSearch !== "boolean") throw new Error("Invalid webSearch")
  const messages = value.messages.map((m): CoachRequest["messages"][number] => {
    if (!object(m) || (m.role !== "user" && m.role !== "assistant") || (typeof m.content !== "string" || (m.role === "user" && m.content.length > 2000)) || !m.content.trim()) throw new Error("Invalid message")
    return { role: m.role, content: m.content.slice(0, 2000) }
  })
  if (messages.at(-1)?.role !== "user") throw new Error("Last turn must be user")
  const c = value.context
  if (!text(c.category, 64) || !text(c.raceDate, 32) || !integer(c.daysPerWeek, 1, 7) || !integer(c.currentWeek, 1, 104) || (c.sessionId !== undefined && !text(c.sessionId, 128)) || !Array.isArray(c.sessions) || c.sessions.length > 28) throw new Error("Invalid context")
  const sessions = c.sessions.map(s => {
    if (!object(s) || !text(s.id, 128) || !/^[\w-]+$/.test(s.id) || !integer(s.week, 1, 104) || !text(s.title, 200) || !text(s.phase, 40) || !text(s.type, 40)) throw new Error("Invalid session")
    return { id: s.id, week: s.week, title: s.title, phase: s.phase, type: s.type }
  })
  return { webSearch: value.webSearch === true, messages: messages.slice(-MAX_TURNS), context: { category: c.category, raceDate: c.raceDate, daysPerWeek: c.daysPerWeek, currentWeek: c.currentWeek, sessionId: c.sessionId, sessions } }
}
export async function readRequest(request: Request): Promise<CoachRequest> {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES || !request.body) throw new Error("Invalid body")
  const reader = request.body.getReader()
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let bytes = 0, body = ""
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > MAX_BODY_BYTES) throw new Error("Body too large")
      body += decoder.decode(value, { stream: true })
    }
    return validateRequest(JSON.parse(body + decoder.decode()))
  } finally {
    await reader.cancel()
    reader.releaseLock()
  }
}
