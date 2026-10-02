import { getDb } from "./db-client";
import { auth } from "@/auth";
export async function getSessionUserId(): Promise<string | null> {
 const session = await auth();
 const id = session?.user?.id; if (!id) return null;
 const db = await getDb();
 const row = await db.prepare("SELECT id FROM users WHERE id = ?").bind(id).first<{ id: string }>();
 return row?.id ?? null;
}
