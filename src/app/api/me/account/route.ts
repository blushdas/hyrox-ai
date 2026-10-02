import { guardedMutation } from "../guards";
import { deleteAccount } from "@/lib/db/account";
export async function DELETE(request: Request) {
 return guardedMutation(request, async userId => { await deleteAccount(userId); return new Response(null, { status: 204 }); });
}
export function GET() { return new Response(null, { status: 405, headers: { Allow: "DELETE" } }); }
