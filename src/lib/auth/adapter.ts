import type { Adapter } from "next-auth/adapters";
export function minimizeOAuthTokens(base: Adapter): Adapter {
 return { ...base, async linkAccount(account) {
  const clean = { ...account };
  for (const key of ["access_token", "refresh_token", "id_token", "session_state", "oauth_token", "oauth_token_secret"] as const) delete clean[key];
  if (!base.linkAccount) throw new Error("Adapter linkAccount is required");
  await base.linkAccount(clean);
 } };
}
