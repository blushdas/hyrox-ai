import { beforeEach,afterEach,expect,it,vi } from "vitest";
vi.mock("@/auth",()=>({auth:vi.fn()}));vi.mock("@/lib/api/db-client",()=>({getDb:vi.fn()}));
import { auth } from "@/auth";import { getDb } from "@/lib/api/db-client";
import { createTestDb,plan } from "@/lib/api/test-d1";
import * as profiles from "@/lib/db/profile";import * as plans from "@/lib/db/plan";import * as coach from "@/lib/db/coach";
import * as profileRoute from "./profile/route";import * as planRoute from "./plan/route";import * as threadRoute from "./threads/route";
import * as sessionRoute from "./plan/sessions/[id]/route";import * as messageRoute from "./threads/[id]/messages/route";
import { POST as coachPost } from "../coach-ai/route";
let test:ReturnType<typeof createTestDb>;
beforeEach(()=>{test=createTestDb();vi.mocked(getDb).mockResolvedValue(test.db);vi.mocked(auth).mockResolvedValue({user:{id:"alice"}} as never);});
afterEach(()=>{test.close();vi.restoreAllMocks();});
const context={params:Promise.resolve({id:"thread"})};
const handlers=[
 ["profile","PUT",(r:Request)=>profileRoute.PUT(r)],
 ["plan","POST",(r:Request)=>planRoute.POST(r)],
 ["session","PATCH",(r:Request)=>sessionRoute.PATCH(r,context)],
 ["threads","POST",(r:Request)=>threadRoute.POST(r)],
 ["messages","POST",(r:Request)=>messageRoute.POST(r,context)],
] as const;
it.each(handlers)("%s rejects before auth and data writes",async(_name,method,handler)=>{
 const spies=[vi.spyOn(profiles,"upsertProfile"),vi.spyOn(plans,"createPlan"),vi.spyOn(plans,"updateSessionStatus"),vi.spyOn(coach,"createThread"),vi.spyOn(coach,"appendMessage")];
 for(const headers of [{Origin:"https://evil.example"},{"Content-Type":"text/plain"}] as Record<string,string>[]){
  const response=await handler(new Request("http://localhost/api/me",{method,headers}));expect(response.status).toBe("Origin" in headers?403:415);
 }
 expect(auth).not.toHaveBeenCalled();for(const spy of spies)expect(spy).not.toHaveBeenCalled();
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM rate_limits").get()).toEqual({n:0});
});
it("route quota errors are exact 409 and leave all data untouched",async()=>{
 for(let i=0;i<25;i++)await plans.createPlan("alice",plan);
 const req=(value:unknown)=>new Request("http://localhost/api/me",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
 const p=await planRoute.POST(req({plan}));expect(p.status).toBe(409);expect(await p.json()).toEqual({error:"Quota exceeded"});
 let id="";for(let i=0;i<100;i++)id=(await coach.createThread("alice",{title:"T"})).id;
 const t=await threadRoute.POST(req({title:"overflow"}));expect(t.status).toBe(409);expect(await t.json()).toEqual({error:"Quota exceeded"});
 const message={role:"user" as const,content:"T",status:"complete" as const,citations:[]};
 for(let i=0;i<500;i++)await coach.appendMessage("alice",id,message);
 const m=await messageRoute.POST(req({message}),{params:Promise.resolve({id})});expect(m.status).toBe(409);expect(await m.json()).toEqual({error:"Quota exceeded"});
 expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM training_plans").get()).toEqual({n:25});expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM plan_sessions").get()).toEqual({n:25});expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM coach_threads").get()).toEqual({n:100});expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM coach_messages").get()).toEqual({n:500});
});
it("GET bypasses write limiter and deleted cookies fail on Coach and me",async()=>{
 test.sqlite.prepare("INSERT INTO rate_limits VALUES (?,?,?,?)").run("alice","me-write",Math.floor(Date.now()/60000)*60000,61);
 expect((await profileRoute.GET()).status).toBe(200);
 test.sqlite.exec("DELETE FROM users WHERE id='alice'");
 expect((await profileRoute.GET()).status).toBe(401);expect((await coachPost(new Request("http://localhost/api/coach-ai",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}))).status).toBe(401);
});
