import { getCloudflareContext } from "@opennextjs/cloudflare";
import { consumeNativeAuthCode, encodeNativeToken, nativeCorsHeaders, nativeUnauthorized, type NativeDatabase, type NativeUser } from "@/lib/auth/native-auth";

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: nativeCorsHeaders(request.headers.get("Origin"), "POST, OPTIONS") });
}

export async function POST(request: Request) {
  const headers = nativeCorsHeaders(request.headers.get("Origin"), "POST, OPTIONS");
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { DB, AUTH_SECRET } = env as typeof env & { DB: NativeDatabase; AUTH_SECRET?: string };
    const secret = AUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is required");
    const body: unknown = await request.json();
    const code = body && typeof body === "object" && "code" in body ? body.code : null;
    const userId = await consumeNativeAuthCode(DB, code, Date.now());
    if (!userId) return nativeUnauthorized(headers);
    const user = await DB.prepare("SELECT id, name, email, image FROM users WHERE id = ?").bind(userId).first<NativeUser>();
    if (!user) return nativeUnauthorized(headers);
    return Response.json({ token: await encodeNativeToken(user, secret), user }, { headers });
  } catch (error) {
    // Never log request bodies, authorization headers, codes, or tokens.
    console.error("Native exchange rejected", error instanceof Error ? error.name : "UnknownError");
    return nativeUnauthorized(headers);
  }
}
