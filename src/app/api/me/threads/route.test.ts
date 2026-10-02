import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/api/db-client", () => ({ getDb: vi.fn() }));
import { auth } from "@/auth";
import { getDb } from "@/lib/api/db-client";
import { createTestDb } from "@/lib/api/test-d1";
import { createThread } from "@/lib/db/coach";
import * as route from "./route";
let test: ReturnType<typeof createTestDb>;
beforeEach(() => { test = createTestDb(); vi.mocked(getDb).mockResolvedValue(test.db); vi.mocked(auth).mockResolvedValue({ user: { id: "alice" } } as never); });
afterEach(() => { test.close(); vi.restoreAllMocks(); });
const req = (method: string, body: unknown) => new Request("http://localhost/api/me", { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

it("returns 401 for both methods without DB access", async () => {
 vi.mocked(auth).mockResolvedValue(null as never); vi.mocked(getDb).mockClear(); expect((await route.GET()).status).toBe(401); expect((await route.POST(req("POST",{}))).status).toBe(401); expect(getDb).not.toHaveBeenCalled();
});
it("creates session-owned thread and lists only own threads", async () => {
 await createThread("bob",{title:"Foreign"}); const saved = await route.POST(req("POST",{title:"Mine",userId:"bob"})); expect(saved.status).toBe(201); const {thread} = await saved.json(); expect(thread.title).toBe("Mine"); expect(await (await route.GET()).json()).toEqual({threads:[thread]});
});
it("rejects invalid titles without writes", async () => {
 expect((await route.POST(req("POST",{title:2}))).status).toBe(400); expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM coach_threads").get()).toEqual({n:0});
});

it("logs auth failures and returns generic 500", async () => {
 const cause = new Error("D1 unavailable"); vi.mocked(auth).mockRejectedValueOnce(cause); const log = vi.spyOn(console,"error").mockImplementation(() => undefined);
 const response = await route.GET(); expect(response.status).toBe(500); expect(await response.json()).toEqual({error:"Internal server error"}); expect(log).toHaveBeenCalledWith("Persistence request failed","Error");
});

it("logs D1 failures and returns generic 500", async () => {
 vi.mocked(getDb).mockRejectedValueOnce(new Error("private DB error"));
 const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
 const response = await route.GET();
 expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "Internal server error" });
 expect(log).toHaveBeenCalled();
});
