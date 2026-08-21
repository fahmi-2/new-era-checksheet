// lib/db-helpers.ts
import pool from './db';

export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const result = await pool.query(query, params);
  return result.rows as T[];
}

export async function executeQueryOne<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}