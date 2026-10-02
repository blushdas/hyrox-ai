import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { expect,it } from "vitest";
import { createTestDb,profile,plan } from "@/lib/api/test-d1";
import { getDb } from "@/lib/api/db-client";
import { vi } from "vitest";
import { upsertProfile } from "@/lib/db/profile";
import { createPlan } from "@/lib/db/plan";
import { createThread,appendMessage } from "@/lib/db/coach";
vi.mock("@/lib/api/db-client",()=>({getDb:vi.fn()}));
it("migration preserves all valid rows, strips six secrets, removes orphans, and cascades every user table",async()=>{
 const fixture=createTestDb();vi.mocked(getDb).mockResolvedValue(fixture.db);
 try {
  for(const id of ["alice","bob"]){await upsertProfile(id,profile);await createPlan(id,plan);const t=await createThread(id,{title:"T"});await appendMessage(id,t.id,{role:"user",content:"Hi",status:"complete",citations:[]});}
  const {DatabaseSync}=createRequire(import.meta.url)("node:sqlite");
  const db=new DatabaseSync(":memory:");
  try {
   db.exec("PRAGMA foreign_keys=ON");
   for(const file of ["0001_auth.sql","0002_native_auth_codes.sql","0003_core_schema.sql"])db.exec(readFileSync("migrations/"+file,"utf8"));
   db.exec("INSERT INTO users(id,email) VALUES ('alice','alice@example.invalid'),('bob','bob@example.invalid')");
   for(const id of ["alice","bob","orphan"]){
    db.prepare("INSERT INTO accounts VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(id,id,"oauth","google",id,"refresh","access",123,"bearer","openid","id","state","oauthsecret","oauth");
    db.prepare("INSERT INTO sessions VALUES (?,?,?,?)").run(id,id,id,"2030-01-01");
    for(const kind of ["live","used","expired"])db.prepare("INSERT INTO native_auth_codes VALUES (?,?,?,?)").run(id+kind,id,kind==="expired"?1:999999,kind==="used"?2:null);
   }
   const appTables=["athlete_profiles","training_plans","plan_sessions","coach_threads","coach_messages"];
   for(const table of appTables)for(const row of fixture.sqlite.prepare(`SELECT * FROM ${table}`).all() as Record<string,string|number|null>[]){
    const columns=Object.keys(row);db.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(()=>"?").join(",")})`).run(...Object.values(row));
   }
   const before=Object.fromEntries(appTables.map(table=>[table,db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]));
   const accounts=db.prepare("SELECT * FROM accounts WHERE userId!='orphan' ORDER BY id").all();
   const sessions=db.prepare("SELECT * FROM sessions WHERE userId!='orphan' ORDER BY id").all();
   const codes=db.prepare("SELECT * FROM native_auth_codes WHERE userId!='orphan' ORDER BY codeHash").all();
   for(const file of ["0004_auth_hardening.sql","0005_rate_limits.sql"])db.exec(readFileSync("migrations/"+file,"utf8"));
   const sanitized=accounts.map((row:Record<string,unknown>)=>({...row,access_token:null,refresh_token:null,id_token:null,session_state:null,oauth_token:null,oauth_token_secret:null}));
   expect(db.prepare("SELECT * FROM accounts ORDER BY id").all()).toEqual(sanitized);
   expect(db.prepare("SELECT * FROM sessions ORDER BY id").all()).toEqual(sessions);
   expect(db.prepare("SELECT * FROM native_auth_codes ORDER BY codeHash").all()).toEqual(codes.map((row:Record<string,unknown>)=>({...row,codeChallenge:null})));
   for(const table of appTables)expect(db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()).toEqual(before[table]);
   for(const table of ["accounts","sessions","native_auth_codes"]){
    expect(db.prepare(`PRAGMA foreign_key_list(${table})`).all()).toMatchObject([{table:"users",from:"userId",to:"id",on_delete:"CASCADE"}]);
   }
   db.exec("INSERT INTO rate_limits VALUES ('alice','coach',0,1),('bob','coach',0,1)");
   db.exec("DELETE FROM users WHERE id='alice'");
   for(const table of [...appTables,"accounts","sessions","rate_limits"])expect(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()).toEqual({n:1});
   expect(db.prepare("SELECT COUNT(*) AS n FROM native_auth_codes").get()).toEqual({n:3});
  }finally{db.close();}
 }finally{fixture.close();}
});
