import { readFileSync } from 'node:fs';
import postgres from 'postgres';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
for (const l of env.split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 15 });
try {
  await sql`alter table locations add column if not exists polygon jsonb`;
  await sql`alter table locations alter column lat drop not null`;
  await sql`alter table locations alter column lng drop not null`;
  await sql`alter table locations alter column radius_m drop not null`;
  const cols = await sql`
    select column_name from information_schema.columns
    where table_name = 'locations' order by ordinal_position`;
  console.log('kolom locations:', cols.map((c) => c.column_name).join(', '));
  console.log('OK migrasi selesai');
} catch (e) {
  console.error('GAGAL:', e.message);
  process.exit(1);
} finally {
  await sql.end();
}
