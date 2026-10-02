import { describe, expect, it } from "vitest";
import { encode, decode } from "next-auth/jwt";
import { createTestDb } from "@/lib/api/test-d1";
import { challengeFromVerifier } from "./pkce";
import { consumeNativeAuthCode, mintNativeAuthCode, encodeNativeToken, decodeNativeToken, nativeCorsHeaders } from "./native-auth";
const verifier = "v".repeat(43);
it("stores hashes, enforces 60s TTL and burns replayed codes atomically", async () => {
 const test = createTestDb();
 try {
  const code = await mintNativeAuthCode(test.db, "alice", 1000, await challengeFromVerifier(verifier));
  const row = test.sqlite.prepare("SELECT * FROM native_auth_codes").get();
  expect(JSON.stringify(row)).not.toContain(code);
  expect(row).toMatchObject({ expiresAt: 61000, usedAt: null });
  const attempts = await Promise.all([consumeNativeAuthCode(test.db, code, verifier, 60000), consumeNativeAuthCode(test.db, code, verifier, 60000)]);
  expect(attempts.filter(Boolean)).toEqual(["alice"]);
  expect(await consumeNativeAuthCode(test.db, code, verifier, 60001)).toBeNull();
 } finally { test.close(); }
});
it.each([null, undefined, "w".repeat(43), "v", {}, 1])("wrong or missing verifier %s burns the code", async bad => {
 const test = createTestDb();
 try {
  const code = await mintNativeAuthCode(test.db, "alice", 1000, await challengeFromVerifier(verifier));
  expect(await consumeNativeAuthCode(test.db, code, bad, 2000)).toBeNull();
  expect(test.sqlite.prepare("SELECT usedAt FROM native_auth_codes").get()).toEqual({ usedAt: 2000 });
  expect(await consumeNativeAuthCode(test.db, code, verifier, 2001)).toBeNull();
 } finally { test.close(); }
});
it.each([61000, 62000])("rejects code at/after expiry %s", async now => {
 const test = createTestDb();
 try {
  const code = await mintNativeAuthCode(test.db, "alice", 1000, await challengeFromVerifier(verifier));
  expect(await consumeNativeAuthCode(test.db, code, verifier, now)).toBeNull();
 } finally { test.close(); }
});
it("purges at most 100 used/expired rows on each mint and retains live codes", async () => {
 const test = createTestDb();
 try {
  for (let i=0;i<120;i++) test.sqlite.prepare("INSERT INTO native_auth_codes VALUES (?,?,?,?,?)").run(String(i), "alice", i<60?1000:999999, i<60?null:2, "c".repeat(43));
  test.sqlite.prepare("INSERT INTO native_auth_codes VALUES (?,?,?,?,?)").run("live", "bob", 999999, null, "c".repeat(43));
  await mintNativeAuthCode(test.db,"alice",2000,await challengeFromVerifier(verifier));
  expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM native_auth_codes").get()).toEqual({n:22});
  expect(test.sqlite.prepare("SELECT userId FROM native_auth_codes WHERE codeHash='live'").get()).toEqual({userId:"bob"});
 } finally { test.close(); }
});
it("rejects invalid challenge before minting", async () => {
 const test=createTestDb();
 try { await expect(mintNativeAuthCode(test.db,"alice",0,"bad")).rejects.toThrow(); expect(test.sqlite.prepare("SELECT COUNT(*) AS n FROM native_auth_codes").get()).toEqual({n:0}); }
 finally { test.close(); }
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
