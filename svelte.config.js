import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Node serverless runtime on Vercel (needed for the `postgres` driver).
    // Region sin1 (Singapore) supaya function sebelahan dengan database Supabase
    // (region ap-southeast-1) → latency kecil, tidak menyeberang benua.
    adapter: adapter({ runtime: 'nodejs22.x', regions: ['sin1'] })
  }
};

export default config;
