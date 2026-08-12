import { error, type RequestEvent } from '@sveltejs/kit';

export function requireUser(event: RequestEvent): App.SessionUser {
  if (!event.locals.user) throw error(401, 'Belum login');
  return event.locals.user;
}

export function requireAdmin(event: RequestEvent): App.SessionUser {
  const u = requireUser(event);
  if (u.role !== 'admin') throw error(403, 'Khusus admin');
  return u;
}
