import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("@/lib/api/db-client", () => ({ getDb: vi.fn() }));
import { getDb } from "@/lib/api/db-client";
import { createTestDb } from "@/lib/api/test-d1";
import { createThread, getThread, listThreads, appendMessage, listMessages } from "./coach";
let test: ReturnType<typeof createTestDb>;
beforeEach(() => { test = createTestDb(); vi.mocked(getDb).mockResolvedValue(test.db); });
afterEach(() => { test.close(); vi.restoreAllMocks(); });
it("round trips citations/sources and orders same-millisecond messages by insertion", async () => {
 vi.spyOn(Date,"now").mockReturnValue(1000);
 const thread = await createThread("alice", { title: "Coach" });
 const input = { role: "assistant" as const, content: "Advice", status: "complete" as const, webSearch: true, citations: [{ id: "c", kind: "session" as const, label: "Session", href: "/plan", excerpt: "Easy", sessionId: "s" }], webSources: [{ title: "Rules", url: "https://example.com", host: "example.com" }] };
 const first = await appendMessage("alice", thread.id, input); const second = await appendMessage("alice", thread.id, { ...input, content: "Later" });
 expect(first).toEqual({ ...input, id: expect.any(String), createdAt: "1970-01-01T00:00:01.000Z" });
 expect(await listMessages("alice", thread.id)).toEqual([first, second]);
});
it("isolates every coach operation and hides archived threads", async () => {
 const a = await createThread("alice", { title: "A" }); const b = await createThread("bob", { title: "B" });
 expect((await listThreads("alice")).map(t => t.id)).toEqual([a.id]); expect((await listThreads("bob")).map(t => t.id)).toEqual([b.id]);
 expect(await getThread("bob",a.id)).toBeNull(); expect(await listMessages("bob",a.id)).toBeNull();
 expect(await appendMessage("bob",a.id,{ role:"user", content:"bad", status:"complete", citations:[] })).toBeNull();
 expect(await listMessages("alice",a.id)).toEqual([]);
 test.sqlite.prepare("UPDATE coach_threads SET archived_at = 1 WHERE id = ?").run(a.id);
 expect(await listThreads("alice")).toEqual([]); expect(await getThread("alice",a.id)).toBeNull(); expect(await listMessages("alice",a.id)).toBeNull();
});
it("bumps updated time and reorders threads", async () => {
 vi.spyOn(Date,"now").mockReturnValue(1); const a = await createThread("alice",{title:"A"});
 vi.mocked(Date.now).mockReturnValue(2); const b = await createThread("alice",{title:"B"});
 vi.mocked(Date.now).mockReturnValue(3); await appendMessage("alice",a.id,{role:"user",content:"Hi",status:"error",errorMessage:"Retry",citations:[]});
 expect((await listThreads("alice")).map(t => t.id)).toEqual([a.id,b.id]); expect((await getThread("alice",a.id))?.updatedAt).toBe(3);
});
