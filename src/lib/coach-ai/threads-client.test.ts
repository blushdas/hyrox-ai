import { afterEach, expect, test, vi } from "vitest"
import { createThread, getThreadMessages, listThreads, saveThreadMessage, isMessage } from "./threads-client"
const thread = { id: "t", title: "Chat", createdAt: 1, updatedAt: 2, archivedAt: null }
const message = { id: "server", role: "user" as const, content: "Hi", status: "complete" as const, citations: [], createdAt: "2026-10-02T00:00:00Z" }
afterEach(() => vi.unstubAllGlobals())
test.each([401, 404, 500])("HTTP %s is discriminated for every endpoint", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status })))
  for (const call of [() => listThreads(), () => createThread("Chat"), () => getThreadMessages("t"), () => saveThreadMessage("t", message)]) {
    expect(await call()).toEqual({ kind: status === 401 ? "unauthorized" : status === 404 ? "notFound" : "failed" })
  }
})
test("valid wrappers, server ids, encoded ids and POST payloads", async () => {
  const mock = vi.fn().mockResolvedValueOnce(Response.json({ threads: [thread] })).mockResolvedValueOnce(Response.json({ thread })).mockResolvedValueOnce(Response.json({ messages: [message] })).mockResolvedValueOnce(Response.json({ message }))
  vi.stubGlobal("fetch", mock)
  expect(await listThreads()).toEqual({ kind: "ok", value: [thread] })
  expect(await createThread("Chat")).toEqual({ kind: "ok", value: thread })
  expect(await getThreadMessages("a/b")).toEqual({ kind: "ok", value: [message] })
  expect(await saveThreadMessage("t", message)).toEqual({ kind: "ok", value: message })
  expect(mock.mock.calls[2][0]).toBe("/api/me/threads/a%2Fb/messages")
  expect(JSON.parse(mock.mock.calls[1][1].body)).toEqual({ title: "Chat" })
})
test.each([{}, { threads: [{}] }, { threads: [{ ...thread, updatedAt: "bad" }] }])("malformed list rejected: %j", async body => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)))
  expect(await listThreads()).toEqual({ kind: "failed" })
})
test("invalid JSON and network failures returned", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("bad")).mockRejectedValueOnce(new TypeError("offline")))
  expect(await createThread("Chat")).toEqual({ kind: "failed" })
  expect(await listThreads()).toEqual({ kind: "failed" })
})
test("nested message fields validated", () => {
  expect(isMessage(message)).toBe(true)
  for (const patch of [{ citations: [{}] }, { webSources: [{ title: "x", host: "x", url: "javascript:x" }] }, { createdAt: "bad" }, { webSearch: "true" }, { status: "bad" }]) expect(isMessage({ ...message, ...patch })).toBe(false)
})

test("all endpoints reject malformed payloads and transport failures", async () => {
  const calls = [() => listThreads(), () => createThread("Chat"), () => getThreadMessages("t"), () => saveThreadMessage("t", message)]
  for (const call of calls) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ threads: [{}], thread: {}, messages: [{}], message: {} })))
    expect(await call()).toEqual({ kind: "failed" })
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")))
    expect(await call()).toEqual({ kind: "failed" })
  }
})
