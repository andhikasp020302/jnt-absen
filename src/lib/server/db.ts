import postgres from 'postgres';
import { DATABASE_URL } from './env';

type Sql = ReturnType<typeof postgres>;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    t = setTimeout(() => reject(new Error(`db timeout: ${label}`)), ms);
  });
  return Promise.race([p.finally(() => clearTimeout(t)), timeout]);
}

// Fresh, short-lived connection PER CALL through the Supabase transaction
// pooler (port 6543). Reusing a module-cached connection on Vercel is unsafe:
// the socket dies while the function is frozen, and the next query hangs
// forever (infinite loading). Opening per request + closing after avoids that
// entirely; with the function co-located in sin1 the connect cost is ~ms.
export async function db<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  const run = async () => {
    const sql = postgres(DATABASE_URL(), {
      max: 1,
      prepare: false, // required for the transaction pooler
      fetch_types: false, // skip type-introspection round trip on connect
      connect_timeout: 8,
      idle_timeout: 5
    });
    try {
      return await withTimeout(fn(sql), 9000, 'query');
    } finally {
      await sql.end({ timeout: 4 }).catch(() => {});
    }
  };
  try {
    return await run();
  } catch (e) {
    // Don't retry intentional SvelteKit throws (error()/redirect() carry `status`).
    if (e && typeof e === 'object' && 'status' in e) throw e;
    // One retry with a brand-new connection (covers a rare stale/transient socket).
    return await run();
  }
}
