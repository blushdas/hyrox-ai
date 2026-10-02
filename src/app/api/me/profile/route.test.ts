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
 const response = await route.GET(); expect(response.status).toBe(500); expect(await response.json()).toEqual({error:"Internal server error"}); expect(log).toHaveBeenCalledWith("Persistence request failed",cause);
});

it("logs D1 failures and returns generic 500", async () => {
 vi.mocked(getDb).mockRejectedValueOnce(new Error("private DB error"));
 const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
 const response = await route.GET();
 expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "Internal server error" });
 expect(log).toHaveBeenCalled();
});
