import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("@/lib/api/db-client", () => ({ getDb: vi.fn() }));
import { getDb } from "@/lib/api/db-client";
import { createTestDb, plan } from "@/lib/api/test-d1";
import { createPlan, getActivePlan, updateSessionStatus } from "./plan";
let test: ReturnType<typeof createTestDb>;
beforeEach(() => { test = createTestDb(); vi.mocked(getDb).mockResolvedValue(test.db); });
afterEach(() => test.close());
it("round trips week metadata and archives the prior plan atomically", async () => {
 const first = await createPlan("alice", plan); const next = await createPlan("alice", plan, { source: "ai" });
 expect(await getActivePlan("alice")).toEqual({ ...plan, id: next.id });
 expect(test.sqlite.prepare("SELECT status FROM training_plans WHERE id = ?").get(first.id)).toEqual({ status: "archived" });
 expect(() => test.sqlite.prepare("INSERT INTO training_plans (id,user_id,status,source,total_weeks,race_date,created_at) VALUES ('bad','alice','active','template',1,'',0)").run()).toThrow(/UNIQUE/);
});
it("rolls back archive, plan and earlier sessions on a bad later session", async () => {
 const old = await createPlan("alice", plan); const invalid = structuredClone(plan); invalid.weeks[0].sessions.push(invalid.weeks[0].sessions[0]);
 await expect(createPlan("alice", invalid)).rejects.toThrow(/UNIQUE/);
 expect(await getActivePlan("alice")).toEqual({ ...plan, id: old.id });
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM training_plans").get()).toEqual({ n: 1 });
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM plan_sessions").get()).toEqual({ n: 1 });
});
it("isolates users and updates only active session keys, clearing completed stamps", async () => {
 await createPlan("alice", plan); expect(await getActivePlan("bob")).toBeNull(); expect(await updateSessionStatus("bob", "session-1", "completed")).toBeNull();
 const completed = await updateSessionStatus("alice", "session-1", "completed"); expect(completed?.completedAt).toEqual(expect.any(Number));
 for (const status of ["skipped","pending"] as const) expect(await updateSessionStatus("alice", "session-1", status)).toEqual({ id: "session-1", status, completedAt: null });
 await createPlan("bob", plan); expect((await getActivePlan("alice"))?.weeks[0].sessions[0].status).toBe("pending");
 const next = structuredClone(plan); next.weeks[0].sessions[0].id = "new"; await createPlan("alice", next);
 expect(await updateSessionStatus("alice", "session-1", "completed")).toBeNull(); expect((await getActivePlan("bob"))?.weeks[0].sessions[0].id).toBe("session-1");
});
