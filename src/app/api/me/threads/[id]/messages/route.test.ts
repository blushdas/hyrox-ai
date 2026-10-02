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
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const message = {role:"user",status:"complete",content:"Hello",citations:[]};
it("returns 401 for both methods without DB access", async () => {
 vi.mocked(auth).mockResolvedValue(null as never); vi.mocked(getDb).mockClear(); expect((await route.GET(req("GET",undefined),ctx("s"))).status).toBe(401); expect((await route.POST(req("POST",{message}),ctx("s"))).status).toBe(401); expect(getDb).not.toHaveBeenCalled();
});
it("returns 404 for foreign and missing threads, with no writes", async () => {
 const foreign = await createThread("bob",{title:"Foreign"});
 for (const id of [foreign.id,"missing"]) { expect((await route.GET(new Request("http://localhost"),ctx(id))).status).toBe(404); expect((await route.POST(req("POST",{message,userId:"bob"}),ctx(id))).status).toBe(404); }
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM coach_messages").get()).toEqual({n:0});
});
it("creates message with server UUID and reads it back; invalid input writes nothing", async () => {
 const thread = await createThread("alice",{title:"Mine"}); expect((await route.POST(req("POST",{message:{...message,role:"system"}}),ctx(thread.id))).status).toBe(400);
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM coach_messages").get()).toEqual({n:0});
 const saved = await route.POST(req("POST",{message:{...message,id:"client-id",createdAt:"bad"}}),ctx(thread.id)); expect(saved.status).toBe(201); const body = await saved.json(); expect(body.message.id).not.toBe("client-id"); expect(body.message.createdAt).toEqual(expect.any(String)); expect(await (await route.GET(new Request("http://localhost"),ctx(thread.id))).json()).toEqual({messages:[body.message]});
});

it("logs auth failures and returns generic 500", async () => {
 const cause = new Error("D1 unavailable"); vi.mocked(auth).mockRejectedValueOnce(cause); const log = vi.spyOn(console,"error").mockImplementation(() => undefined);
 const response = await route.GET(new Request("http://localhost"),ctx("s")); expect(response.status).toBe(500); expect(await response.json()).toEqual({error:"Internal server error"}); expect(log).toHaveBeenCalledWith("Persistence request failed","Error");
});

it("logs D1 failures and returns generic 500", async () => {
 vi.mocked(getDb).mockRejectedValueOnce(new Error("private DB error"));
 const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
 const response = await route.GET(new Request("http://localhost"), ctx("s"));
 expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "Internal server error" });
 expect(log).toHaveBeenCalled();
});
