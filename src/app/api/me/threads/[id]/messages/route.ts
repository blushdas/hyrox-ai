import { guardedMutation } from "@/app/api/me/guards";
import { authenticated, readBody, invalid, missing, validateMessage } from "@/lib/api/validate";
import { appendMessage, listMessages } from "@/lib/db/coach";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
 return authenticated(async userId => {
  const { id } = await context.params; const messages = await listMessages(userId, id);
  return messages ? Response.json({ messages }) : missing();
 });
}
export async function POST(request: Request, context: Context) {
 return guardedMutation(request, async userId => {
  const body = await readBody(request); if (!body.ok) return invalid(body.error);
  const message = validateMessage(body.value.message); if (!message.ok) return invalid(message.error);
  const { id } = await context.params; const saved = await appendMessage(userId, id, message.value);
  return saved ? Response.json({ message: saved }, { status: 201 }) : missing();
 });
}
