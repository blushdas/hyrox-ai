import { describe, expect, it } from "vitest";
import { encode, decode } from "next-auth/jwt";
import { consumeNativeAuthCode, mintNativeAuthCode, encodeNativeToken, decodeNativeToken, nativeCorsHeaders, type NativeDatabase } from "./native-auth";

type Row = { codeHash: string; userId: string; expiresAt: number; usedAt: number | null };
function database() {
  const rows = new Map<string, Row>();
  const statements: string[] = [];
  const db: NativeDatabase = {
    prepare(sql) {
      statements.push(sql);
      return { bind(...values) { return {
        async run() {
          if (!sql.startsWith("INSERT INTO native_auth_codes")) throw new Error("Unexpected SQL");
          const [codeHash, userId, expiresAt] = values as [string, string, number];
          rows.set(codeHash, { codeHash, userId, expiresAt, usedAt: null });
        },
        async first<T>() {
          if (!sql.startsWith("UPDATE native_auth_codes SET usedAt")) throw new Error("Unexpected SQL");
          const [usedAt, codeHash, now] = values as [number, string, number];
          const row = rows.get(codeHash);
          // Honor the actual predicates so removing one breaks the behavior tests.
          if (!row || (sql.includes("usedAt IS NULL") && row.usedAt !== null) ||
              (sql.includes("expiresAt > ?") && row.expiresAt <= now)) return null;
          row.usedAt = usedAt;
          return { userId: row.userId } as T;
        },
      }; } };
    },
  };
  return { db, rows, statements };
}

describe("native one-time codes", () => {
  it("stores only SHA-256 hashes, with exactly 60 seconds of life", async () => {
    const { db, rows } = database();
    const code = await mintNativeAuthCode(db, "user", 1000);
    expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const row = [...rows.values()][0];
    expect(row.codeHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(row)).not.toContain(code);
    expect(row.expiresAt).toBe(61000);
    expect(await consumeNativeAuthCode(db, code, 60999)).toBe("user");
  });
  it("rejects at the exact expiry boundary and afterwards", async () => {
    for (const now of [61000, 61001]) {
      const { db } = database();
      const code = await mintNativeAuthCode(db, "user", 1000);
      expect(await consumeNativeAuthCode(db, code, now)).toBeNull();
    }
  });
  it("rejects replay, including two concurrent consumers", async () => {
    const { db } = database();
    const code = await mintNativeAuthCode(db, "user", 1000);
    const results = await Promise.all([consumeNativeAuthCode(db, code, 2000), consumeNativeAuthCode(db, code, 2000)]);
    expect(results.filter(Boolean)).toEqual(["user"]);
    expect(await consumeNativeAuthCode(db, code, 3000)).toBeNull();
  });
  it("rejects a well-formed unknown code", async () => {
    const { db } = database();
    await mintNativeAuthCode(db, "user", 1000);
    expect(await consumeNativeAuthCode(db, "x".repeat(43), 2000)).toBeNull();
  });
  it("rejects malformed input before touching D1", async () => {
    const { db, statements } = database();
    for (const code of [null, undefined, 1, {}, "", "a".repeat(42), "a".repeat(44), "!".repeat(43)]) {
      expect(await consumeNativeAuthCode(db, code, 0)).toBeNull();
    }
    expect(statements).toEqual([]);
  });
});

describe("native bearer tokens", () => {
  const secret = "throwaway-unit-test-secret-native-auth";
  const user = { id: "user", name: "QA", email: "qa@example.invalid", image: null };
  it("carries user claims and expires in 30 days", async () => {
    const token = await encodeNativeToken(user, secret);
    const payload = await decodeNativeToken(token, secret);
    expect(payload).toMatchObject({ sub: user.id, name: user.name, email: user.email, picture: null });
    expect(payload!.exp! - payload!.iat!).toBe(30 * 24 * 60 * 60);
  });
  it("rejects web tokens and prevents native tokens being used as web cookies", async () => {
    const web = await encode({ token: { sub: "user" }, secret, salt: "authjs.session-token" });
    await expect(decodeNativeToken(web, secret)).rejects.toThrow();
    const native = await encodeNativeToken(user, secret);
    await expect(decode({ token: native, secret, salt: "authjs.session-token" })).rejects.toThrow();
  });
  it("rejects expired and tampered tokens", async () => {
    const expired = await encode({ token: { sub: "user" }, secret, salt: "finisher-native-session", maxAge: -60 });
    await expect(decodeNativeToken(expired, secret)).rejects.toThrow();
    const token = await encodeNativeToken(user, secret);
    await expect(decodeNativeToken(token.slice(0, -8) + "tampered", secret)).rejects.toThrow();
  });
});

it("CORS matches only the exact native origin", () => {
  const allowed = nativeCorsHeaders("capacitor://localhost", "POST, OPTIONS");
  expect(allowed.get("Access-Control-Allow-Origin")).toBe("capacitor://localhost");
  expect(allowed.get("Vary")).toBe("Origin");
  expect(allowed.get("Access-Control-Allow-Headers")).toBe("Authorization, Content-Type");
  expect(allowed.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
  expect(allowed.has("Access-Control-Allow-Credentials")).toBe(false);
  for (const origin of [null, "https://evil.example", "capacitor://localhost/", "capacitor://localhost.evil.example", "http://localhost"]) {
    const headers = nativeCorsHeaders(origin, "GET, OPTIONS");
    expect(headers.has("Access-Control-Allow-Origin")).toBe(false);
    expect(headers.has("Vary")).toBe(false);
    expect(headers.get("Cache-Control")).toBe("no-store");
  }
});
