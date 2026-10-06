import { getDb } from "@/lib/api/db-client";
export async function hitRateLimit(userId: string, bucket: string, limit: number, windowMs: number, now = Date.now()) {
 const db = await getDb();
 const start = Math.floor(now / windowMs) * windowMs;
 const row = await db.prepare(`INSERT INTO rate_limits (user_id,bucket,window_start,count) VALUES (?,?,?,1)
 ON CONFLICT(user_id,bucket,window_start) DO UPDATE SET count = count + 1 RETURNING count`)
 .bind(userId,bucket,start).first<{ count: number }>();
 if (!row) throw new Error("Rate limit count unavailable");
 await db.prepare("DELETE FROM rate_limits WHERE rowid IN (SELECT rowid FROM rate_limits WHERE window_start < ? LIMIT 100)").bind(now - 86400000).run();
 return { allowed: row.count <= limit, retryAfterSec: Math.max(1, Math.ceil((start + windowMs - now) / 1000)) };
}
