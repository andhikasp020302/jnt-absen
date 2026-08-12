<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Camera from '$lib/Camera.svelte';
  import { nowLabels } from '$lib/camera';

  let { data } = $props();

  let camType = $state<'in' | 'out' | null>(null);
  let toast = $state('');
  const today = nowLabels();

  function open(t: 'in' | 'out') {
    toast = '';
    camType = t;
  }

  async function onsuccess(r: { location: string; distance: number; type: string }) {
    camType = null;
    toast = `Absen ${r.type === 'in' ? 'masuk' : 'pulang'} berhasil di ${r.location} (±${r.distance} m).`;
    await invalidateAll();
  }
</script>

<div class="pad">
  <div class="hero card">
    <div class="date">{today.date}</div>
    <div class="statuses">
      <div class="stat">
        <span class="lbl">Masuk</span>
        <span class="val" class:on={data.masuk}>{data.masuk ?? '--:--'}</span>
      </div>
      <div class="divider"></div>
      <div class="stat">
        <span class="lbl">Pulang</span>
        <span class="val" class:on={data.pulang}>{data.pulang ?? '--:--'}</span>
      </div>
    </div>
  </div>

  {#if toast}<div class="alert ok" style="margin-top:16px">{toast}</div>{/if}

  <div class="actions">
    <button class="big in" onclick={() => open('in')} disabled={!!data.masuk}>
      <span class="ico">↧</span>
      <span>{data.masuk ? 'Sudah Absen Masuk' : 'Absen Masuk'}</span>
    </button>
    <button class="big out" onclick={() => open('out')} disabled={!data.masuk}>
      <span class="ico">↥</span>
      <span>Absen Pulang</span>
    </button>
  </div>

  <p class="muted center note">
    Foto selfie wajib. Absen hanya bisa dilakukan di dalam area kantor yang ditentukan.
  </p>
</div>

{#if camType}
  <Camera type={camType} onclose={() => (camType = null)} {onsuccess} />
{/if}

<style>
  .hero {
    padding: 20px;
    text-align: center;
  }
  .date {
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 14px;
  }
  .statuses {
    display: flex;
    align-items: center;
  }
  .stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lbl {
    font-size: 12px;
    color: var(--muted);
  }
  .val {
    font-size: 26px;
    font-weight: 700;
    color: var(--line);
  }
  .val.on {
    color: var(--green-dark);
  }
  .divider {
    width: 1px;
    height: 40px;
    background: var(--line);
  }
  .actions {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .big {
    border: 0;
    border-radius: 18px;
    padding: 22px;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow);
  }
  .big .ico {
    font-size: 24px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.22);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .big.in {
    background: var(--green);
  }
  .big.out {
    background: #e8892b;
  }
  .big:active {
    transform: scale(0.99);
  }
  .big:disabled {
    opacity: 0.5;
  }
  .note {
    margin-top: 20px;
    font-size: 12px;
  }
</style>
