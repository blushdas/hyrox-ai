import { afterEach, beforeEach, expect, test, vi } from "vitest"
vi.mock("@/lib/coach-ai/threads-client", () => ({
  createThread: vi.fn(async () => ({ kind: "failed" })),
  getThreadMessages: vi.fn(), listThreads: vi.fn(), saveThreadMessage: vi.fn(),
}))
import * as client from "@/lib/coach-ai/threads-client"
import { useCoachAIStore } from "./coach-ai-store"
import { generateBeginnerPlan } from "@/lib/mock-data"
const context = { plan: { id: "test", raceDate: "2026-12-20", totalWeeks: 12, weeks: generateBeginnerPlan("2026-12-20") }, currentWeek: 4, today: 1 }
const state = () => useCoachAIStore.getState()
const encoder = new TextEncoder()
const frame = (data: unknown) => encoder.encode(JSON.stringify(data) + "\n")
beforeEach(() => {
  state().reset()
  useCoachAIStore.setState({ threads: [], threadsStatus: "idle", saveNotice: null })
  vi.mocked(client.createThread).mockImplementation(async () => ({ kind: "failed" }))
  vi.stubGlobal("fetch", vi.fn())
})
afterEach(() => { state().reset(); vi.unstubAllGlobals() })
test("incremental answer and split citations render before completion; concurrent send guarded", async () => {
  let stream!: ReadableStreamDefaultController<Uint8Array>
  vi.mocked(fetch).mockResolvedValue(new Response(new ReadableStream({ start(c) { stream = c } })))
  state().send("why", context); state().send("duplicate", context)
  expect(fetch).toHaveBeenCalledTimes(1)
  stream.enqueue(frame({ text: "Start " }))
  await vi.waitFor(() => expect(state().messages.at(-1)?.content).toBe("Start "))
  expect(state().isStreaming).toBe(true)
  const session = context.plan.weeks[3].sessions[0]
  stream.enqueue(frame({ text: "[[sess" }))
  stream.enqueue(frame({ text: `ion:${session.id}]]` }))
  await vi.waitFor(() => expect(state().messages.at(-1)?.content).toBe("Start [1]"))
  stream.enqueue(frame({ done: true })); stream.close()
  await vi.waitFor(() => expect(state().isStreaming).toBe(false))
  expect(state().messages.at(-1)?.citations[0].href).toBe(`/session/${session.id}`)
  expect(state().messages.at(-1)?.status).toBe("complete")
  const [url, init] = vi.mocked(fetch).mock.calls[0]
  expect(url).toBe("/api/coach-ai"); expect(JSON.parse(init!.body as string).context.sessions.every((s: { week: number }) => s.week === 4 || s.week === 5)).toBe(true)
})
test("Stop aborts and completes; a late old generation cannot mutate the next chat", async () => {
  let resolve!: (response: Response) => void
  vi.mocked(fetch).mockReturnValueOnce(new Promise(r => { resolve = r }))
  state().send("why", context)
  const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!
  state().stop(); expect(signal.aborted).toBe(true); expect(state().messages.at(-1)?.status).toBe("complete")
  state().reset()
  vi.mocked(fetch).mockResolvedValueOnce(new Response(frame({ text: "new" })))
  resolve(new Response(frame({ text: "old" })))
  await new Promise(r => setTimeout(r, 0))
  expect(state().messages).toEqual([])
})
test("Reset aborts in-flight request and clears state", () => {
  vi.mocked(fetch).mockReturnValue(new Promise(() => undefined))
  state().send("why", context); const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!
  state().reset(); expect(signal.aborted).toBe(true); expect(state().messages).toEqual([]); expect(state().isStreaming).toBe(false)
})
test("429 renders exact human error; Retry reuses last user turn", async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 429 }))
  state().send("why", context)
  await vi.waitFor(() => expect(state().isStreaming).toBe(false))
  expect(state().messages.at(-1)).toMatchObject({ status: "error", errorMessage: "Too many messages. Wait a minute and try again." })
  vi.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([...frame({ text: "Retry works" }), ...frame({ done: true })])))
  state().retry(context)
  await vi.waitFor(() => expect(state().isStreaming).toBe(false))
  expect(state().messages).toHaveLength(2); expect(state().messages.at(-1)?.content).toBe("Retry works")
})
test.each(["truncated", "network", "error-frame", "malformed"])("%s becomes explicit error", async kind => {
  if (kind === "network") vi.mocked(fetch).mockRejectedValue(new TypeError("network"))
  else vi.mocked(fetch).mockResolvedValue(new Response(kind === "truncated" ? frame({ text: "partial" }) : kind === "error-frame" ? frame({ error: "error" }) : "bad json\n"))
  state().send("why", context)
  await vi.waitFor(() => expect(state().isStreaming).toBe(false))
  expect(state().messages.at(-1)?.status).toBe("error")
  expect(state().messages.at(-1)?.errorMessage).toBeTruthy()
})

test("source frame survives streaming and completion", async () => {
 const sources = [{ title: "Rules", host: "hyrox.com", url: "https://hyrox.com/rules" }]
 vi.mocked(fetch).mockResolvedValue(new Response(new Uint8Array([...frame({sources}), ...frame({text: "Answer"}), ...frame({done: true})])))
 state().send("rules", context)
 await vi.waitFor(() => expect(state().isStreaming).toBe(false))
 expect(state().messages.at(-1)).toMatchObject({webSources: sources, content: "Answer", status: "complete"})
})
test("forced-search flag travels with the user turn and survives Retry",async()=>{
 vi.mocked(fetch).mockResolvedValueOnce(new Response("failed",{status:502}))
 state().send("today",context,true)
 await vi.waitFor(()=>expect(state().isStreaming).toBe(false))
 expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).webSearch).toBe(true)
 vi.mocked(fetch).mockResolvedValueOnce(new Response(new Uint8Array([...frame({text:"Answer"}),...frame({done:true})])))
 state().retry(context)
 await vi.waitFor(()=>expect(state().isStreaming).toBe(false))
 expect(JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string).webSearch).toBe(true)
})

const summary = { id: "thread", title: "Saved", createdAt: 1, updatedAt: 2, archivedAt: null }
const stored = { id: "server-user", role: "user" as const, content: "Hi", citations: [], status: "complete" as const, createdAt: "2026-10-02T00:00:00Z" }
async function persistence(coach = () => new Response(new Uint8Array([...frame({ text: "Answer" }), ...frame({ done: true })])), fail?: string | number) {
  const actual = await vi.importActual<typeof client>("@/lib/coach-ai/threads-client")
  vi.mocked(client.createThread).mockImplementation(actual.createThread)
  vi.mocked(client.saveThreadMessage).mockImplementation(actual.saveThreadMessage)
  vi.mocked(client.listThreads).mockImplementation(actual.listThreads)
  vi.mocked(client.getThreadMessages).mockImplementation(actual.getThreadMessages)
  vi.stubGlobal("localStorage", { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() })
  vi.mocked(fetch).mockImplementation(async (url, init) => {
    if (url === "/api/coach-ai") return coach()
    if (fail === "network") throw new TypeError("offline")
    if (typeof fail === "number") return new Response("{}", { status: fail })
    if (url === "/api/me/threads") {
      if (init?.method === "POST") return fail === "create" ? new Response("{}", { status: 500 }) : Response.json({ thread: summary }, { status: 201 })
      return Response.json({ threads: [summary] })
    }
    if (init?.method === "POST") {
      if (fail === "message") return new Response("{}", { status: 500 })
      return Response.json({ message: { ...stored, ...JSON.parse(init.body as string).message, id: crypto.randomUUID() } }, { status: 201 })
    }
    return Response.json({ messages: [stored] })
  })
}
const posts = () => vi.mocked(fetch).mock.calls.filter(([url, init]) => String(url).endsWith("/messages") && init?.method === "POST").map(([, init]) => JSON.parse(init!.body as string).message)
test("save complete: two message POSTs, one thread, title trimmed to 60; no empty thread on New chat", async () => {
  await persistence()
  state().startNewChat()
  expect(fetch).not.toHaveBeenCalled()
  state().send("  " + "x".repeat(70), context)
  expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/coach-ai")
  await vi.waitFor(() => expect(posts()).toHaveLength(2))
  expect(posts().map(m => m.role)).toEqual(["user", "assistant"])
  const create = vi.mocked(fetch).mock.calls.find(([url]) => url === "/api/me/threads")!
  expect(JSON.parse(create[1]!.body as string).title).toBe("x".repeat(60))
  expect(state().messages[0].id).not.toBe(stored.id)
  state().stop(); state().startNewChat()
  await new Promise(r => setTimeout(r, 0))
  expect(posts()).toHaveLength(2)
  expect(state().threadId).toBeNull(); expect(state().threads).toHaveLength(1)
})
test("retry guard: error saves one user; retry completion still one user POST", async () => {
  let error = true
  await persistence(() => error ? new Response(frame({ error: "failed" })) : new Response(new Uint8Array([...frame({ text: "Retry" }), ...frame({ done: true })])))
  state().send("why", context)
  await vi.waitFor(() => { expect(state().isStreaming).toBe(false); expect(posts()).toHaveLength(1) })
  const id = state().messages[0].id
  error = false; state().retry(context)
  await vi.waitFor(() => expect(posts()).toHaveLength(2))
  expect(posts().filter(m => m.role === "user")).toHaveLength(1)
  expect(state().messages[0].id).toBe(id)
})
test("Stop partial persists once as complete; empty Stop never saves assistant", async () => {
  let stream!: ReadableStreamDefaultController<Uint8Array>
  await persistence(() => new Response(new ReadableStream({ start(c) { stream = c } })))
  state().send("why", context)
  stream.enqueue(frame({ text: "Partial" }))
  await vi.waitFor(() => expect(state().messages.at(-1)?.content).toBe("Partial"))
  state().stop(); state().stop()
  await vi.waitFor(() => expect(posts()).toHaveLength(2))
  expect(posts()[1]).toMatchObject({ content: "Partial", status: "complete" })
  state().startNewChat(); state().send("next", context); state().stop()
  await vi.waitFor(() => expect(posts()).toHaveLength(3))
})
test.each(["create", "message", "network", 401])("%s save failure leaves reply complete, 401 quiet", async fail => {
  await persistence(undefined, fail)
  state().send("why", context)
  await vi.waitFor(() => expect(state().isStreaming).toBe(false))
  expect(state().messages.at(-1)).toMatchObject({ content: "Answer", status: "complete" })
  await vi.waitFor(() => fail === 401 ? expect(state().threadsStatus).toBe("signedOut") : expect(state().saveNotice).toBe("Chat not saved. It will stay here until you leave."))
  if (fail === 401) expect(state().saveNotice).toBeNull()
})
test("restore with no id, saved id, stale 404 and throwing storage", async () => {
  await persistence()
  await state().restoreLastThread(); expect(fetch).not.toHaveBeenCalled()
  vi.mocked(localStorage.getItem).mockReturnValue("thread")
  await state().restoreLastThread()
  expect(state().threadId).toBe("thread"); expect(state().messages).toEqual([stored])
  vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 404 }))
  await state().restoreLastThread()
  expect(state().messages).toEqual([]); expect(state().threadId).toBeNull()
  expect(localStorage.removeItem).toHaveBeenCalled()
  vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error("denied") })
  vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error("denied") })
  vi.mocked(localStorage.removeItem).mockImplementation(() => { throw new Error("denied") })
  await state().restoreLastThread(); state().send("works", context)
  await vi.waitFor(() => expect(state().isStreaming).toBe(false))
  expect(state().messages.at(-1)?.status).toBe("complete")
})
test("open thread deep-equal citations and sources; continue without creating a new thread", async () => {
  await persistence()
  const messages = [{ ...stored, role: "assistant", citations: [{ id: "c", kind: "week", label: "Week", href: "/plan", excerpt: "base", week: 1 }], webSources: [{ title: "Rules", host: "hyrox.com", url: "https://hyrox.com" }] }]
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({ messages }))
  await state().openThread("thread")
  expect(state().messages).toEqual(messages)
  state().send("continue", context)
  await vi.waitFor(() => expect(posts()).toHaveLength(2))
  expect(vi.mocked(fetch).mock.calls.filter(([url, init]) => url === "/api/me/threads" && init?.method === "POST")).toHaveLength(0)
})
test("stale-stream guard: opening a thread prevents old chunks from landing", async () => {
  let stream!: ReadableStreamDefaultController<Uint8Array>
  await persistence(() => new Response(new ReadableStream({ start(c) { stream = c } })))
  state().send("old", context)
  await vi.waitFor(() => expect(posts()).toHaveLength(1))
  const signal = vi.mocked(fetch).mock.calls[0][1]!.signal!
  const assistantId = state().messages.at(-1)!.id
  await state().openThread("thread")
  expect(signal.aborted).toBe(true)
  // Same id makes the update guard observable, even with an adversarial server response.
  const oldAssistantId = assistantId
  useCoachAIStore.setState({ messages: [{ ...stored, id: oldAssistantId }] })
  stream.enqueue(frame({ text: "late" })); stream.enqueue(frame({ done: true }))
  await new Promise(r => setTimeout(r, 20))
  expect(state().messages).toEqual([{ ...stored, id: oldAssistantId }])
  expect(state().threadId).toBe("thread")
})
test.each([500, 401])("load %s does not block next send", async status => {
  await persistence()
  vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status }))
  await state().loadThreads()
  expect(state().threadsStatus).toBe(status === 401 ? "signedOut" : "error")
  expect(state().saveNotice === null).toBe(status === 401)
  state().send("works", context)
  await vi.waitFor(() => expect(state().messages.at(-1)?.status).toBe("complete"))
})
test("pending create cannot replace a newly opened thread; saves remain on original thread", async () => {
  await persistence()
  let resolve!: (value: Response) => void
  const normal = vi.mocked(fetch).getMockImplementation()!
  vi.mocked(fetch).mockImplementation((url, init) => url === "/api/me/threads" && init?.method === "POST" ? new Promise(r => { resolve = r }) : normal(url, init))
  state().send("old", context)
  await vi.waitFor(() => expect(resolve).toBeDefined())
  await state().openThread("new")
  resolve(Response.json({ thread: summary }))
  await vi.waitFor(() => expect(posts()).toHaveLength(2))
  expect(state().threadId).toBe("new"); expect(state().messages).toEqual([stored])
  expect(vi.mocked(fetch).mock.calls.filter(([,init]) => init?.method === "POST").some(([url]) => url === "/api/me/threads/new/messages")).toBe(false)
})

test("Stop during terminal reader cleanup still saves the completed assistant once", async () => {
  let finishCancel!: () => void
  await persistence(() => new Response(new ReadableStream({
    start(c) { c.enqueue(frame({ text: "Finished" })); c.enqueue(frame({ done: true })) },
    cancel() { return new Promise<void>(r => { finishCancel = r }) },
  })))
  state().send("why", context)
  await vi.waitFor(() => expect(state().messages.at(-1)?.status).toBe("complete"))
  expect(state().isStreaming).toBe(true)
  state().stop(); finishCancel()
  await vi.waitFor(() => expect(posts()).toHaveLength(2))
  expect(posts()[1]).toMatchObject({ content: "Finished", status: "complete" })
})
test("overlapping opens and New chat discard late history responses", async () => {
  await persistence()
  let resolve!: (response: Response) => void
  vi.mocked(fetch).mockReturnValueOnce(new Promise(r => { resolve = r }))
  const pending = state().openThread("old")
  await state().openThread("new")
  resolve(Response.json({ messages: [{ ...stored, content: "old" }] })); await pending
  expect(state().threadId).toBe("new"); expect(state().messages).toEqual([stored])
  vi.mocked(fetch).mockReturnValueOnce(new Promise(r => { resolve = r }))
  const next = state().openThread("old")
  state().startNewChat(); resolve(Response.json({ messages: [stored] })); await next
  expect(state().threadId).toBeNull(); expect(state().messages).toEqual([])
})
test.each([500, 401, "network"])("open %s falls back to a usable chat", async failure => {
  await persistence()
  if (typeof failure === "number") vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: failure }))
  else vi.mocked(fetch).mockRejectedValueOnce(new TypeError("offline"))
  await state().openThread("missing")
  expect(state().saveNotice === null).toBe(failure === 401)
  state().send("still works", context)
  await vi.waitFor(() => expect(state().messages.at(-1)?.status).toBe("complete"))
})
