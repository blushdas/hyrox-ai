import { auth } from "@/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { mintNativeAuthCode, type NativeDatabase } from "@/lib/auth/native-auth";

export async function GET(request: Request) {
  const session = await auth();
  const headers = { "Cache-Control": "no-store" };
  if (!session?.user?.id) {
    return new Response(null, { status: 302, headers: { ...headers,
      Location: new URL("/sign-in?error=SessionUnavailable", request.url).href } });
  }
  const { env } = await getCloudflareContext({ async: true });
  const { DB } = env as typeof env & { DB: NativeDatabase };
  const code = await mintNativeAuthCode(DB, session.user.id, Date.now());
  return new Response(null, { status: 302, headers: { ...headers, Location: "finisher://auth?code=" + code } });
}
