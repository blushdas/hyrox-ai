import { guardedMutation } from "@/app/api/me/guards";
import { authenticated, readBody, invalid, validateProfile, validateSkipOnboarding } from "@/lib/api/validate";
import { getProfile, upsertProfile, skipOnboarding } from "@/lib/db/profile";
export async function GET() { return authenticated(async userId => Response.json(await getProfile(userId))); }
export async function PUT(request: Request) {
 return guardedMutation(request, async userId => {
  const body = await readBody(request); if (!body.ok) return invalid(body.error);
  if ("skipOnboarding" in body.value) {
   if (!validateSkipOnboarding(body.value)) return invalid("Invalid skip request");
   return Response.json(await skipOnboarding(userId));
  }
  const profile = validateProfile(body.value.profile); if (!profile.ok) return invalid(profile.error);
  if (body.value.onboardingComplete !== undefined && typeof body.value.onboardingComplete !== "boolean") return invalid("Invalid onboarding flag");
  const saved = await upsertProfile(userId, profile.value, { onboardingComplete: body.value.onboardingComplete as boolean | undefined, onlyIfEmpty: request.headers.get("If-None-Match") === "*" });
  return saved === null ? Response.json({ error: "Profile already exists" }, { status: 412 }) : Response.json(saved);
 });
}
