import { beforeEach,afterEach,expect,it,vi } from "vitest";
vi.mock("@/auth",()=>({auth:vi.fn()}));vi.mock("@/lib/api/db-client",()=>({getDb:vi.fn()}));
import { auth } from "@/auth";import { getDb } from "@/lib/api/db-client";
import { createTestDb } from "@/lib/api/test-d1";
import * as account from "@/lib/db/account";import { DELETE,GET } from "./route";
let test:ReturnType<typeof createTestDb>;
beforeEach(()=>{test=createTestDb();vi.mocked(getDb).mockResolvedValue(test.db);vi.mocked(auth).mockResolvedValue({user:{id:"alice"}} as never);});
afterEach(()=>{test.close();vi.restoreAllMocks();});
it("deletes only the session user, ignores body and invalidates old cookie",async()=>{
 const response=await DELETE(new Request("http://localhost/api/me/account",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:"bob"})}));
 expect(response.status).toBe(204);expect(await response.text()).toBe("");
 expect(test.sqlite.prepare("SELECT id FROM users").all()).toEqual([{id:"bob"}]);
 expect((await DELETE(new Request("http://localhost/api/me/account",{method:"DELETE"}))).status).toBe(401);
});
it("GET returns 405 and unauthenticated deletion returns 401",async()=>{
 expect(GET().status).toBe(405);vi.mocked(auth).mockResolvedValue(null as never);expect((await DELETE(new Request("http://localhost/api/me/account",{method:"DELETE"}))).status).toBe(401);
});
it.each([{Origin:"https://evil.example"},{"Content-Type":"text/plain"}] as Record<string,string>[])("rejects before auth or data functions %s",async headers=>{
 const spy=vi.spyOn(account,"deleteAccount");vi.mocked(auth).mockClear();
 expect((await DELETE(new Request("http://localhost/api/me/account",{method:"DELETE",headers}))).status).toBe("Origin" in headers?403:415);
 expect(spy).not.toHaveBeenCalled();expect(auth).not.toHaveBeenCalled();expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM users").get()).toEqual({n:2});
});
it("returns exact 429 at the shared mutation limit",async()=>{
 test.sqlite.prepare("INSERT INTO rate_limits VALUES (?,?,?,?)").run("alice","me-write",Math.floor(Date.now()/60000)*60000,60);
 const response=await DELETE(new Request("http://localhost/api/me/account",{method:"DELETE"}));expect(response.status).toBe(429);expect(await response.json()).toEqual({error:"Too many requests"});expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
});
it("fails open on limiter error, logging only its message",async()=>{
 const prepare=test.db.prepare;test.db.prepare=sql=>{if(sql.includes("rate_limits")&&sql.startsWith("INSERT"))throw new Error("storage down");return prepare(sql);};
 const log=vi.spyOn(console,"error").mockImplementation(()=>undefined);
 expect((await DELETE(new Request("http://localhost/api/me/account",{method:"DELETE"}))).status).toBe(204);expect(log).toHaveBeenCalledExactlyOnceWith("storage down");
});
