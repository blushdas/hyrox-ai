import { expect, it } from "vitest";
import { generateVerifier, challengeFromVerifier, isValidChallenge } from "./pkce";
it("matches RFC 7636 S256 vector", async () => {
 expect(await challengeFromVerifier("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});
it("generates random valid verifiers and validates challenges strictly", () => {
 const a=generateVerifier(); expect(a).toMatch(/^[A-Za-z0-9._~-]{43,128}$/); expect(a).not.toBe(generateVerifier());
 expect(isValidChallenge("c".repeat(43))).toBe(true);
 for (const v of [null, "", "c".repeat(42), "c".repeat(44), "=".repeat(43)]) expect(isValidChallenge(v)).toBe(false);
});
