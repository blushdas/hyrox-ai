"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Button } from "@/components/ui/button";
import { getAuthOrigin, safeCallbackUrl } from "@/lib/auth/auth-origin";

export function SignInButtons() {
  const params = useSearchParams();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = App.addListener("appUrlOpen", ({ url }) => {
      // A deep link is not proof of a session. Token exchange is deployment-deferred.
      if (url.startsWith("finisher://")) { setPending(false); setFailed(true); }
    });
    return () => {
      void (async () => {
        try { const handle = await listener; await handle.remove(); }
        catch (error) { console.error("Native auth listener cleanup failed", error); }
      })();
    };
  }, []);
  async function login(provider: "apple" | "google") {
    setPending(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const origin = getAuthOrigin();
        if (!origin || new URL(origin).protocol !== "https:") throw new Error("Hosted HTTPS auth origin is required");
        // Capacitor sends external top-level navigation to the system browser.
        window.location.href = `${origin}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(`${origin}/auth/native-complete`)}`;
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
