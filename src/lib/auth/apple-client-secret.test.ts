import { expect, test } from "vitest";
import { generateKeyPair, exportPKCS8, jwtVerify } from "jose";
import { buildAppleClientSecret } from "./apple-client-secret";

test("Apple secret verifies with correct claims and six-month maximum", async () => {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const now = Math.floor(Date.now() / 1000);
  const token = await buildAppleClientSecret({ teamId: "test-team", keyId: "test-key", clientId: "test-client", privateKey: (await exportPKCS8(privateKey)).replace(/\n/g, "\\n"), now });
  const { payload, protectedHeader } = await jwtVerify(token, publicKey, { issuer: "test-team", subject: "test-client", audience: "https://appleid.apple.com", algorithms: ["ES256"] });
  expect(protectedHeader).toEqual({ alg: "ES256", kid: "test-key" });
  expect(payload.iat).toBe(now);
  expect(payload.exp! - payload.iat!).toBe(180 * 24 * 60 * 60);
});
