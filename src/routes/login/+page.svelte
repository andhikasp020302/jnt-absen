<script lang="ts">
  import { goto } from '$app/navigation';
  import PasswordField from '$lib/PasswordField.svelte';

  let name = $state('');
  let password = $state('');
  let err = $state('');
  let loading = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    err = '';
    loading = true;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        err = data.message || 'Gagal login';
        return;
      }
      await goto(data.role === 'admin' ? '/admin' : '/absen');
    } catch {
      err = 'Tidak ada koneksi. Coba lagi.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth pad">
  <div class="brand">
    <div class="logo">JNT</div>
    <h1>Absensi Karyawan</h1>
    <p class="muted">Cabang BGR031A</p>
  </div>

  <form class="card pad" onsubmit={submit}>
    {#if err}<div class="alert err">{err}</div>{/if}
    <div class="field">
      <label for="name">Nama</label>
      <input id="name" bind:value={name} autocomplete="username" required placeholder="Nama" />
    </div>
    <div class="field">
      <label for="pw">Password</label>
      <PasswordField id="pw" bind:value={password} autocomplete="current-password" />
    </div>
    <button class="btn" disabled={loading}>
      {#if loading}<span class="spin"></span>{:else}Masuk{/if}
    </button>
  </form>

  <p class="center muted" style="margin-top:18px">
    Belum punya akun? <a href="/register">Daftar di sini</a>
  </p>
</div>

<style>
  .auth {
    padding: calc(46px + var(--safe-top)) 10px 30px;
    max-width: 470px;
    width: 100%;
    margin: 0 auto;
    min-height: 100dvh;
    background: radial-gradient(120% 55% at 50% 0%, var(--green-light), transparent 65%);
  }
  /* Desktop: background full-screen berasal dari .app, kartu di tengah */
  @media (min-width: 768px) {
    .auth {
      background: transparent;
      min-height: auto;
      padding-top: 8vh;
    }
  }
  .brand {
    text-align: center;
    margin-bottom: 26px;
  }
  .logo {
    width: 78px;
    height: 78px;
    margin: 0 auto 16px;
    border-radius: 22px;
    background: linear-gradient(145deg, #1cc25a, var(--green-dark));
    color: #fff;
    font-weight: 800;
    font-size: 27px;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 14px 28px rgba(10, 143, 60, 0.35);
  }
  .brand h1 {
    font-size: 22px;
  }
  .auth :global(form.card) {
    padding: 22px 15px;
    border-radius: 20px;
    box-shadow: 0 14px 34px rgba(16, 36, 27, 0.1);
  }
</style>
