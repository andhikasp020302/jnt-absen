<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  let { children, data } = $props();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await goto('/login');
  }

  const path = $derived($page.url.pathname);
</script>

<div class="topbar">
  <div class="logo-sm">JNT</div>
  <div style="flex:1">
    <h1>{data.user?.name}</h1>
    <div class="sub">Absensi BGR031A</div>
  </div>
  <button class="out" onclick={logout} aria-label="Keluar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</div>

<main class="emp-main">{@render children()}</main>

<nav class="tabbar">
  <a href="/absen" class:active={path === '/absen'}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4"/></svg>
    Absen
  </a>
  <a href="/riwayat" class:active={path === '/riwayat'}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7v5l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Riwayat
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
</style>
