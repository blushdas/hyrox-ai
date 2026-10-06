import { guardMutation } from "@/lib/api/request-guard";
import { authenticated } from "@/lib/api/validate";
import { hitRateLimit } from "@/lib/db/rate-limit";
import { ME_WRITE_LIMIT, ME_WRITE_WINDOW_MS } from "@/lib/coach-ai/rate-limit";
import { QuotaExceeded } from "@/lib/api/quota";
export async function guardedMutation(request: Request, action: (userId: string) => Promise<Response>) {
 const rejected = guardMutation(request); if (rejected) return rejected;
 return authenticated(async userId => {
  try {
   const hit = await hitRateLimit(userId, "me-write", ME_WRITE_LIMIT, ME_WRITE_WINDOW_MS);
   if (!hit.allowed) return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(hit.retryAfterSec) } });
  } catch (error) { console.error(error instanceof Error ? error.message : "Rate limit unavailable"); }
  try { return await action(userId); }
  catch (error) {
   if (error instanceof QuotaExceeded) return Response.json({ error: "Quota exceeded" }, { status: 409 });
   throw error;
  }
 });
}
