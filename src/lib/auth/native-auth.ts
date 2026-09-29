import { encode, decode } from "next-auth/jwt";

export type NativeDatabase = {
  prepare(sql: string): {
    bind(...values: (string | number | null)[]): {
      run(): Promise<unknown>;
      first<T>(): Promise<T | null>;
    };
  };
};
export type NativeUser = { id: string; name: string | null; email: string | null; image: string | null };
const salt = "finisher-native-session";

async function hashCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function mintNativeAuthCode(db: NativeDatabase, userId: string, now: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const code = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  await db.prepare("INSERT INTO native_auth_codes (codeHash, userId, expiresAt) VALUES (?, ?, ?)")
    .bind(await hashCode(code), userId, now + 60_000).run();
  return code;
}

export async function consumeNativeAuthCode(db: NativeDatabase, code: unknown, now: number) {
  if (typeof code !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(code)) return null;
  const row = await db.prepare("UPDATE native_auth_codes SET usedAt = ? WHERE codeHash = ? AND usedAt IS NULL AND expiresAt > ? RETURNING userId")
    .bind(now, await hashCode(code), now).first<{ userId: string }>();
  return row?.userId ?? null;
}

export function encodeNativeToken(user: NativeUser, secret: string) {
  return encode({ secret, salt, maxAge: 30 * 24 * 60 * 60,
    token: { sub: user.id, name: user.name, email: user.email, picture: user.image } });
}

export function decodeNativeToken(token: string, secret: string) {
  return decode({ token, secret, salt });
}

export function nativeCorsHeaders(origin: string | null, methods: string) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (origin === "capacitor://localhost") {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    headers.set("Access-Control-Allow-Methods", methods);
  }
  return headers;
}

export function nativeUnauthorized(headers: Headers) {
  return Response.json({ error: "Unauthorized" }, { status: 401, headers });
}
