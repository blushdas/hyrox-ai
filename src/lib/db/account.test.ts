import { expect,it,vi } from "vitest";
vi.mock("@/lib/api/db-client",()=>({getDb:vi.fn()}));
import { getDb } from "@/lib/api/db-client";
import { createTestDb,profile,plan } from "@/lib/api/test-d1";
import { upsertProfile } from "./profile";
import { createPlan } from "./plan";
import { createThread,appendMessage } from "./coach";
import { hitRateLimit } from "./rate-limit";
import { deleteAccount } from "./account";
it("deletes every account table in one batch and preserves the other user",async()=>{
 const test=createTestDb();vi.mocked(getDb).mockResolvedValue(test.db);
 try {
  for(const id of ["alice","bob"]){
   test.sqlite.prepare("UPDATE users SET email=? WHERE id=?").run(id+"@example.invalid",id);
   test.sqlite.prepare("INSERT INTO accounts(id,userId,type,provider,providerAccountId) VALUES (?,?,?,?,?)").run(id,id,"oauth","google",id);
   test.sqlite.prepare("INSERT INTO sessions VALUES (?,?,?,?)").run(id,id,id,"2030-01-01");
   test.sqlite.prepare("INSERT INTO native_auth_codes VALUES (?,?,?,?,?)").run(id,id,999999,null,"c".repeat(43));
   test.sqlite.prepare("INSERT INTO verification_tokens VALUES (?,?,?)").run(id+"@example.invalid",id,"2030-01-01");
   await upsertProfile(id,profile);await createPlan(id,plan);
   const thread=await createThread(id,{title:"T"});await appendMessage(id,thread.id,{role:"user",content:"T",status:"complete",citations:[]});
   await hitRateLimit(id,"coach",20,300000,0);
  }
  const batch=vi.spyOn(test.db,"batch");await deleteAccount("alice");expect(batch).toHaveBeenCalledTimes(1);
  for(const table of ["users","accounts","sessions","native_auth_codes","verification_tokens","athlete_profiles","training_plans","plan_sessions","coach_threads","coach_messages","rate_limits"]){
   expect(test.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()).toEqual({n:1});
  }
  expect(test.sqlite.prepare("SELECT id FROM users").get()).toEqual({id:"bob"});
 }finally{test.close();vi.restoreAllMocks();}
});
