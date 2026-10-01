"use client"
import { create } from "zustand"
import type { TrainingPlan } from "@/lib/types"
import type { ChatMessage } from "@/lib/coach-ai/types"
import { resolveCitations } from "@/lib/coach-ai/citations"
import { useAthleteStore } from "@/stores/athlete-store"
import { RATE_LIMIT_MESSAGE } from "@/lib/coach-ai/rate-limit"
type Context = {
  plan: TrainingPlan
  currentWeek: number
  today: number
  sessionId?: string
}
type ChatState = {
  messages: ChatMessage[]
  isStreaming: boolean
  send: (prompt: string, context: Context, webSearch?: boolean) => void
  retry: (context: Context) => void
  stop: () => void
  reset: () => void
}
let controller: AbortController | undefined
let generation = 0
export const useCoachAIStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  stop: () => {
    generation++
    controller?.abort()
    controller = undefined
    set((s) => ({
      isStreaming: false,
      messages: s.messages.map((m) =>
        m.status === "streaming" ? { ...m, status: "complete" } : m,
      ),
    }))
  },
  reset: () => {
    get().stop()
    set({ messages: [] })
  },
  retry: (context) => {
    if (get().isStreaming) return
    const last = [...get().messages].reverse().find((m) => m.role === "user")
    if (last) {
      set((s) => ({ messages: s.messages.slice(0, -2) }))
      get().send(last.content, context, last.webSearch)
    }
  },
  send: (prompt, context, webSearch = false) => {
    if (get().isStreaming || !prompt.trim()) return
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
          id: crypto.randomUUID(),
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
        if (token === generation) { controller = undefined; set({ isStreaming: false }) }
      }
    })()
  },
}))
