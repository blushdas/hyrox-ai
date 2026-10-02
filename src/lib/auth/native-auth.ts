import { challengeFromVerifier, isValidChallenge } from "./pkce";
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

export async function mintNativeAuthCode(db: NativeDatabase, userId: string, now: number, challenge: string) {
  if (!isValidChallenge(challenge)) throw new Error("Invalid PKCE challenge");
  await db.prepare("DELETE FROM native_auth_codes WHERE codeHash IN (SELECT codeHash FROM native_auth_codes WHERE usedAt IS NOT NULL OR expiresAt <= ? LIMIT 100)").bind(now).run();
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const code = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  await db.prepare("INSERT INTO native_auth_codes (codeHash, userId, expiresAt, codeChallenge) VALUES (?, ?, ?, ?)")
    .bind(await hashCode(code), userId, now + 60_000, challenge).run();
  return code;
}

export async function consumeNativeAuthCode(db: NativeDatabase, code: unknown, verifier: unknown, now: number) {
  if (typeof code !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(code)) return null;
  const row = await db.prepare("UPDATE native_auth_codes SET usedAt = ? WHERE codeHash = ? AND usedAt IS NULL AND expiresAt > ? RETURNING userId, codeChallenge")
    .bind(now, await hashCode(code), now).first<{ userId: string; codeChallenge: string | null }>();
  if (!row || typeof verifier !== "string" || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier) || !isValidChallenge(row.codeChallenge)) return null;
  const actual = await challengeFromVerifier(verifier);
  let difference = 0;
  for (let i = 0; i < 43; i++) difference |= actual.charCodeAt(i) ^ row.codeChallenge.charCodeAt(i);
  return difference === 0 ? row.userId : null;
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
