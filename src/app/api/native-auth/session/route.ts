import { getCloudflareContext } from "@opennextjs/cloudflare";
import { decodeNativeToken, nativeCorsHeaders, nativeUnauthorized, type NativeDatabase, type NativeUser } from "@/lib/auth/native-auth";

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: nativeCorsHeaders(request.headers.get("Origin"), "GET, OPTIONS") });
}

export async function GET(request: Request) {
  const headers = nativeCorsHeaders(request.headers.get("Origin"), "GET, OPTIONS");
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { DB, AUTH_SECRET } = env as typeof env & { DB: NativeDatabase; AUTH_SECRET?: string };
    const secret = AUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is required");
    const match = request.headers.get("Authorization")?.match(/^Bearer ([^\s]+)$/);
    if (!match) return nativeUnauthorized(headers);
    const token = await decodeNativeToken(match[1], secret);
    const userId = token?.sub;
    if (!userId) return nativeUnauthorized(headers);
    const user = await DB.prepare("SELECT id, name, email, image FROM users WHERE id = ?").bind(userId).first<NativeUser>();
    if (!user) return nativeUnauthorized(headers);
    return Response.json({ user }, { headers });
  } catch (error) {
    // Never log request bodies, authorization headers, codes, or tokens.
    console.error("Native session rejected", error instanceof Error ? error.name : "UnknownError");
    return nativeUnauthorized(headers);
  }
}
