<script lang="ts">
  import PasswordField from '$lib/PasswordField.svelte';

  let name = $state('');
  let password = $state('');
  let err = $state('');
  let ok = $state('');
  let loading = $state(false);

  // Hanya huruf & angka (tanpa spasi/simbol).
  function onName(e: Event) {
    name = (e.target as HTMLInputElement).value.replace(/[^a-zA-Z0-9]/g, '');
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    err = '';
    ok = '';
    loading = true;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        err = data.message || 'Gagal mendaftar';
        return;
      }
      ok = data.message;
      name = '';
      password = '';
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
    <h1>Daftar Akun</h1>
    <p class="muted">Cabang BGR031A</p>
  </div>

  <form class="card pad" onsubmit={submit}>
    {#if err}<div class="alert err">{err}</div>{/if}
    {#if ok}<div class="alert ok">{ok}</div>{/if}
    <div class="field">
      <label for="name">Nama</label>
      <input
        id="name"
        value={name}
        oninput={onName}
        autocomplete="username"
        required
        placeholder="Nama (huruf & angka)"
      />
      <p class="hint">Tanpa spasi atau simbol — hanya huruf dan angka.</p>
    </div>
    <div class="field">
      <label for="pw">Password</label>
      <PasswordField id="pw" bind:value={password} autocomplete="new-password" placeholder="Minimal 6 karakter" />
    </div>
    <button class="btn" disabled={loading}>
      {#if loading}<span class="spin"></span>{:else}Daftar{/if}
    </button>
    <p class="muted center" style="font-size:12px;margin:12px 0 0">
      Setelah daftar, akun harus disetujui admin sebelum bisa login.
    </p>
  </form>

  <p class="center muted" style="margin-top:18px">
    Sudah punya akun? <a href="/login">Masuk</a>
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
  @media (min-width: 768px) {
    .auth {
      background: transparent;
      min-height: auto;
      padding-top: 6vh;
    }
  }
  .brand {
    text-align: center;
    margin-bottom: 22px;
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
  .hint {
    font-size: 11px;
    color: var(--muted);
    margin: 6px 0 0;
  }
</style>
