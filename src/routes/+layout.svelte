<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  let { children } = $props();

  // Halaman ber-navigasi (punya sidebar/tabbar): admin & karyawan.
  // Dipakai untuk mengaktifkan layout desktop tanpa bergantung pada :has().
  const hasNav = $derived(
    $page.url.pathname.startsWith('/admin') ||
      $page.url.pathname === '/absen' ||
      $page.url.pathname === '/riwayat'
  );
</script>

<div class="app" class:has-nav={hasNav}>
  {@render children()}
</div>
