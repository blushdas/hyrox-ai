"use client"
import { create } from "zustand"
import type { TrainingPlan } from "@/lib/types"
import type { ChatMessage } from "@/lib/coach-ai/types"
import { resolveCitations } from "@/lib/coach-ai/citations"
import { useAthleteStore } from "@/stores/athlete-store"
import { RATE_LIMIT_MESSAGE } from "@/lib/coach-ai/rate-limit"
import { createThread, getThreadMessages, listThreads, saveThreadMessage, type ThreadSummary, type ThreadResult } from "@/lib/coach-ai/threads-client"

type Context = {
  plan: TrainingPlan
  currentWeek: number
  today: number
  sessionId?: string
}
type ChatState = {
  threadId: string | null
  threads: ThreadSummary[]
  threadsStatus: "idle" | "loading" | "ready" | "signedOut" | "error"
  saveNotice: string | null
  loadThreads: () => Promise<void>
  openThread: (id: string) => Promise<void>
  restoreLastThread: () => Promise<void>
  startNewChat: () => void
  messages: ChatMessage[]
  isStreaming: boolean
  send: (prompt: string, context: Context, webSearch?: boolean) => void
  retry: (context: Context) => void
  stop: () => void
  reset: () => void
}
let controller: AbortController | undefined
let generation = 0
const LAST_THREAD = "coach-ai:last-thread"
const SAVE_NOTICE = "Chat not saved. It will stay here until you leave."
type Conversation = { id: string | null; queue: Promise<void>; attempted: Set<string>; unavailable: boolean }
const conversation = (id: string | null = null): Conversation => ({ id, queue: Promise.resolve(), attempted: new Set(), unavailable: false })
let active = conversation()
let retryUser: ChatMessage | undefined
let opening = 0
let listing = 0
function remember(id: string | null) {
  try {
    if (id) localStorage.setItem(LAST_THREAD, id)
    else localStorage.removeItem(LAST_THREAD)
  } catch {
    // Storage is optional; the live conversation stays usable.
    return false
  }
  return true
}
export const useCoachAIStore = create<ChatState>((set, get) => ({
  threadId: null,
  threads: [],
  threadsStatus: "idle",
  saveNotice: null,
  messages: [],
  isStreaming: false,
  loadThreads: async () => {
    const request = ++listing
    set({ threadsStatus: "loading" })
    const result = await listThreads()
    if (request !== listing) return
    if (result.kind === "ok") set({ threads: result.value.sort((a, b) => b.updatedAt - a.updatedAt), threadsStatus: "ready" })
    else if (result.kind === "unauthorized") set({ threads: [], threadsStatus: "signedOut", saveNotice: null })
    else set({ threadsStatus: "error", saveNotice: SAVE_NOTICE })
  },
  openThread: async (id) => {
    get().stop()
    const request = ++opening
    const current = active = conversation(id)
    set({ threadId: null, messages: [], saveNotice: null })
    const result = await getThreadMessages(id)
    if (request !== opening || active !== current) return
    if (result.kind === "ok") {
      result.value.forEach(m => current.attempted.add(m.id))
      set({ messages: result.value, threadId: id })
      remember(id)
    } else {
      active = conversation()
      remember(null)
      set({ threadId: null, messages: [], ...(result.kind === "unauthorized" ? { threadsStatus: "signedOut", saveNotice: null } : result.kind === "notFound" ? {} : { saveNotice: SAVE_NOTICE }) })
    }
  },
  restoreLastThread: async () => {
    let id: string | null
    try { id = localStorage.getItem(LAST_THREAD) }
    catch {
      // Private-mode or missing storage opens a fresh chat.
      return
    }
    if (id) await get().openThread(id)
  },
  stop: () => {
    generation++
    controller?.abort()
    controller = undefined
    const partial = get().isStreaming ? get().messages.at(-1) : undefined
    set((s) => ({
      isStreaming: false,
      messages: s.messages.map((m) =>
        m.status === "streaming" ? { ...m, status: "complete" } : m,
      ),
    }))
    if (partial?.role === "assistant" && partial.status !== "error" && partial.content.trim()) persist({ ...partial, status: "complete" }, active)
  },
  startNewChat: () => {
    get().stop()
    opening++
    active = conversation()
    retryUser = undefined
    remember(null)
    set({ messages: [], threadId: null, saveNotice: null })
  },
  reset: () => get().startNewChat(),
  retry: (context) => {
    if (get().isStreaming) return
    const last = [...get().messages].reverse().find((m) => m.role === "user")
    if (last) {
      set((s) => ({ messages: s.messages.slice(0, -2) }))
      retryUser = last
      get().send(last.content, context, last.webSearch)
    }
  },
  send: (prompt, context, webSearch = false) => {
    if (get().isStreaming || !prompt.trim()) return
    opening++
    const current = active
    const userId = retryUser?.id ?? crypto.randomUUID()
    retryUser = undefined
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    const abort = new AbortController()
    controller = abort
    const token = ++generation
    const history = get().messages.filter(m => m.status === "complete" && m.content.trim()).slice(-9).map(m => ({ role: m.role, content: m.content }))
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: userId,
          role: "user",
          content: prompt,
          webSearch,
          citations: [],
          status: "complete",
          createdAt,
        },
        {
          id,
          role: "assistant",
          createdAt,
          content: "",
          citations: [],
          status: "streaming",
        },
      ],
      isStreaming: true,
    }))
    // Streaming starts synchronously; persistence waits in a separate ordered queue.
    persist(get().messages.find(m => m.id === userId) ?? {
      id: userId, role: "user", content: prompt, citations: [], status: "complete", createdAt, webSearch,
    }, current)
    const profile = useAthleteStore.getState().profile
    const update = (patch: Partial<ChatMessage>) => {
      if (token !== generation) return
      set(s => ({ messages: s.messages.map(m => m.id === id ? { ...m, ...patch } : m) }))
    }
    void (async () => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
      let raw = ""
      try {
        const response = await fetch("/api/coach-ai", {
          method: "POST", signal: abort.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webSearch, messages: [...history, { role: "user", content: prompt }], context: {
            category: profile?.category ?? "beginner", raceDate: profile?.raceDate ?? context.plan.raceDate,
            daysPerWeek: profile?.daysPerWeek ?? 4, currentWeek: context.currentWeek, sessionId: context.sessionId,
            sessions: context.plan.weeks.filter(w => w.week === context.currentWeek || w.week === context.currentWeek + 1).flatMap(w => w.sessions).map(({ id, week, title, phase, type }) => ({ id, week, title, phase, type })),
          } }),
        })
        if (!response.ok) throw new Error(response.status === 429 ? RATE_LIMIT_MESSAGE : response.status === 401 ? "Sign in to use Coach AI." : response.status === 400 ? "Invalid request. Keep messages under 2000 characters." : "Coach is unavailable right now. Please try again.")
        if (!response.body) throw new Error("Coach returned an empty response. Please retry.")
        reader = response.body.getReader()
        const decoder = new TextDecoder()
        let pending = "", complete = false
        while (!complete) {
          const { value, done } = await reader.read()
          if (token !== generation) return
          pending += done ? decoder.decode() : decoder.decode(value, { stream: true })
          let end: number
          while ((end = pending.indexOf("\n")) >= 0) {
            const line = pending.slice(0, end)
            pending = pending.slice(end + 1)
            const frame = JSON.parse(line)
            if (frame.error) throw new Error("Coach is unavailable right now. Please try again.")
            if (frame.done === true) { complete = true; break }
            if (Array.isArray(frame.sources) && frame.sources.every((source: unknown) => {
              if (!source || typeof source !== "object") return false
              return "title" in source && typeof source.title === "string" && "host" in source && typeof source.host === "string" && "url" in source && typeof source.url === "string" && /^https?:\/\//i.test(source.url)
            })) { update({ webSources: frame.sources }); continue }
            if (typeof frame.text !== "string") throw new Error("Invalid coach response. Please retry.")
            raw += frame.text
            update({ ...resolveCitations(raw, context.plan), status: "streaming" })
          }
          if (done && !complete) throw new Error("Connection interrupted. Please retry.")
        }
        if (!raw.trim()) throw new Error("Coach returned an empty response. Please retry.")
        update({ ...resolveCitations(raw, context.plan), status: "complete" })
      } catch (error) {
        if (token !== generation || abort.signal.aborted) return // Stop/reset intentionally complete the old generation.
        update({ status: "error", errorMessage: error instanceof Error && !(error instanceof TypeError) && !(error instanceof SyntaxError) ? error.message : "Connection interrupted. Please retry." })
      } finally {
        // Cancel unread data after a terminal frame; release even on network errors.
        if (reader) {
          try { await reader.cancel() }
          catch { update({ status: "error", errorMessage: "Connection interrupted. Please retry." }) }
          reader.releaseLock()
        }
        if (token === generation) {
          controller = undefined; set({ isStreaming: false })
          const message = get().messages.find(m => m.id === id)
          if (message?.status === "complete" && message.content.trim()) persist(message, current)
        }
      }
    })()
  },
}))

function report<T>(result: ThreadResult<T>, current: Conversation) {
  if (result.kind === "unauthorized") {
    listing++
    useCoachAIStore.setState({ threads: [], threadsStatus: "signedOut", saveNotice: null })
    return
  }
  if (active !== current) return
  if (result.kind !== "ok" && useCoachAIStore.getState().threadsStatus !== "signedOut") useCoachAIStore.setState({ saveNotice: SAVE_NOTICE })
}
function persist(message: ChatMessage, current: Conversation) {
  // Retry retains the local user id; server-generated ids never replace it.
  if (current.attempted.has(message.id)) return
  current.attempted.add(message.id)
  const previous = current.queue
  current.queue = (async () => {
    await previous
    if (current.unavailable) return
    if (!current.id) {
      const result = await createThread(message.content.trim().slice(0, 60))
      report(result, current)
      if (result.kind !== "ok") { current.unavailable = true; return }
      current.id = result.value.id
      if (active === current) {
        const state = useCoachAIStore.getState()
        useCoachAIStore.setState({ threadId: current.id, threads: [result.value, ...state.threads.filter(t => t.id !== current.id)].sort((a, b) => b.updatedAt - a.updatedAt) })
        remember(current.id)
      }
    }
    const { role, content, status, citations, webSources, webSearch, errorMessage } = message
    const result = await saveThreadMessage(current.id, { role, content, status, citations, webSources, webSearch, errorMessage })
    report(result, current)
    if (result.kind === "unauthorized") current.unavailable = true
    if (result.kind === "ok" && active === current) {
      remember(current.id)
      useCoachAIStore.setState(s => ({ threadId: current.id, threads: s.threads.map(t => t.id === current.id ? { ...t, updatedAt: Math.max(t.updatedAt, Date.parse(result.value.createdAt)) } : t).sort((a, b) => b.updatedAt - a.updatedAt) }))
    }
  })().catch(() => {
    // Unexpected persistence errors remain visible without affecting the stream.
    report({ kind: "failed" }, current)
  })
}
