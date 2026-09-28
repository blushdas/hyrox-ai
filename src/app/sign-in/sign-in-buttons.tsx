"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Button } from "@/components/ui/button";
import { getAuthOrigin, safeCallbackUrl } from "@/lib/auth/auth-origin";

import { exchangeNativeCode, storeNativeToken } from "@/lib/auth/native-session-client";

export function SignInButtons() {
  const router = useRouter();
  const params = useSearchParams();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = App.addListener("appUrlOpen", ({ url }) => {
      if (!url.startsWith("finisher://")) return;
      void (async () => {
        setPending(true);
        setFailed(false);
        try {
          const link = new URL(url);
          const code = link.searchParams.get("code");
          if (link.protocol !== "finisher:" || link.host !== "auth" || link.pathname || !code) {
            throw new Error("Invalid native auth link");
          }
          const token = await exchangeNativeCode(getAuthOrigin(), code);
          await storeNativeToken(token);
          router.replace("/dashboard");
        } catch (error) {
          console.error("Native sign-in failed", error instanceof Error ? error.name : "UnknownError");
          setFailed(true);
        } finally { setPending(false); }
      })();
    });
    return () => {
      void (async () => {
        try { const handle = await listener; await handle.remove(); }
        catch (error) { console.error("Native auth listener cleanup failed", error); }
      })();
    };
  }, [router]);
  async function login(provider: "apple" | "google") {
    setPending(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const origin = getAuthOrigin();
        if (!origin || new URL(origin).protocol !== "https:") throw new Error("Hosted HTTPS auth origin is required");
        // Capacitor sends external top-level navigation to the system browser.
        // Auth.js v5 rejects GET /api/auth/signin/provider. The hosted page performs its CSRF-protected POST.
        window.location.href = origin + "/sign-in?callbackUrl=%2Fauth%2Fnative-complete";
        setPending(false);
        return;
      }
      await signIn(provider, { callbackUrl: safeCallbackUrl(params.get("callbackUrl")) });
    } catch (error) {
      console.error("Sign-in could not start", error);
      setFailed(true); setPending(false);
    }
  }
  return <div className="space-y-4">
    <Button className="w-full h-12" variant="outline" disabled={pending} onClick={() => login("apple")}>Continue with Apple</Button>
    <Button className="w-full h-12" disabled={pending} onClick={() => login("google")}>Continue with Google</Button>
    {(params.has("error") || failed) && <p role="alert" className="text-sm text-red-400">Sign-in was cancelled or failed. Please try again.</p>}
  </div>;
}
