import { beforeEach, afterEach, expect, it, vi } from "vitest";
vi.mock("@/lib/api/db-client",()=>({getDb:vi.fn()}));
import { getDb } from "@/lib/api/db-client";
import { createTestDb, plan } from "@/lib/api/test-d1";
import { createPlan,getActivePlan } from "./plan";
import { createThread,appendMessage } from "./coach";
import { QuotaExceeded } from "@/lib/api/quota";
let test: ReturnType<typeof createTestDb>;
beforeEach(()=>{test=createTestDb();vi.mocked(getDb).mockResolvedValue(test.db);});
afterEach(()=>{test.close();vi.restoreAllMocks();});
it("allows 25 plans, rejects 26 without archiving or orphan sessions",async()=>{
 let id="";for(let i=0;i<25;i++)id=(await createPlan("alice",plan)).id;
 expect((await getActivePlan("alice"))?.id).toBe(id);
 await expect(createPlan("alice",plan)).rejects.toBeInstanceOf(QuotaExceeded);
 expect((await getActivePlan("alice"))?.id).toBe(id);
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM plan_sessions").get()).toEqual({n:25});
 await createPlan("bob",plan);
});
it("counts archived threads toward 100 and isolates users",async()=>{
 for(let i=0;i<100;i++)await createThread("alice",{title:"T"});
 test.sqlite.exec("UPDATE coach_threads SET archived_at=1 WHERE user_id='alice'");
 await expect(createThread("alice",{title:"overflow"})).rejects.toBeInstanceOf(QuotaExceeded);
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM coach_threads").get()).toEqual({n:100});
 await createThread("bob",{title:"T"});
});
it("allows 500 messages then writes nothing, including thread timestamp",async()=>{
 const thread=await createThread("alice",{title:"T"});
 const input={role:"user" as const,content:"T",status:"complete" as const,citations:[]};
 for(let i=0;i<500;i++)await appendMessage("alice",thread.id,input);
 const before=test.sqlite.prepare("SELECT * FROM coach_threads").all();
 await expect(appendMessage("alice",thread.id,input)).rejects.toBeInstanceOf(QuotaExceeded);
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM coach_messages").get()).toEqual({n:500});
 expect(test.sqlite.prepare("SELECT * FROM coach_threads").all()).toEqual(before);
 expect(await appendMessage("bob",thread.id,input)).toBeNull();
});
