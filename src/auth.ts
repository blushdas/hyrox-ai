import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { D1Adapter } from "@auth/d1-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { buildAppleClientSecret } from "@/lib/auth/apple-client-secret";

type AuthBindings = {
  DB: Parameters<typeof D1Adapter>[0];
  AUTH_SECRET?: string;
  AUTH_GOOGLE_ID?: string;
  AUTH_GOOGLE_SECRET?: string;
  AUTH_APPLE_ID?: string;
  AUTH_APPLE_SECRET?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
};

export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const context = await getCloudflareContext({ async: true });
  const env = context.env as typeof context.env & AuthBindings;
  if (!env.DB) throw new Error("Cloudflare D1 binding DB is required for authentication");
  const secret = env.AUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for authentication");
  const read = (key: keyof AuthBindings) => (env[key] as string | undefined) || process.env[key];
  const AUTH_APPLE_SECRET = read("AUTH_APPLE_SECRET");
  const AUTH_APPLE_ID = read("AUTH_APPLE_ID");
  const APPLE_TEAM_ID = read("APPLE_TEAM_ID");
  const APPLE_KEY_ID = read("APPLE_KEY_ID");
  const APPLE_PRIVATE_KEY = read("APPLE_PRIVATE_KEY");
  const appleSecret = AUTH_APPLE_SECRET || (AUTH_APPLE_ID && APPLE_TEAM_ID && APPLE_KEY_ID && APPLE_PRIVATE_KEY
    ? await buildAppleClientSecret({ clientId: AUTH_APPLE_ID, teamId: APPLE_TEAM_ID, keyId: APPLE_KEY_ID, privateKey: APPLE_PRIVATE_KEY }) : undefined);
  return {
    adapter: D1Adapter(env.DB),
    secret,
    providers: [
      Google({ clientId: read("AUTH_GOOGLE_ID"), clientSecret: read("AUTH_GOOGLE_SECRET") }),
      Apple({ clientId: AUTH_APPLE_ID, clientSecret: appleSecret }),
    ],
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
