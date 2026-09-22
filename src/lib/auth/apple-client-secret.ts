import { importPKCS8, SignJWT } from "jose";

type AppleSecretOptions = { teamId: string; keyId: string; clientId: string; privateKey: string; now?: number };

export async function buildAppleClientSecret({ teamId, keyId, clientId, privateKey, now = Math.floor(Date.now() / 1000) }: AppleSecretOptions): Promise<string> {
  const key = await importPKCS8(privateKey.replace(/\\n/g, "\n"), "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId).setSubject(clientId).setAudience("https://appleid.apple.com")
    .setIssuedAt(now).setExpirationTime(now + 180 * 24 * 60 * 60).sign(key);
}
