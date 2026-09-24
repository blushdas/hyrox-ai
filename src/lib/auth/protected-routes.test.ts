import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { authMatcher, isProtectedPath } from "./protected-routes";
import { safeCallbackUrl } from "./auth-origin";

test.each(["/dashboard", "/dashboard/", "/dashboard/nested", "/onboarding", "/plan", "/profile", "/session", "/session/abc", "/session/w1-d1/"])("protects %s", (path) => expect(isProtectedPath(path)).toBe(true));
test.each(["/", "/sign-in", "/api/auth/callback/google", "/_next/static/test.js", "/favicon.ico", "/logo.svg", "/dashboardish"])("leaves %s public", (path) => expect(isProtectedPath(path)).toBe(false));
test("proxy literal matcher stays synchronized", () => {
 const source = readFileSync("src/proxy.ts", "utf8");
 expect(JSON.parse(source.match(/matcher: (\[[^\]]+\])/)![1])).toEqual(authMatcher);
});
test.each(["//evil.test", "https://evil.test", "/\\evil.test", "/\nevil.test"])("rejects unsafe callback %s", (path) => expect(safeCallbackUrl(path)).toBe("/dashboard"));
