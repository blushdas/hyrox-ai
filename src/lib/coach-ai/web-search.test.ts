import { afterEach, expect, test, vi } from "vitest"
import { webContext } from "./web-search"
const options = { question: "Current race rules?", context: { category: "open", raceDate: "2026-12-20", daysPerWeek: 4, currentWeek: 4, sessions: [] }, plannerKey: "planner-secret", searchKey: "search-secret" }
const planned = (needsWeb = true) => Response.json({ message: { content: [{ type: "text", text: JSON.stringify({ needsWeb, query: "HYROX current rules" }) }] } })
const found = () => Response.json({ results: [{ title: "Rules", url: "https://hyrox.com/rules", content: "Data only" }] })
afterEach(() => vi.unstubAllGlobals())
test("plan-covered question never searches Tavily", async () => { const fetcher = vi.fn().mockResolvedValue(planned(false)); vi.stubGlobal("fetch", fetcher); expect(await webContext(options)).toEqual({ sources: [], block: "", unavailable: false }); expect(fetcher).toHaveBeenCalledTimes(1); expect(fetcher.mock.calls[0][0]).toContain("cohere") })
test("one planner and one search for gaps", async () => { const fetcher = vi.fn().mockResolvedValueOnce(planned()).mockResolvedValueOnce(found()); vi.stubGlobal("fetch", fetcher); expect(await webContext(options)).toMatchObject({ unavailable: false, sources: [{ title: "Rules", url: "https://hyrox.com/rules", host: "hyrox.com" }] }); expect(fetcher).toHaveBeenCalledTimes(2); expect(fetcher.mock.calls[1][0]).toContain("tavily"); expect(fetcher.mock.calls.every(call => call[1].signal instanceof AbortSignal)).toBe(true) })
test.each(["plannerKey", "searchKey"] as const)("missing %s fails soft", async key => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(planned())); expect((await webContext({ ...options, [key]: undefined })).unavailable).toBe(true) })
test("missing search key does not affect plan-only decision", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(planned(false))); expect((await webContext({ ...options, searchKey: undefined })).unavailable).toBe(false) })
test.each(["planner", "search"])("%s failures are soft", async step => {
  for (const failure of [new Response("bad", { status: 400 }), new Response("bad", { status: 500 }), new Response("not JSON"), Response.json({}), new DOMException("Timeout", "TimeoutError")]) {
    const fetcher = vi.fn(); if (step === "search") fetcher.mockResolvedValueOnce(planned())
    if (failure instanceof Error) fetcher.mockRejectedValueOnce(failure); else fetcher.mockResolvedValueOnce(failure)
    vi.stubGlobal("fetch", fetcher); expect((await webContext(options)).unavailable).toBe(true)
  }
})
test("unsafe URLs and empty results fail soft", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(planned()).mockResolvedValueOnce(Response.json({ results: [{ title: "bad", url: "javascript:alert(1)", content: "bad" }] }))); expect((await webContext(options)).unavailable).toBe(true) })
test("search text remains in data block", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(planned()).mockResolvedValueOnce(found())); const result = await webContext(options); expect(result.block).toContain("Data only"); expect(JSON.stringify(result.sources)).not.toContain("Data only") })
test("real abort signal enforces eight-second planner deadline", async () => {
 const started = Date.now()
 vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
   init.signal!.addEventListener("abort", () => reject(new DOMException("Timeout", "TimeoutError")))
 })))
 expect((await webContext(options)).unavailable).toBe(true)
 expect(Date.now() - started).toBeLessThan(9000)
}, 10000)
