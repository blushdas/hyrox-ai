import { authenticated, readBody, invalid, missing, validateSessionStatus } from "@/lib/api/validate";
import { updateSessionStatus } from "@/lib/db/plan";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
 return authenticated(async userId => {
  const body = await readBody(request); if (!body.ok) return invalid(body.error);
  const status = validateSessionStatus(body.value.status); if (!status.ok) return invalid(status.error);
  const { id } = await context.params; const session = await updateSessionStatus(userId, id, status.value);
  return session ? Response.json({ session }) : missing();
 });
}
