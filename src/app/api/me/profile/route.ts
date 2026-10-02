import { guardedMutation } from "@/app/api/me/guards";
import { authenticated, readBody, invalid, validateProfile } from "@/lib/api/validate";
import { getProfile, upsertProfile } from "@/lib/db/profile";
export async function GET() { return authenticated(async userId => Response.json(await getProfile(userId))); }
export async function PUT(request: Request) {
 return guardedMutation(request, async userId => {
  const body = await readBody(request); if (!body.ok) return invalid(body.error);
  const profile = validateProfile(body.value.profile); if (!profile.ok) return invalid(profile.error);
  if (body.value.onboardingComplete !== undefined && typeof body.value.onboardingComplete !== "boolean") return invalid("Invalid onboarding flag");
  return Response.json(await upsertProfile(userId, profile.value, { onboardingComplete: body.value.onboardingComplete as boolean | undefined }));
 });
}
