import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { proxy } from "./proxy";

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn() }));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(async () => ({ env: { AUTH_SECRET: "proxy-test-secret" } })),
}));

beforeEach(() => { vi.mocked(getToken).mockResolvedValue({ sub: "user" }); });

function signInRequest(callback: string | null) {
  const url = new URL("http://localhost:3000/sign-in");
  if (callback !== null) url.searchParams.set("callbackUrl", callback);
  return new NextRequest(url);
}

describe("signed-in sign-in proxy", () => {
  it("allows exactly the native completion callback through", async () => {
    const response = await proxy(signInRequest("/auth/native-complete"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.has("location")).toBe(false);
  });
  it.each([null, "", "/dashboard", "//evil.example", "https://evil.example", "/auth/native-complete/", "/auth/native-complete?next=evil", "/auth/native-complete#fragment", "https://localhost:3000/auth/native-complete", "/auth/native-complete-extra", "%2Fauth%2Fnative-complete"])(
    "keeps dashboard redirect for callback %s", async (callback) => {
      const response = await proxy(signInRequest(callback));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    },
  );
  it("still allows a signed-out user to see sign-in", async () => {
    vi.mocked(getToken).mockResolvedValue(null);
    const response = await proxy(signInRequest("/auth/native-complete"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
  it("still protects the dashboard when signed out", async () => {
    vi.mocked(getToken).mockResolvedValue(null);
    const response = await proxy(new NextRequest("http://localhost:3000/dashboard"));
    expect(response.headers.get("location")).toBe("http://localhost:3000/sign-in?callbackUrl=%2Fdashboard");
  });
});
