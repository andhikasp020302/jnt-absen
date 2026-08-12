import postgres from 'postgres';
import { DATABASE_URL } from './env';

// Single pooled client reused across serverless invocations.
// Use the Supabase transaction pooler URL (port 6543) in production so we do
// not exhaust direct connections. `prepare: false` is required for that pooler.
let _sql: ReturnType<typeof postgres> | null = null;

export function db() {
  if (!_sql) {
    _sql = postgres(DATABASE_URL(), {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    });
  }
  return _sql;
}
