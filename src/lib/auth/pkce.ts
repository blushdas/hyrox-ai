export function generateVerifier() {
 const bytes = crypto.getRandomValues(new Uint8Array(32));
 return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
export async function challengeFromVerifier(verifier: string) {
 const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
 return btoa(String.fromCharCode(...new Uint8Array(hash))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
export function isValidChallenge(value: unknown): value is string {
 return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}
export function isNativeCallback(value: string | null) {
 if (value === "/auth/native-complete") return true;
 if (!value || !value.startsWith("/auth/native-complete?")) return false;
 const url = new URL(value, "https://callback.invalid");
 return !url.hash && [...url.searchParams.keys()].length === 1 && isValidChallenge(url.searchParams.get("cc"));
}
