import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/api/db-client", () => ({ getDb: vi.fn() }));
import { auth } from "@/auth";
import { getDb } from "@/lib/api/db-client";
import { createTestDb, profile } from "@/lib/api/test-d1";
import * as route from "./route";
let test: ReturnType<typeof createTestDb>;
beforeEach(() => { test = createTestDb(); vi.mocked(getDb).mockResolvedValue(test.db); vi.mocked(auth).mockResolvedValue({ user: { id: "alice" } } as never); });
afterEach(() => { test.close(); vi.restoreAllMocks(); });
const req = (method: string, body: unknown) => new Request("http://localhost/api/me", { method, body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });

it("returns 401 for every method without session and makes no DB call", async () => {
 vi.mocked(auth).mockResolvedValue(null as never); vi.mocked(getDb).mockClear();
 expect((await route.GET()).status).toBe(401); expect((await route.PUT(req("PUT",{profile}))).status).toBe(401); expect(getDb).not.toHaveBeenCalled();
});
it("saves and reads session-owned profile, ignoring supplied userId", async () => {
 expect(await (await route.GET()).json()).toEqual({profile:null,onboardingCompletedAt:null});
 const saved = await route.PUT(req("PUT",{profile,onboardingComplete:true,userId:"bob"})); expect(saved.status).toBe(200);
 expect((await saved.json()).onboardingCompletedAt).toEqual(expect.any(Number)); expect((await (await route.GET()).json()).profile).toEqual(profile);
 expect(test.sqlite.prepare("SELECT user_id FROM athlete_profiles").get()).toEqual({user_id:"alice"});
});
it("rejects invalid profile/onboarding/body without writes", async () => {
 for (const body of [{profile:{...profile,age:1}},{profile,onboardingComplete:"true"},{}]) expect((await route.PUT(req("PUT",body))).status).toBe(400);
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM athlete_profiles").get()).toEqual({n:0});
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

it("skip authenticates, persists completion without profile and rejects mixed bodies", async () => {
 const skipped = await route.PUT(req("PUT", { skipOnboarding: true }));
 expect(skipped.status).toBe(200);
 const result = await skipped.json();
 expect(result).toEqual({ profile: null, onboardingCompletedAt: expect.any(Number) });
 expect(await (await route.GET()).json()).toEqual(result);
 for (const body of [{ skipOnboarding: false }, { skipOnboarding: "true" }, { skipOnboarding: true, profile }, { skipOnboarding: true, userId: "bob" }]) expect((await route.PUT(req("PUT", body))).status).toBe(400);
 vi.mocked(auth).mockResolvedValue(null as never);
 expect((await route.PUT(req("PUT", { skipOnboarding: true }))).status).toBe(401);
});

it("conditional backfill returns 412 without modifying an existing account profile", async () => {
 await route.PUT(req("PUT", { profile, onboardingComplete: true }));
 const request = req("PUT", { profile: { ...profile, location: "Stale local" }, onboardingComplete: true });
 request.headers.set("If-None-Match", "*");
 expect((await route.PUT(request)).status).toBe(412);
 expect((await (await route.GET()).json()).profile).toEqual(profile);
});

it("skip with a foreign userId cannot write or modify that user's row", async () => {
 await route.PUT(req("PUT", { skipOnboarding: true }))
 const before = test.sqlite.prepare("SELECT * FROM athlete_profiles ORDER BY user_id").all()
 expect((await route.PUT(req("PUT", { skipOnboarding: true, userId: "bob" }))).status).toBe(400)
 expect(test.sqlite.prepare("SELECT * FROM athlete_profiles ORDER BY user_id").all()).toEqual(before)
 expect(test.sqlite.prepare("SELECT user_id, onboarding_skipped FROM athlete_profiles").all()).toEqual([{ user_id: "alice", onboarding_skipped: 1 }])
 expect(test.sqlite.prepare("SELECT * FROM athlete_profiles WHERE user_id='bob'").all()).toEqual([])
})
