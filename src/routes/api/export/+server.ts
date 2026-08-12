import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { requireAdmin } from '$lib/server/guard';
import { resolveRange } from '$lib/server/range';

// Escape a value for a semicolon-delimited CSV cell.
function cell(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[;"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(header: string[], rows: string[][]): string {
  // BOM + `sep=;` supaya Excel (termasuk locale Indonesia) langsung membuka
  // dalam kolom yang benar.
  const lines = ['sep=;', header.map(cell).join(';'), ...rows.map((r) => r.map(cell).join(';'))];
  return '﻿' + lines.join('\r\n');
}

export const GET: RequestHandler = async (event) => {
  requireAdmin(event);
  const scope = event.url.searchParams.get('scope') || 'today';
  const month = event.url.searchParams.get('month');
  const { from, to, label } = resolveRange(scope, month);

  let csv: string;

  if (scope === 'today' || (scope !== 'week' && scope !== 'month' && scope !== 'pick')) {
    // Hari ini: Nama, Jam Masuk, Jam Pulang.
    const rows = (await db((sql) => sql`
      select u.name,
        to_char(min(a.created_at) filter (where a.type = 'in') at time zone 'Asia/Jakarta', 'HH24:MI') as masuk,
        to_char(max(a.created_at) filter (where a.type = 'out') at time zone 'Asia/Jakarta', 'HH24:MI') as pulang
      from attendance a
      join users u on u.id = a.user_id
      where a.attendance_date between ${from} and ${to}
      group by u.id, u.name
      order by u.name
    `)) as unknown as { name: string; masuk: string | null; pulang: string | null }[];

    csv = toCsv(
      ['Nama', 'Jam Masuk', 'Jam Pulang'],
      rows.map((r) => [r.name, r.masuk ?? '-', r.pulang ?? '-'])
    );
  } else {
    // Minggu/Bulan: Nama, Total Hari Kerja (jumlah hari hadir).
    const rows = (await db((sql) => sql`
      select u.name, count(distinct a.attendance_date)::int as hari
      from attendance a
      join users u on u.id = a.user_id
      where a.attendance_date between ${from} and ${to}
      group by u.id, u.name
      order by u.name
    `)) as unknown as { name: string; hari: number }[];

    csv = toCsv(
      ['Nama', 'Total Hari Kerja'],
      rows.map((r) => [r.name, String(r.hari)])
    );
  }

  const fname = `Rekap-Absensi-${label}`.replace(/[^a-zA-Z0-9-]+/g, '-');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fname}.csv"`,
      'Cache-Control': 'no-store'
    }
  });
};
