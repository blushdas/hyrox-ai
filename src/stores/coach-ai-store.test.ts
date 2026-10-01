import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { useCoachAIStore } from "./coach-ai-store"
import { generateBeginnerPlan } from "@/lib/mock-data"
const context = { plan: { id: "test", raceDate: "2026-12-20", totalWeeks: 12, weeks: generateBeginnerPlan("2026-12-20") }, currentWeek: 4, today: 1 }
const state = () => useCoachAIStore.getState()
const encoder = new TextEncoder()
const frame = (data: unknown) => encoder.encode(JSON.stringify(data) + "\n")
beforeEach(() => { state().reset(); vi.stubGlobal("fetch", vi.fn()) })
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
