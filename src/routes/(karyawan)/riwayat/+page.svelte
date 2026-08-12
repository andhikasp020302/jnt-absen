<script lang="ts">
  let { data } = $props();
  let lightbox = $state<number | null>(null);
</script>

<div class="pad">
  <h2 style="font-size:17px;margin-bottom:14px">Riwayat Absensi</h2>

  {#if data.rows.length === 0}
    <p class="muted center" style="margin-top:40px">Belum ada data absensi.</p>
  {:else}
    <div class="list">
      {#each data.rows as r (r.id)}
        <div class="item card">
          <button class="thumb" onclick={() => (lightbox = r.id)} aria-label="Lihat foto">
            <img src="/api/photo/{r.id}?size=thumb" alt="foto" loading="lazy" width="52" height="52" />
          </button>
          <div class="info">
            <div class="top">
              <span class="badge {r.type}">{r.type === 'in' ? 'Masuk' : 'Pulang'}</span>
              <b>{r.jam}</b>
            </div>
            <div class="muted sm">{r.tanggal}</div>
            <div class="muted sm">{r.lokasi ?? '-'} · ±{r.distance_m} m</div>
          </div>
        </div>
      {/each}
    </div>

    <div class="pager">
      {#if data.page > 1}
        <a class="btn ghost" href="?page={data.page - 1}">← Sebelumnya</a>
      {/if}
      {#if data.hasNext}
        <a class="btn ghost" href="?page={data.page + 1}">Berikutnya →</a>
      {/if}
    </div>
  {/if}
</div>

{#if lightbox !== null}
  <button class="lb" onclick={() => (lightbox = null)} aria-label="Tutup foto">
    <img src="/api/photo/{lightbox}?size=full" alt="foto absensi" />
  </button>
{/if}

<style>
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
    flex: 0 0 52px;
  }
  .thumb img {
    width: 52px;
    height: 52px;
    object-fit: cover;
    display: block;
  }
  .info {
    flex: 1;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sm {
    font-size: 12px;
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
</style>
