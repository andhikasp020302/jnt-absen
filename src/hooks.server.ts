import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, verifySession } from '$lib/server/auth';

const PUBLIC_ROUTES = ['/login', '/register'];

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(SESSION_COOKIE);
  event.locals.user = verifySession(token);

  const path = event.url.pathname;
  const isApi = path.startsWith('/api');
  const isPublic = PUBLIC_ROUTES.includes(path) || path.startsWith('/api/auth');
  const isCron = path.startsWith('/api/cron');

  // Page guards (API routes enforce their own auth + return JSON).
  if (!isApi && !isPublic) {
    if (!event.locals.user) throw redirect(302, '/login');
    // Keep employees out of /admin.
    if (path.startsWith('/admin') && event.locals.user.role !== 'admin') {
      throw redirect(302, '/absen');
    }
  }

  // Send logged-in users away from auth pages.
  if (event.locals.user && isPublic && !isApi) {
    throw redirect(302, event.locals.user.role === 'admin' ? '/admin' : '/absen');
  }

  if (isCron) {
    // handled inside the route
  }

  return resolve(event, {
    // Trim SvelteKit's HTML a little.
    preload: ({ type }) => type === 'js' || type === 'css'
  });
};
