import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("@/lib/api/db-client", () => ({ getDb: vi.fn() }));
import { getDb } from "@/lib/api/db-client";
import { createTestDb, profile, plan } from "@/lib/api/test-d1";
import { getProfile, upsertProfile } from "./profile";
import { createPlan } from "./plan";
import { createThread, appendMessage } from "./coach";
let test: ReturnType<typeof createTestDb>;
beforeEach(() => { test = createTestDb(); vi.mocked(getDb).mockResolvedValue(test.db); });
afterEach(() => { test.close(); vi.restoreAllMocks(); });
it("saves twice into one row, stores seconds/kg and stamps onboarding once", async () => {
 expect(await getProfile("alice")).toEqual({ profile: null, onboardingCompletedAt: null });
 await upsertProfile("alice", profile); expect((await getProfile("alice")).profile).toEqual(profile);
 vi.spyOn(Date, "now").mockReturnValue(1234);
 await upsertProfile("alice", { ...profile, location: "Cebu" }, { onboardingComplete: true });
 vi.mocked(Date.now).mockReturnValue(5678);
 await upsertProfile("alice", { ...profile, location: "Cebu" }, { onboardingComplete: true });
 expect(await getProfile("alice")).toEqual({ profile: { ...profile, location: "Cebu" }, onboardingCompletedAt: 1234 });
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM athlete_profiles").get()).toEqual({ n: 1 });
 expect(test.sqlite.prepare("SELECT five_k_sec, hyrox_sec, weight_kg FROM athlete_profiles").get()).toEqual({ five_k_sec: 330, hyrox_sec: 3730, weight_kg: 81.6466266 });
});
it("isolates both profile reads and upserts", async () => {
 await upsertProfile("alice", profile); expect((await getProfile("bob")).profile).toBeNull();
 await upsertProfile("bob", { ...profile, location: "Tokyo" }); expect((await getProfile("alice")).profile).toEqual(profile);
});
it("cascades a user deletion through all five tables", async () => {
 await upsertProfile("alice", profile); await createPlan("alice", plan);
 const thread = await createThread("alice", { title: "Test" }); await appendMessage("alice", thread.id, { role: "user", content: "Hi", status: "complete", citations: [] });
 test.sqlite.prepare("DELETE FROM users WHERE id = ?").run("alice");
 for (const table of ["athlete_profiles","training_plans","plan_sessions","coach_threads","coach_messages"]) expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM " + table).get()).toEqual({ n: 0 });
});
