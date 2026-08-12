import { readFileSync } from 'node:fs';
import postgres from 'postgres';

try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 15 });
try {
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`;
  console.log('Tabel:', tables.map((t) => t.table_name).join(', ') || '(kosong)');
  const u = await sql`select count(*)::int n from users`;
  const l = await sql`select count(*)::int n from locations`;
  const a = await sql`select count(*)::int n from attendance`;
  console.log(`users=${u[0].n} locations=${l[0].n} attendance=${a[0].n}`);
  console.log('OK: koneksi & schema valid.');
} catch (e) {
  console.error('GAGAL:', e.message);
  process.exit(1);
} finally {
  await sql.end();
}
