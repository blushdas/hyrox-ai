import { expect,it,vi } from "vitest";
vi.mock("@opennextjs/cloudflare",()=>({getCloudflareContext:vi.fn()}));
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createTestDb } from "@/lib/api/test-d1";
import { mintNativeAuthCode } from "@/lib/auth/native-auth";
import { challengeFromVerifier } from "@/lib/auth/pkce";
import { POST } from "./route";
it.each(["correct","wrong","missing"])("exchange %s returns generic error and burns attempts",async mode=>{
 const test=createTestDb();vi.mocked(getCloudflareContext).mockResolvedValue({env:{DB:test.db,AUTH_SECRET:"unit-test-secret"}} as never);
 try{
  const verifier="v".repeat(43);const code=await mintNativeAuthCode(test.db,"alice",Date.now(),await challengeFromVerifier(verifier));
  const req=()=>new Request("https://example.com/api/native-auth/exchange",{method:"POST",headers:{Origin:"capacitor://localhost","Content-Type":"application/json"},body:JSON.stringify({code,...(mode==="missing"?{}:{code_verifier:mode==="correct"?verifier:"w".repeat(43)})})});
  const response=await POST(req());expect(response.status).toBe(mode==="correct"?200:401);expect(response.headers.get("Access-Control-Allow-Origin")).toBe("capacitor://localhost");
  if(mode!=="correct")expect(await response.json()).toEqual({error:"Unauthorized"});
  expect((await POST(req())).status).toBe(401);
 }finally{test.close();}
});
