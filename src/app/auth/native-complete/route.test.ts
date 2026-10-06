import { expect,it,vi } from "vitest";
vi.mock("@/auth",()=>({auth:vi.fn(async()=>({user:{id:"alice"}}))}));
vi.mock("@opennextjs/cloudflare",()=>({getCloudflareContext:vi.fn()}));
import { getCloudflareContext } from "@opennextjs/cloudflare";import { createTestDb } from "@/lib/api/test-d1";
import { GET } from "./route";
it.each(["","?cc=bad","?cc="+"c".repeat(43)+"&method=plain","?cc="+"c".repeat(43)+"&code_challenge_method=plain"])("invalid challenge %s issues no code",async query=>{
 const test=createTestDb();vi.mocked(getCloudflareContext).mockResolvedValue({env:{DB:test.db}} as never);
 try{const response=await GET(new Request("https://example.com/auth/native-complete"+query));expect(response.headers.get("location")).toBe("https://example.com/sign-in?error=InvalidRequest");expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM native_auth_codes").get()).toEqual({n:0});}finally{test.close();}
});
it("valid S256 challenge is persisted with native redirect",async()=>{
 const test=createTestDb();vi.mocked(getCloudflareContext).mockResolvedValue({env:{DB:test.db}} as never);
 try{const response=await GET(new Request("https://example.com/auth/native-complete?cc="+"c".repeat(43)));expect(response.headers.get("location")).toMatch(/^finisher:\/\/auth\?code=/);expect(test.sqlite.prepare("SELECT codeChallenge FROM native_auth_codes").get()).toEqual({codeChallenge:"c".repeat(43)});}finally{test.close();}
});
