import { expect,it } from "vitest";
import { D1Adapter } from "@auth/d1-adapter";
import { createTestDb } from "@/lib/api/test-d1";
import { minimizeOAuthTokens } from "./adapter";
it("drops all six provider secrets while preserving identity and repeat account lookup",async()=>{
 const test=createTestDb();
 try {
  // The SQLite test shim intentionally implements only the adapter-used D1 subset.
  const adapter=minimizeOAuthTokens(D1Adapter(test.db as unknown as Parameters<typeof D1Adapter>[0]));
  const account={userId:"alice",type:"oauth" as const,provider:"google",providerAccountId:"identity",access_token:"secret",refresh_token:"secret",id_token:"secret",session_state:"secret",oauth_token:"secret",oauth_token_secret:"secret",expires_at:100,token_type:"bearer" as const,scope:"openid"};
  await adapter.linkAccount!(account);
  expect(account.access_token).toBe("secret");
  expect(test.sqlite.prepare("SELECT userId,provider,providerAccountId,access_token,refresh_token,id_token,session_state,oauth_token,oauth_token_secret,expires_at,token_type,scope FROM accounts").get()).toEqual({userId:"alice",provider:"google",providerAccountId:"identity",access_token:null,refresh_token:null,id_token:null,session_state:null,oauth_token:null,oauth_token_secret:null,expires_at:100,token_type:"bearer" as const,scope:"openid"});
  for(let i=0;i<2;i++)expect((await adapter.getUserByAccount!({provider:"google",providerAccountId:"identity"}))?.id).toBe("alice");
 }finally{test.close();}
});
