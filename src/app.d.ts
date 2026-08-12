// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    interface SessionUser {
      id: number;
      name: string;
      role: 'admin' | 'employee';
    }
    interface Locals {
      user: SessionUser | null;
    }
  }
}

export {};
