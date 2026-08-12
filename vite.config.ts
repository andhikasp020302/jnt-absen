import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    // Keep the client bundle lean and target modern mobile browsers only.
    target: 'es2020'
  }
});
