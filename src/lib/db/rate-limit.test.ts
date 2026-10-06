import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.mock("@/lib/api/db-client",()=>({getDb:vi.fn()}));
import { getDb } from "@/lib/api/db-client";
import { createTestDb } from "@/lib/api/test-d1";
import { hitRateLimit } from "./rate-limit";
let test: ReturnType<typeof createTestDb>;
beforeEach(()=>{test=createTestDb();vi.mocked(getDb).mockResolvedValue(test.db);});
afterEach(()=>{test.close();vi.restoreAllMocks();});
it("two independently loaded limiter instances share D1 state and user/bucket isolation",async()=>{
 const first=hitRateLimit; vi.resetModules(); const second=(await import("./rate-limit")).hitRateLimit;
 for(let i=0;i<60;i++) expect((await (i%2?first:second)("alice","me-write",60,60000,1000)).allowed).toBe(true);
 expect(await second("alice","me-write",60,60000,1000)).toEqual({allowed:false,retryAfterSec:59});
 expect((await first("bob","me-write",60,60000,1000)).allowed).toBe(true);
 expect((await first("alice","coach",20,300000,1000)).allowed).toBe(true);
 expect(await first("alice","me-write",60,60000,60000)).toEqual({allowed:true,retryAfterSec:60});
});
it("concurrent upserts admit exactly the limit",async()=>{
 const hits=await Promise.all(Array.from({length:25},()=>hitRateLimit("alice","coach",20,300000,299999)));
 expect(hits.filter(h=>h.allowed)).toHaveLength(20); expect(hits.at(-1)?.retryAfterSec).toBe(1);
});
it("cleanup is bounded and excludes recent windows",async()=>{
 for(let i=0;i<120;i++) test.sqlite.prepare("INSERT INTO rate_limits VALUES (?,?,?,?)").run("bob","old"+i,0,1);
 await hitRateLimit("alice","coach",20,300000,172800000);
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM rate_limits").get()).toEqual({n:21});
});

it("twenty Coach hits per fixed five minutes, separated by user, window expires", async () => {
 for (let i = 0; i < 20; i++) {
  expect((await hitRateLimit("alice", "coach", 20, 300000, 1000 + i)).allowed).toBe(true);
 }
 expect((await hitRateLimit("alice", "coach", 20, 300000, 1020)).allowed).toBe(false);
 expect((await hitRateLimit("bob", "coach", 20, 300000, 1020)).allowed).toBe(true);
 expect((await hitRateLimit("alice", "coach", 20, 300000, 299999)).allowed).toBe(false);
 expect((await hitRateLimit("alice", "coach", 20, 300000, 300000)).allowed).toBe(true);
});
it("retry delay rounds up to the fixed boundary without extending the window", async () => {
 expect(await hitRateLimit("alice", "retry", 2, 5000, 1000)).toEqual({ allowed: true, retryAfterSec: 4 });
 expect(await hitRateLimit("alice", "retry", 2, 5000, 2500)).toEqual({ allowed: true, retryAfterSec: 3 });
 expect(await hitRateLimit("alice", "retry", 2, 5000, 3001)).toEqual({ allowed: false, retryAfterSec: 2 });
 expect((await hitRateLimit("bob", "retry", 2, 5000, 3001)).allowed).toBe(true);
 expect(await hitRateLimit("alice", "retry", 2, 5000, 4999)).toEqual({ allowed: false, retryAfterSec: 1 });
 expect(await hitRateLimit("alice", "retry", 2, 5000, 5000)).toEqual({ allowed: true, retryAfterSec: 5 });
});
