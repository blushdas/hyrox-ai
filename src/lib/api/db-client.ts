import { getCloudflareContext } from "@opennextjs/cloudflare";
export type Statement = {
 bind(...values: (string | number | null)[]): Statement;
 first<T>(): Promise<T | null>;
 all<T>(): Promise<{ results: T[] }>;
 run(): Promise<unknown>;
};
export type Db = { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown> };
export async function getDb(): Promise<Db> {
 const { env } = await getCloudflareContext({ async: true });
 const db = (env as typeof env & { DB?: Db }).DB;
 if (!db) throw new Error("Cloudflare D1 binding DB is required for persistence");
 return db;
}
