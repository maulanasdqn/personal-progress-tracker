import type { D1Database } from '@cloudflare/workers-types';

export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function nowISO(): string {
  return new Date().toISOString();
}

// Helper to run queries with error handling
export async function query<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const stmt = db.prepare(sql);
  const result = await stmt.bind(...params).all<T>();
  return result.results;
}

export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const stmt = db.prepare(sql);
  const result = await stmt.bind(...params).first<T>();
  return result;
}

export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<void> {
  const stmt = db.prepare(sql);
  await stmt.bind(...params).run();
}
