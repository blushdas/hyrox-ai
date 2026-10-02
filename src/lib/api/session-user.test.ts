import { expect,it,vi } from "vitest";
vi.mock("@/auth",()=>({auth:vi.fn()}));vi.mock("./db-client",()=>({getDb:vi.fn()}));
import { auth } from "@/auth";import { getDb } from "./db-client";
import { createTestDb } from "./test-d1";import { getSessionUserId } from "./session-user";
it("a deleted user's otherwise valid JWT no longer authenticates",async()=>{
 const test=createTestDb();vi.mocked(getDb).mockResolvedValue(test.db);vi.mocked(auth).mockResolvedValue({user:{id:"alice"}} as never);
 try{expect(await getSessionUserId()).toBe("alice");test.sqlite.exec("DELETE FROM users WHERE id='alice'");expect(await getSessionUserId()).toBeNull();}
 finally{test.close();}
});
