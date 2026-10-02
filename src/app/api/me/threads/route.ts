import { authenticated, readBody, invalid, validateThread } from "@/lib/api/validate";
import { createThread, listThreads } from "@/lib/db/coach";
export async function GET() { return authenticated(async userId => Response.json({ threads: await listThreads(userId) })); }
export async function POST(request: Request) {
 return authenticated(async userId => {
  const body = await readBody(request); if (!body.ok) return invalid(body.error);
  const thread = validateThread(body.value); if (!thread.ok) return invalid(thread.error);
  return Response.json({ thread: await createThread(userId, thread.value) }, { status: 201 });
 });
}
