import { SUPABASE_URL, SUPABASE_SERVICE_KEY, STORAGE_BUCKET } from './env';

// Thin wrapper over the Supabase Storage REST API using fetch only
// (no SDK dependency, keeps cold-starts small). The bucket is PRIVATE;
// admins view photos through short-lived signed URLs.

function headers(extra: Record<string, string> = {}) {
  const key = SUPABASE_SERVICE_KEY();
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    ...extra
  };
}

export async function uploadObject(path: string, body: ArrayBuffer, contentType: string) {
  const res = await fetch(
    `${SUPABASE_URL()}/storage/v1/object/${STORAGE_BUCKET()}/${path}`,
    {
      method: 'POST',
      headers: headers({ 'Content-Type': contentType, 'x-upsert': 'true' }),
      body
    }
  );
  if (!res.ok) {
    throw new Error(`Storage upload failed (${res.status}): ${await res.text()}`);
  }
}

export async function signUrl(path: string, expiresIn = 3600): Promise<string> {
  const res = await fetch(
    `${SUPABASE_URL()}/storage/v1/object/sign/${STORAGE_BUCKET()}/${path}`,
    {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn })
    }
  );
  if (!res.ok) return '';
  const data = (await res.json()) as { signedURL: string };
  return `${SUPABASE_URL()}/storage/v1${data.signedURL}`;
}

export async function deleteObjects(paths: string[]) {
  if (paths.length === 0) return;
  const res = await fetch(`${SUPABASE_URL()}/storage/v1/object/${STORAGE_BUCKET()}`, {
    method: 'DELETE',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefixes: paths })
  });
  if (!res.ok) {
    throw new Error(`Storage delete failed (${res.status}): ${await res.text()}`);
  }
}
