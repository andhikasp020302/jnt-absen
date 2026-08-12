// Membuat / mereset akun admin.
// Jalankan: node scripts/seed-admin.mjs "Nama Admin" "password"
// Butuh env DATABASE_URL (baca dari .env otomatis bila ada).

import { readFileSync } from 'node:fs';
import { scryptSync, randomBytes } from 'node:crypto';
import postgres from 'postgres';

// Load .env sederhana (tanpa dependency).
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* .env optional */
}

const name = process.argv[2];
const password = process.argv[3];
if (!name || !password) {
  console.error('Usage: node scripts/seed-admin.mjs "Nama Admin" "password"');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL belum di-set (di .env atau environment).');
  process.exit(1);
}

function hashPassword(pw) {
  const salt = randomBytes(16);
  const derived = scryptSync(pw, salt, 32);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

const hash = hashPassword(password);
await sql`
  insert into users (name, username, password_hash, role, status)
  values (${name}, ${name}, ${hash}, 'admin', 'approved')
  on conflict (username) do update
    set password_hash = excluded.password_hash,
        role = 'admin',
        status = 'approved'
`;

console.log(`✅ Admin "${name}" siap. Login dengan nama & password tersebut.`);
await sql.end();
