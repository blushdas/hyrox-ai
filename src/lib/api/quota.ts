export const MAX_PLANS = 25;
export const MAX_THREADS = 100;
export const MAX_MESSAGES = 500;
export class QuotaExceeded extends Error {
 constructor() { super("Quota exceeded"); }
}
// D1 batch results expose meta.changes; node:sqlite exposes changes directly.
export function requireInserted(results: unknown, index: number) {
 if (!Array.isArray(results)) throw new Error("Missing batch results");
 const row = results[index] as { meta?: { changes?: number }; changes?: number } | undefined;
 const changes = row?.meta?.changes ?? row?.changes;
 if (changes === undefined) throw new Error("Missing write count");
 if (changes === 0) throw new QuotaExceeded();
}
