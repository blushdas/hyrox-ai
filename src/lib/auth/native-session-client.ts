"use client";

import { Capacitor } from "@capacitor/core";
import { SecureStorage, KeychainAccess } from "@aparajita/capacitor-secure-storage";

const tokenKey = "finisher-native-session";
function requireNative() {
  // The plugin's web implementation uses localStorage; never allow that fallback.
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("SecureStorage")) {
    throw new Error("Native secure storage is unavailable");
  }
}
function endpoint(origin: string, path: string) {
  const url = new URL(origin);
  if (url.protocol !== "https:") throw new Error("Hosted HTTPS auth origin is required");
  return new URL(path, url.origin).href;
}
export async function storeNativeToken(token: string) {
  requireNative();
  await SecureStorage.set(tokenKey, token, false, false, KeychainAccess.whenUnlockedThisDeviceOnly);
}
export async function readNativeToken() {
  requireNative();
  const token = await SecureStorage.get(tokenKey, false, false);
  if (token !== null && typeof token !== "string") throw new Error("Invalid native token storage");
  return token;
}
export async function clearNativeToken() {
  requireNative();
  await SecureStorage.remove(tokenKey, false);
}
export async function exchangeNativeCode(origin: string, code: string) {
  const response = await fetch(endpoint(origin, "/api/native-auth/exchange"), {
    method: "POST", credentials: "omit", cache: "no-store",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
  });
  if (!response.ok) throw new Error("Native code exchange failed");
  const result = await response.json();
  if (typeof result.token !== "string" || !result.token) throw new Error("Native token missing");
  return result.token as string;
}
export async function fetchNativeSession(origin: string) {
  const token = await readNativeToken();
  if (!token) return null;
  const response = await fetch(endpoint(origin, "/api/native-auth/session"), {
    credentials: "omit", cache: "no-store", headers: { Authorization: "Bearer " + token },
  });
  if (response.status === 401) { await clearNativeToken(); return null; }
  if (!response.ok) throw new Error("Hosted session verification failed");
  const session = await response.json();
  if (!session?.user?.id) throw new Error("Hosted session response invalid");
  return session;
}
