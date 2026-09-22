"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { getAuthOrigin } from "@/lib/auth/auth-origin";
import { isProtectedPath } from "@/lib/auth/protected-routes";

export function NativeAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [verifiedPath, setVerifiedPath] = useState<string | null>(null);
  const native = Capacitor.isNativePlatform();
  const protectedPath = isProtectedPath(pathname);
  useEffect(() => {
    if (!native || !protectedPath) return;
    const controller = new AbortController();
    async function verify() {
      try {
        const origin = getAuthOrigin();
        if (!origin) { router.replace("/sign-in"); return; }
        const response = await fetch(`${origin}/api/auth/session`, { credentials: "include", cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Hosted session verification failed");
        const session = await response.json();
        if (session?.user) setVerifiedPath(pathname);
        else router.replace("/sign-in");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Native session verification failed", error);
        router.replace("/sign-in?error=SessionUnavailable");
      }
    }
    void verify();
    return () => controller.abort();
  }, [native, protectedPath, pathname, router]);
  if (native && protectedPath && verifiedPath !== pathname) return <p className="p-6">Checking session…</p>;
  return children;
}
