<script lang="ts">
  import { goto } from '$app/navigation';
  let { data } = $props();
  let lightbox = $state<number | null>(null);

  function setScope(scope: string) {
    goto(`/admin?scope=${scope}`, { keepFocus: true });
  }
  function pickMonth(e: Event) {
    const m = (e.target as HTMLSelectElement).value;
    if (m) goto(`/admin?scope=pick&month=${m}`);
  }
  function pageHref(p: number) {
    return `?scope=${data.scope}${data.month ? `&month=${data.month}` : ''}&page=${p}`;
  }
</script>

<!-- ===================== MOBILE (tidak diubah) ===================== -->
<div class="pad only-mobile">
  <div class="tabs">
    <button class:active={data.scope === 'today'} onclick={() => setScope('today')}>Hari ini</button>
    <button class:active={data.scope === 'week'} onclick={() => setScope('week')}>Minggu ini</button>
    <button class:active={data.scope === 'month'} onclick={() => setScope('month')}>Bulan ini</button>
    <select onchange={pickMonth} value={data.scope === 'pick' ? data.month : ''}>
      <option value="" disabled>Pilih bulan…</option>
      {#each data.months as m}
        <option value={m}>{m}</option>
      {/each}
    </select>
  </div>

  <p class="muted sm" style="margin:12px 0 8px">Menampilkan: <b>{data.label}</b></p>

  {#if data.rows.length === 0}
    <p class="muted center" style="margin-top:40px">Tidak ada data absensi pada periode ini.</p>
  {:else}
    <div class="list">
      {#each data.rows as r (r.id)}
        <div class="item card">
          <button class="thumb" onclick={() => (lightbox = r.id)} aria-label="Lihat foto">
            <img src="/api/photo/{r.id}?size=thumb" alt="foto" loading="lazy" width="48" height="48" />
          </button>
          <div class="info">
            <div class="top">
              <b>{r.karyawan}</b>
              <span class="badge {r.type}">{r.type === 'in' ? 'Masuk' : 'Pulang'}</span>
            </div>
            <div class="muted sm">{r.tanggal} · {r.jam} · {r.lokasi ?? '-'} · ±{r.distance_m} m</div>
          </div>
        </div>
      {/each}
    </div>

    <div class="pager">
      {#if data.page > 1}<a class="btn ghost" href={pageHref(data.page - 1)}>← Sebelumnya</a>{/if}
      {#if data.hasNext}<a class="btn ghost" href={pageHref(data.page + 1)}>Berikutnya →</a>{/if}
    </div>
  {/if}
</div>

<!-- ===================== DESKTOP ===================== -->
<div class="pad only-desktop">
  <div class="page-head">
    <h2>Data Absensi</h2>
    <div class="filters">
      <div class="tabs">
        <button class:active={data.scope === 'today'} onclick={() => setScope('today')}>Hari ini</button>
        <button class:active={data.scope === 'week'} onclick={() => setScope('week')}>Minggu ini</button>
        <button class:active={data.scope === 'month'} onclick={() => setScope('month')}>Bulan ini</button>
      </div>
      <select onchange={pickMonth} value={data.scope === 'pick' ? data.month : ''}>
        <option value="" disabled>Pilih bulan…</option>
        {#each data.months as m}
          <option value={m}>{m}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="stats">
    <div class="stat-card"><div class="num">{data.summary.total}</div><div class="lbl">Total absensi · {data.label}</div></div>
    <div class="stat-card"><div class="num">{data.summary.masuk}</div><div class="lbl">Absen masuk</div></div>
    <div class="stat-card"><div class="num">{data.summary.pulang}</div><div class="lbl">Absen pulang</div></div>
    <div class="stat-card"><div class="num">{data.summary.karyawan}</div><div class="lbl">Karyawan aktif absen</div></div>
  </div>

  {#if data.rows.length === 0}
    <div class="card pad center muted">Tidak ada data absensi pada periode ini.</div>
  {:else}
    <div class="dtable-wrap">
      <table class="dtable">
        <thead>
          <tr>
            <th>Foto</th><th>Nama</th><th>Tipe</th><th>Tanggal</th><th>Jam</th><th>Lokasi</th><th>Jarak</th>
          </tr>
        </thead>
        <tbody>
          {#each data.rows as r (r.id)}
            <tr>
              <td>
                <button class="thumb-sm" onclick={() => (lightbox = r.id)} aria-label="Lihat foto">
                  <img src="/api/photo/{r.id}?size=thumb" alt="foto" loading="lazy" width="44" height="44" />
                </button>
              </td>
              <td><b>{r.karyawan}</b></td>
              <td><span class="badge {r.type}">{r.type === 'in' ? 'Masuk' : 'Pulang'}</span></td>
              <td>{r.tanggal}</td>
              <td>{r.jam}</td>
              <td>{r.lokasi ?? '-'}</td>
              <td>±{r.distance_m} m</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="pager">
      {#if data.page > 1}<a class="btn ghost" href={pageHref(data.page - 1)}>← Sebelumnya</a>{/if}
      {#if data.hasNext}<a class="btn ghost" href={pageHref(data.page + 1)}>Berikutnya →</a>{/if}
    </div>
  {/if}
</div>

{#if lightbox !== null}
  <button class="lb" onclick={() => (lightbox = null)} aria-label="Tutup foto">
    <img src="/api/photo/{lightbox}?size=full" alt="foto absensi" />
  </button>
{/if}

<style>
  /* --- mobile (dipakai blok .only-mobile) --- */
  .tabs select {
    flex: 0 0 auto;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--green-dark);
    background: var(--white);
  }
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
    gap: 12px;
    padding: 10px;
    align-items: center;
  }
  .thumb {
    border: 0;
    padding: 0;
    background: var(--green-light);
    border-radius: 10px;
    overflow: hidden;
    flex: 0 0 48px;
  }
  .thumb img {
    width: 48px;
    height: 48px;
    object-fit: cover;
    display: block;
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .top b {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pager {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 16px;
  }
  .pager .btn {
    width: auto;
    flex: 1;
    max-width: 220px;
  }
  /* --- desktop filters --- */
  .filters {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .filters select {
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--green-dark);
    background: var(--white);
  }
  .lb {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.9);
    border: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .lb img {
    max-width: 100%;
    max-height: 100%;
    border-radius: 10px;
  }
  @media (min-width: 880px) {
    .lb img {
      max-width: 520px;
    }
  }
</style>
