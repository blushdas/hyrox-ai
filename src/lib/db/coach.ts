import { MAX_THREADS, MAX_MESSAGES, QuotaExceeded, requireInserted } from "@/lib/api/quota";
import { getDb } from "@/lib/api/db-client";
import { epochToIso } from "@/lib/api/convert";
import type { MessageInput } from "@/lib/api/validate";
import type { ChatMessage } from "@/lib/coach-ai/types";
type ThreadRow = { id: string; title: string; created_at: number; updated_at: number; archived_at: number | null };
type MessageRow = { id: string; role: ChatMessage["role"]; content: string; status: ChatMessage["status"]; error_message: string | null; web_search: number; citations: string; web_sources: string | null; created_at: number };
const threadShape = (r: ThreadRow) => ({ id: r.id, title: r.title, createdAt: r.created_at, updatedAt: r.updated_at, archivedAt: r.archived_at });
const messageShape = (r: MessageRow): ChatMessage => ({ id: r.id, role: r.role, content: r.content, status: r.status, citations: JSON.parse(r.citations), createdAt: epochToIso(r.created_at), webSearch: Boolean(r.web_search), ...(r.error_message === null ? {} : { errorMessage: r.error_message }), ...(r.web_sources === null ? {} : { webSources: JSON.parse(r.web_sources) }) });
export async function createThread(userId: string, input: { title: string }) {
 const db = await getDb(); const now = Date.now(); const id = crypto.randomUUID();
 const inserted = await db.prepare("INSERT INTO coach_threads (id, user_id, title, created_at, updated_at) SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM coach_threads WHERE user_id = ?) < ? RETURNING id").bind(id, userId, input.title, now, now, userId, MAX_THREADS).first();
 if (!inserted) throw new QuotaExceeded();
 return { id, title: input.title, createdAt: now, updatedAt: now, archivedAt: null };
}
export async function listThreads(userId: string) {
 const db = await getDb();
 const { results } = await db.prepare("SELECT * FROM coach_threads WHERE user_id = ? AND archived_at IS NULL ORDER BY updated_at DESC, rowid DESC").bind(userId).all<ThreadRow>();
 return results.map(threadShape);
}
export async function getThread(userId: string, threadId: string) {
 const db = await getDb();
 const row = await db.prepare("SELECT * FROM coach_threads WHERE user_id = ? AND id = ? AND archived_at IS NULL").bind(userId, threadId).first<ThreadRow>();
 return row ? threadShape(row) : null;
}
export async function appendMessage(userId: string, threadId: string, input: MessageInput) {
 const db = await getDb(); const id = crypto.randomUUID(); const now = Date.now();
 if (!await getThread(userId, threadId)) return null;
 const results = await db.batch([
  db.prepare(`INSERT INTO coach_messages (id, thread_id, user_id, role, content, status, error_message, web_search, citations, web_sources, created_at)
  SELECT ?, id, user_id, ?, ?, ?, ?, ?, ?, ?, ? FROM coach_threads WHERE user_id = ? AND id = ? AND archived_at IS NULL AND (SELECT COUNT(*) FROM coach_messages WHERE user_id = ? AND thread_id = ?) < ?`)
  .bind(id, input.role, input.content, input.status, input.errorMessage ?? null, input.webSearch ? 1 : 0, JSON.stringify(input.citations), input.webSources === undefined ? null : JSON.stringify(input.webSources), now, userId, threadId, userId, threadId, MAX_MESSAGES),
  db.prepare("UPDATE coach_threads SET updated_at = ? WHERE user_id = ? AND id = ? AND archived_at IS NULL AND EXISTS (SELECT 1 FROM coach_messages WHERE id = ? AND user_id = ?)").bind(now, userId, threadId, id, userId),
 ]);
 requireInserted(results, 0);
 const row = await db.prepare("SELECT * FROM coach_messages WHERE user_id = ? AND thread_id = ? AND id = ?").bind(userId, threadId, id).first<MessageRow>();
 if (!row) throw new QuotaExceeded();
 return messageShape(row);
}
export async function listMessages(userId: string, threadId: string) {
 const db = await getDb();
 if (!await getThread(userId, threadId)) return null;
 const { results } = await db.prepare("SELECT * FROM coach_messages WHERE user_id = ? AND thread_id = ? ORDER BY created_at, rowid").bind(userId, threadId).all<MessageRow>();
 return results.map(messageShape);
}
