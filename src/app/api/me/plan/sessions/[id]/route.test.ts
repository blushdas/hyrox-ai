import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/api/db-client", () => ({ getDb: vi.fn() }));
import { auth } from "@/auth";
import { getDb } from "@/lib/api/db-client";
import { createTestDb, plan } from "@/lib/api/test-d1";
import { createPlan } from "@/lib/db/plan";
import * as route from "./route";
let test: ReturnType<typeof createTestDb>;
beforeEach(() => { test = createTestDb(); vi.mocked(getDb).mockResolvedValue(test.db); vi.mocked(auth).mockResolvedValue({ user: { id: "alice" } } as never); });
afterEach(() => { test.close(); vi.restoreAllMocks(); });
const req = (method: string, body: unknown) => new Request("http://localhost/api/me", { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

it("returns 401 without session or DB calls", async () => {
 vi.mocked(auth).mockResolvedValue(null as never); vi.mocked(getDb).mockClear(); expect((await route.PATCH(req("PATCH",{status:"completed"}),ctx("s"))).status).toBe(401); expect(getDb).not.toHaveBeenCalled();
});
it("returns 404 for foreign or missing active session", async () => {
 await createPlan("bob",plan); for (const id of ["session-1","missing"]) expect((await route.PATCH(req("PATCH",{status:"completed",userId:"bob"}),ctx(id))).status).toBe(404);
});
it("updates own active session and rejects invalid status without mutation", async () => {
 await createPlan("alice",plan); expect((await route.PATCH(req("PATCH",{status:"oops"}),ctx("session-1"))).status).toBe(400);
 expect(test.sqlite.prepare("SELECT status FROM plan_sessions").get()).toEqual({status:"pending"});
 const saved = await route.PATCH(req("PATCH",{status:"completed"}),ctx("session-1")); expect(saved.status).toBe(200); expect((await saved.json()).session).toEqual({id:"session-1",status:"completed",completedAt:expect.any(Number)});
});

it("logs auth failures and returns generic 500", async () => {
 const cause = new Error("D1 unavailable"); vi.mocked(auth).mockRejectedValueOnce(cause); const log = vi.spyOn(console,"error").mockImplementation(() => undefined);
 const response = await route.PATCH(req("PATCH",{status:"completed"}),ctx("s")); expect(response.status).toBe(500); expect(await response.json()).toEqual({error:"Internal server error"}); expect(log).toHaveBeenCalledWith("Persistence request failed",cause);
});

it("logs D1 failures and returns generic 500", async () => {
 vi.mocked(getDb).mockRejectedValueOnce(new Error("private DB error"));
 const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
 const response = await route.PATCH(req("PATCH", { status: "completed" }), ctx("s"));
 expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "Internal server error" });
 expect(log).toHaveBeenCalled();
});
