<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  let { children, data } = $props();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await goto('/login');
  }

  async function changeMyPassword() {
    const current = prompt('Password lama:');
    if (current === null) return;
    const next = prompt('Password baru (min. 6 karakter):');
    if (next === null) return;
    if (next.length < 6) {
      alert('Password baru minimal 6 karakter.');
      return;
    }
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current, next })
    });
    const d = await res.json().catch(() => ({}));
    alert(res.ok ? 'Password berhasil diganti.' : d.message || 'Gagal mengganti password.');
  }

  const path = $derived($page.url.pathname);
</script>

<div class="topbar">
  <div class="logo-sm">JNT</div>
  <div style="flex:1">
    <h1>Admin · BGR031A</h1>
    <div class="sub">{data.user?.name}</div>
  </div>
  <button class="out" onclick={changeMyPassword} aria-label="Ganti password" title="Ganti password">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
      <path d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zM16 11V7a4 4 0 0 0-8 0v4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
  <button class="out" onclick={logout} aria-label="Keluar" title="Keluar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</div>

<main>{@render children()}</main>

<nav class="tabbar">
  <a href="/admin" class:active={path === '/admin'}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
    Absensi
  </a>
  <a href="/admin/karyawan" class:active={path === '/admin/karyawan'}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-linecap="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke-linecap="round"/></svg>
    Karyawan
    {#if data.pending > 0}<span class="dot">{data.pending}</span>{/if}
  </a>
  <a href="/admin/lokasi" class:active={path === '/admin/lokasi'}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-linejoin="round"/><circle cx="12" cy="10" r="3"/></svg>
    Lokasi
  </a>
</nav>

<style>
  main {
    flex: 1;
  }
  .logo-sm {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13px;
  }
  .out {
    background: none;
    border: 0;
    color: #fff;
    padding: 6px;
  }
  .tabbar a {
    position: relative;
  }
  .dot {
    position: absolute;
    top: 4px;
    left: 58%;
    background: var(--danger);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 999px;
    padding: 0 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
