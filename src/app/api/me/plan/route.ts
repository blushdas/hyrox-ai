import { authenticated, readBody, invalid, validatePlan, validatePlanMeta } from "@/lib/api/validate";
import { getActivePlan, createPlan } from "@/lib/db/plan";
export async function GET() { return authenticated(async userId => Response.json({ plan: await getActivePlan(userId) })); }
export async function POST(request: Request) {
 return authenticated(async userId => {
  const body = await readBody(request); if (!body.ok) return invalid(body.error);
  const plan = validatePlan(body.value.plan); if (!plan.ok) return invalid(plan.error);
  const meta = validatePlanMeta(body.value); if (!meta.ok) return invalid(meta.error);
  return Response.json({ plan: await createPlan(userId, plan.value, meta.value) }, { status: 201 });
 });
}
