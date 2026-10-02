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

it("returns 401 for both methods without DB access", async () => {
 vi.mocked(auth).mockResolvedValue(null as never); vi.mocked(getDb).mockClear();
 expect((await route.GET()).status).toBe(401); expect((await route.POST(req("POST",{plan}))).status).toBe(401); expect(getDb).not.toHaveBeenCalled();
});
it("persists generated plan owned only by session and does not expose foreign plan", async () => {
 const foreign = await createPlan("bob",plan); expect(await (await route.GET()).json()).toEqual({plan:null});
 const saved = await route.POST(req("POST",{plan,source:"pdf",templateId:"t",userId:"bob"})); expect(saved.status).toBe(201);
 const body = await saved.json(); expect(body.plan.id).not.toBe(foreign.id); expect(body.plan.weeks).toEqual(plan.weeks);
 expect(await (await route.GET()).json()).toEqual(body);
});
it("rejects invalid plan and metadata without writes", async () => {
 for (const body of [{plan:{...plan,weeks:[]}},{plan,source:"evil"},{plan,templateId:4}]) expect((await route.POST(req("POST",body))).status).toBe(400);
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM training_plans").get()).toEqual({n:0});
});

it("logs auth failures and returns generic 500", async () => {
 const cause = new Error("D1 unavailable"); vi.mocked(auth).mockRejectedValueOnce(cause); const log = vi.spyOn(console,"error").mockImplementation(() => undefined);
 const response = await route.GET(); expect(response.status).toBe(500); expect(await response.json()).toEqual({error:"Internal server error"}); expect(log).toHaveBeenCalledWith("Persistence request failed",cause);
});

it("logs D1 failures and returns generic 500", async () => {
 vi.mocked(getDb).mockRejectedValueOnce(new Error("private DB error"));
 const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
 const response = await route.GET();
 expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "Internal server error" });
 expect(log).toHaveBeenCalled();
});
