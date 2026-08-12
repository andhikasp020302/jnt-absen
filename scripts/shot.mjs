import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const B = process.env.B || 'https://jnt-absensi.vercel.app';
const USER = process.env.PU || 'probeadmin';
const PASS = process.env.PP || 'Probe123456';
mkdirSync(new URL('../shots', import.meta.url), { recursive: true });

const browser = await chromium.launch();

// ---- Desktop (laptop) ----
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(`${B}/login`, { waitUntil: 'networkidle' });
await p.fill('#name', USER);
await p.fill('#pw', PASS);
await Promise.all([p.waitForURL('**/admin', { timeout: 25000 }), p.click('form button.btn')]);
await p.waitForTimeout(1500);
await p.screenshot({ path: 'shots/admin-desktop.png' });

await p.goto(`${B}/admin/karyawan`, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.screenshot({ path: 'shots/karyawan-desktop.png' });

await p.goto(`${B}/admin/lokasi`, { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
await p.screenshot({ path: 'shots/lokasi-desktop.png' });
await ctx.close();

// ---- Mobile (login) ----
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const mp = await m.newPage();
await mp.goto(`${B}/login`, { waitUntil: 'networkidle' });
await mp.waitForTimeout(600);
await mp.screenshot({ path: 'shots/login-mobile.png' });

await browser.close();
console.log('screenshots saved to shots/');
