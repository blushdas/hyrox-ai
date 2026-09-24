import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { D1Adapter } from "@auth/d1-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAppleClientSecret } from "@/lib/auth/apple-client-secret";

type AuthBindings = { DB: Parameters<typeof D1Adapter>[0] };

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const context = await getCloudflareContext({ async: true });
  const env = context.env as typeof context.env & AuthBindings;
  if (!env.DB) throw new Error("Cloudflare D1 binding DB is required for authentication");
  const { AUTH_APPLE_SECRET, AUTH_APPLE_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY } = process.env;
  const appleSecret = AUTH_APPLE_SECRET || (AUTH_APPLE_ID && APPLE_TEAM_ID && APPLE_KEY_ID && APPLE_PRIVATE_KEY
    ? await buildAppleClientSecret({ clientId: AUTH_APPLE_ID, teamId: APPLE_TEAM_ID, keyId: APPLE_KEY_ID, privateKey: APPLE_PRIVATE_KEY }) : undefined);
  return {
    adapter: D1Adapter(env.DB),
    providers: [Google, Apple({ clientSecret: appleSecret })],
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    pages: { signIn: "/sign-in", error: "/sign-in" },
    trustHost: true,
    callbacks: {
      session({ session, token }) {
        if (session.user && token.sub) session.user.id = token.sub;
        return session;
      },
    },
  };
});
