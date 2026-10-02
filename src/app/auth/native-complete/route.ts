import { isValidChallenge } from "@/lib/auth/pkce";
import { auth } from "@/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { mintNativeAuthCode, type NativeDatabase } from "@/lib/auth/native-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get("cc");
  if (!isValidChallenge(challenge) || (url.searchParams.has("method") && url.searchParams.get("method") !== "S256") || (url.searchParams.has("code_challenge_method") && url.searchParams.get("code_challenge_method") !== "S256")) return Response.redirect(new URL("/sign-in?error=InvalidRequest", url), 302);
  const session = await auth();
  const headers = { "Cache-Control": "no-store" };
  if (!session?.user?.id) {
    return new Response(null, { status: 302, headers: { ...headers,
      Location: new URL("/sign-in?error=SessionUnavailable", request.url).href } });
  }
  const { env } = await getCloudflareContext({ async: true });
  const { DB } = env as typeof env & { DB: NativeDatabase };
  const code = await mintNativeAuthCode(DB, session.user.id, Date.now(), challenge);
  return new Response(null, { status: 302, headers: { ...headers, Location: "finisher://auth?code=" + code } });
}
