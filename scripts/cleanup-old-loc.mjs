import { readFileSync } from 'node:fs';
import postgres from 'postgres';
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
for (const l of env.split('\n')) { const m=l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2]; }
const sql = postgres(process.env.DATABASE_URL,{prepare:false,max:1,connect_timeout:15});
const del = await sql`delete from locations where polygon is null returning id`;
console.log('Area lama tanpa poligon dihapus:', del.length);
await sql.end();
