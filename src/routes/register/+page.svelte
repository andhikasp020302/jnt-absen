<script lang="ts">
  let name = $state('');
  let password = $state('');
  let password2 = $state('');
  let err = $state('');
  let ok = $state('');
  let loading = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    err = '';
    ok = '';
    if (password !== password2) {
      err = 'Konfirmasi password tidak sama';
      return;
    }
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
      password2 = '';
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
      <input id="name" bind:value={name} autocomplete="username" required placeholder="Nama lengkap" />
    </div>
    <div class="field">
      <label for="pw">Password</label>
      <input id="pw" type="password" bind:value={password} required placeholder="Minimal 6 karakter" />
    </div>
    <div class="field">
      <label for="pw2">Ulangi Password</label>
      <input id="pw2" type="password" bind:value={password2} required placeholder="Ulangi password" />
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
    padding-top: calc(48px + var(--safe-top));
  }
  .brand {
    text-align: center;
    margin-bottom: 22px;
  }
  .logo {
    width: 72px;
    height: 72px;
    margin: 0 auto 14px;
    border-radius: 20px;
    background: var(--green);
    color: #fff;
    font-weight: 800;
    font-size: 26px;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
  }
  .brand h1 {
    font-size: 20px;
  }
</style>
