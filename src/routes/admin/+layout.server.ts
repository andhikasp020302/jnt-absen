import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals }) => {
  const sql = db();
  const rows = await sql`select count(*)::int as n from users where status = 'pending'`;
  return { user: locals.user, pending: rows[0]?.n ?? 0 };
};
