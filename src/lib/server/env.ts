import { env } from '$env/dynamic/private';

function req(name: string): string {
  const v = env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

export const DATABASE_URL = () => req('DATABASE_URL');
export const SESSION_SECRET = () => req('SESSION_SECRET');
export const SUPABASE_URL = () => req('SUPABASE_URL').replace(/\/$/, '');
export const SUPABASE_SERVICE_KEY = () => req('SUPABASE_SERVICE_KEY');
export const STORAGE_BUCKET = () => env.STORAGE_BUCKET || 'absensi';
export const CRON_SECRET = () => env.CRON_SECRET || '';
// How many days of attendance to keep before auto-deletion.
export const RETENTION_DAYS = () => Number(env.RETENTION_DAYS || '90');
