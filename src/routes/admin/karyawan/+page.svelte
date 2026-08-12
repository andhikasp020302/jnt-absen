<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  let { data } = $props();
  let busy = $state<number | null>(null);

  async function act(id: number, action: 'approve' | 'reject' | 'activate' | 'deactivate') {
    busy = id;
    await fetch(`/api/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    await invalidateAll();
    busy = null;
  }

  async function changePassword(id: number, name: string) {
    const pw = prompt(`Password baru untuk "${name}" (min. 6 karakter):`);
    if (pw === null) return;
    if (pw.length < 6) {
      alert('Password minimal 6 karakter.');
      return;
    }
    busy = id;
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    busy = null;
    alert(res.ok ? `Password "${name}" berhasil diganti.` : 'Gagal mengganti password.');
  }

  async function remove(id: number, name: string) {
    if (!confirm(`Hapus karyawan "${name}" beserta seluruh absensinya?`)) return;
    busy = id;
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    await invalidateAll();
    busy = null;
  }

  const pending = $derived(data.users.filter((u) => u.status === 'pending'));
  const others = $derived(data.users.filter((u) => u.status !== 'pending'));
</script>

<div class="pad">
  <h2 style="font-size:17px;margin-bottom:6px">Karyawan</h2>

  {#if pending.length > 0}
    <p class="muted sm" style="margin:14px 0 8px">Menunggu persetujuan ({pending.length})</p>
    <div class="list">
      {#each pending as u (u.id)}
        <div class="item card">
          <div class="info">
            <b>{u.name}</b>
            <div class="muted sm">Daftar: {u.tanggal}</div>
          </div>
          <div class="acts">
            <button class="mini ok" disabled={busy === u.id} onclick={() => act(u.id, 'approve')}>Setujui</button>
            <button class="mini no" disabled={busy === u.id} onclick={() => act(u.id, 'reject')}>Tolak</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <p class="muted sm" style="margin:18px 0 8px">Semua karyawan ({others.length})</p>
  {#if others.length === 0}
    <p class="muted center" style="margin-top:20px">Belum ada karyawan.</p>
  {:else}
    <div class="list">
      {#each others as u (u.id)}
        <div class="item card col">
          <div class="row-top">
            <b>{u.name}</b>
            <span class="badge {u.status === 'approved' ? 'approved' : 'rejected'}">
              {u.status === 'approved' ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <div class="muted sm">Daftar: {u.tanggal}</div>
          <div class="acts wrap">
            <button class="mini pw" disabled={busy === u.id} onclick={() => changePassword(u.id, u.name)}>
              Ganti Password
            </button>
            {#if u.status === 'approved'}
              <button class="mini no" disabled={busy === u.id} onclick={() => act(u.id, 'deactivate')}>
                Nonaktifkan
              </button>
            {:else}
              <button class="mini ok" disabled={busy === u.id} onclick={() => act(u.id, 'activate')}>
                Aktifkan
              </button>
            {/if}
            <button class="mini del" disabled={busy === u.id} onclick={() => remove(u.id, u.name)}>
              Hapus
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sm {
    font-size: 12px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .item {
    display: flex;
    gap: 10px;
    padding: 12px;
    align-items: center;
  }
  .item.col {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  .row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .acts {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .acts.wrap {
    flex-wrap: wrap;
    margin-top: 2px;
  }
  .mini {
    border: 0;
    border-radius: 9px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
  }
  .mini.ok {
    background: var(--green);
    color: #fff;
  }
  .mini.no {
    background: #fff0e0;
    color: #c05a10;
  }
  .mini.pw {
    background: var(--green-light);
    color: var(--green-dark);
  }
  .mini.del {
    background: #ffe6e6;
    color: var(--danger);
  }
</style>
