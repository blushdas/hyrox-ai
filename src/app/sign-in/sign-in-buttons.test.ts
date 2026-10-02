import React from "react";
import { afterEach, expect, it, vi } from "vitest";
import { SignInButtons } from "./sign-in-buttons";
import { challengeFromVerifier } from "@/lib/auth/pkce";

const mocks = vi.hoisted(() => ({
  setters: [vi.fn(), vi.fn()],
  stateIndex: 0,
  listener: undefined as undefined | ((event: { url: string }) => void),
  exchange: vi.fn(),
  take: vi.fn(),
  store: vi.fn(),
  storeVerifier: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => void) => { effect(); },
  useState: (initial: boolean) => [initial, mocks.setters[mocks.stateIndex++]],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }), useSearchParams: () => new URLSearchParams() }));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock("@capacitor/app", () => ({ App: { addListener: vi.fn((_event, listener) => {
  mocks.listener = listener;
  return Promise.resolve({ remove: vi.fn() });
}) } }));
vi.mock("@/components/ui/button", () => ({ Button: "button" }));
vi.mock("@/lib/auth/native-session-client", () => ({ exchangeNativeCode: mocks.exchange, storeNativeToken: mocks.store, takeNativeVerifier: mocks.take, storeNativeVerifier: mocks.storeVerifier }));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it.each(["https://evil.example/auth?code=X", "not a URL", "finisher://wrong?code=X", "finisher://auth"])(
  "shows failure without exchanging invalid deep link %s", async (url) => {
    vi.clearAllMocks();
    mocks.stateIndex = 0;
    vi.stubGlobal("React", React);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    SignInButtons();
    expect(mocks.listener).toBeTypeOf("function");
    mocks.listener!({ url });
    await vi.waitFor(() => expect(mocks.setters[0]).toHaveBeenLastCalledWith(true));
    expect(mocks.setters[1]).toHaveBeenLastCalledWith(false);
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  },
);

it.each([null,"v".repeat(43)])("deep link exchanges only with stored verifier %s",async verifier=>{
 vi.clearAllMocks();mocks.stateIndex=0;vi.stubGlobal("React",React);vi.stubEnv("NEXT_PUBLIC_AUTH_ORIGIN","https://example.com");vi.spyOn(console,"error").mockImplementation(()=>undefined);
 mocks.take.mockResolvedValue(verifier);mocks.exchange.mockResolvedValue("token");SignInButtons();mocks.listener!({url:"finisher://auth?code=C"});
 if(verifier){await vi.waitFor(()=>expect(mocks.replace).toHaveBeenCalledWith("/dashboard"));expect(mocks.exchange).toHaveBeenCalledExactlyOnceWith("https://example.com","C",verifier);}
 else{await vi.waitFor(()=>expect(mocks.setters[0]).toHaveBeenLastCalledWith(true));expect(mocks.exchange).not.toHaveBeenCalled();}
});


it("native sign-in start redirects with the S256 challenge of the stored verifier", async () => {
  vi.clearAllMocks();
  mocks.stateIndex = 0;
  vi.stubGlobal("React", React);
  vi.stubEnv("NEXT_PUBLIC_AUTH_ORIGIN", "https://example.com");
  const location = { href: "" };
  vi.stubGlobal("window", { location });
  mocks.storeVerifier.mockResolvedValue(undefined);

  const view = SignInButtons();
  const buttons = view.props.children as React.ReactElement<{ children: string; onClick: () => Promise<void> }>[];
  const button = buttons.find((child) => React.isValidElement(child) && child.props.children === "Continue with Google");
  expect(button).toBeDefined();
  await button!.props.onClick();

  expect(mocks.storeVerifier).toHaveBeenCalledTimes(1);
  const verifier = mocks.storeVerifier.mock.calls[0][0] as string;
  expect(verifier).toMatch(/^[A-Za-z0-9._~-]{43,128}$/);
  const redirect = new URL(location.href);
  expect(redirect.origin).toBe("https://example.com");
  expect(redirect.pathname).toBe("/sign-in");
  const callback = new URL(redirect.searchParams.get("callbackUrl")!, redirect.origin);
  expect(callback.pathname).toBe("/auth/native-complete");
  expect(callback.searchParams.get("cc")).toBe(await challengeFromVerifier(verifier));
});
