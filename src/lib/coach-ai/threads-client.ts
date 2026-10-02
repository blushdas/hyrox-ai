import type { ChatMessage, Citation, WebSource } from "./types"

export type ThreadSummary = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  archivedAt: number | null
}
export type ThreadResult<T> =
  | { kind: "ok"; value: T }
  | { kind: "unauthorized" | "notFound" | "failed" }
export type SavedMessage = Pick<ChatMessage, "role" | "content" | "status" | "citations" | "webSources" | "webSearch" | "errorMessage">
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)
const optional = (value: unknown, check: (value: unknown) => boolean) => value === undefined || check(value)
export function isThread(value: unknown): value is ThreadSummary {
  return record(value) && typeof value.id === "string" && !!value.id && typeof value.title === "string" && finite(value.createdAt) && finite(value.updatedAt) && (value.archivedAt === null || finite(value.archivedAt))
}
function isCitation(value: unknown): value is Citation {
  return record(value) && typeof value.id === "string" && ["session", "week", "phase"].includes(String(value.kind)) && typeof value.label === "string" && typeof value.href === "string" && typeof value.excerpt === "string" && optional(value.sessionId, v => typeof v === "string") && optional(value.week, finite)
}
function isSource(value: unknown): value is WebSource {
  return record(value) && typeof value.title === "string" && typeof value.host === "string" && typeof value.url === "string" && /^https?:\/\//i.test(value.url)
}
export function isMessage(value: unknown): value is ChatMessage {
  return record(value) && typeof value.id === "string" && !!value.id && (value.role === "user" || value.role === "assistant") && typeof value.content === "string" && ["complete", "streaming", "error"].includes(String(value.status)) && typeof value.createdAt === "string" && Number.isFinite(Date.parse(value.createdAt)) && Array.isArray(value.citations) && value.citations.every(isCitation) && optional(value.webSources, v => Array.isArray(v) && v.every(isSource)) && optional(value.webSearch, v => typeof v === "boolean") && optional(value.errorMessage, v => typeof v === "string")
}
async function request<T>(url: string, key: string, validate: (value: unknown) => value is T, body?: unknown): Promise<ThreadResult<T>> {
  try {
    const response = await fetch(url, body === undefined ? undefined : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (response.status === 401) return { kind: "unauthorized" }
    if (response.status === 404) return { kind: "notFound" }
    if (!response.ok) return { kind: "failed" }
    const data: unknown = await response.json()
    return record(data) && validate(data[key]) ? { kind: "ok", value: data[key] } : { kind: "failed" }
  } catch {
    // Transport and JSON errors are reported to the caller, never logged with chat data.
    return { kind: "failed" }
  }
}
export const listThreads = () => request("/api/me/threads", "threads", (v): v is ThreadSummary[] => Array.isArray(v) && v.every(isThread))
export const createThread = (title: string) => request("/api/me/threads", "thread", isThread, { title })
const messagesUrl = (id: string) => `/api/me/threads/${encodeURIComponent(id)}/messages`
export const getThreadMessages = (id: string) => request(messagesUrl(id), "messages", (v): v is ChatMessage[] => Array.isArray(v) && v.every(isMessage))
export const saveThreadMessage = (id: string, message: SavedMessage) => request(messagesUrl(id), "message", isMessage, { message })
