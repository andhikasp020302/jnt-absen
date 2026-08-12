<script lang="ts">
  import { onDestroy } from 'svelte';
  import { captureSelfie, getPosition, nowLabels, type CaptureResult } from './camera';

  let {
    type,
    onclose,
    onsuccess
  }: {
    type: 'in' | 'out';
    onclose: () => void;
    onsuccess: (r: { location: string; distance: number; type: string }) => void;
  } = $props();

  let video: HTMLVideoElement;
  let stream: MediaStream | null = null;

  let phase = $state<'loading' | 'ready' | 'preview' | 'sending'>('loading');
  let err = $state('');
  let clock = $state(nowLabels());
  let pos = $state<{ lat: number; lng: number; acc: number } | null>(null);
  let shot = $state<{ url: string; result: CaptureResult } | null>(null);

  const clockTimer = setInterval(() => (clock = nowLabels()), 1000);

  async function start() {
    err = '';
    phase = 'loading';
    try {
      // Front camera only, modest resolution for speed + small files.
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
    } catch {
      err = 'Tidak bisa mengakses kamera. Izinkan akses kamera di pengaturan browser.';
      return;
    }
    try {
      const p = await getPosition();
      pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
      phase = 'ready';
    } catch {
      err = 'Tidak bisa membaca lokasi GPS. Aktifkan lokasi lalu coba lagi.';
    }
  }

  function stopCamera() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  async function snap() {
    if (!pos) return;
    const labels = nowLabels();
    const result = await captureSelfie(video, {
      time: labels.time,
      date: labels.date,
      lat: pos.lat,
      lng: pos.lng
    });
    if (shot) URL.revokeObjectURL(shot.url);
    shot = { url: URL.createObjectURL(result.full), result };
    phase = 'preview';
  }

  function retake() {
    if (shot) URL.revokeObjectURL(shot.url);
    shot = null;
    phase = 'ready';
  }

  async function send() {
    if (!shot || !pos) return;
    phase = 'sending';
    err = '';
    const fd = new FormData();
    fd.set('type', type);
    fd.set('lat', String(pos.lat));
    fd.set('lng', String(pos.lng));
    fd.set('ext', shot.result.ext);
    fd.set('photo', shot.result.full, `photo.${shot.result.ext}`);
    fd.set('thumb', shot.result.thumb, `thumb.${shot.result.ext}`);
    try {
      const res = await fetch('/api/attendance', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        err = data.message || 'Gagal mengirim absen';
        phase = 'preview';
        return;
      }
      stopCamera();
      onsuccess({ location: data.location, distance: data.distance, type });
    } catch {
      err = 'Gagal terhubung ke server. Coba lagi.';
      phase = 'preview';
    }
  }

  function close() {
    stopCamera();
    onclose();
  }

  onDestroy(() => {
    clearInterval(clockTimer);
    stopCamera();
    if (shot) URL.revokeObjectURL(shot.url);
  });

  $effect(() => {
    start();
  });

  const sizeKb = $derived(shot ? Math.round(shot.result.bytes / 1024) : 0);
</script>

<div class="cam">
  <div class="head">
    <button class="x" onclick={close} aria-label="Tutup">✕</button>
    <span>Absen {type === 'in' ? 'Masuk' : 'Pulang'}</span>
  </div>

  <div class="stage">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video bind:this={video} playsinline muted class:hidden={phase === 'preview' || phase === 'sending'}></video>
    {#if shot && (phase === 'preview' || phase === 'sending')}
      <img src={shot.url} alt="Hasil selfie" />
    {/if}

    {#if pos && phase !== 'loading'}
      <div class="stamp">
        <b>{clock.time}</b>
        <span>{clock.date}</span>
        <span>{pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}</span>
      </div>
    {/if}

    {#if phase === 'loading'}
      <div class="overlay"><span class="spin"></span><p>Menyiapkan kamera & lokasi…</p></div>
    {/if}
  </div>

  <div class="foot">
    {#if err}<div class="alert err">{err}</div>{/if}

    {#if phase === 'ready'}
      <p class="hint">Pastikan wajah terlihat jelas.</p>
      <button class="shutter" onclick={snap} aria-label="Ambil foto"></button>
    {:else if phase === 'preview'}
      <p class="hint">Ukuran foto: {sizeKb} KB · siap dikirim</p>
      <div class="row">
        <button class="btn ghost" onclick={retake}>Ulangi</button>
        <button class="btn" onclick={send}>Kirim Absen</button>
      </div>
    {:else if phase === 'sending'}
      <button class="btn" disabled><span class="spin"></span> Mengirim…</button>
    {:else if err}
      <button class="btn" onclick={start}>Coba Lagi</button>
    {/if}
  </div>
</div>

<style>
  .cam {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: #000;
    display: flex;
    flex-direction: column;
    color: #fff;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: calc(12px + var(--safe-top)) 16px 12px;
    font-weight: 600;
    background: rgba(0, 0, 0, 0.6);
  }
  .x {
    background: none;
    border: 0;
    color: #fff;
    font-size: 20px;
    line-height: 1;
  }
  .stage {
    position: relative;
    flex: 1;
    overflow: hidden;
    background: #000;
  }
  video,
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .hidden {
    display: none;
  }
  .stamp {
    position: absolute;
    left: 12px;
    bottom: 12px;
    background: rgba(0, 0, 0, 0.5);
    border-left: 4px solid #3ddc84;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    line-height: 1.35;
  }
  .stamp b {
    font-size: 17px;
  }
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.7);
  }
  .foot {
    padding: 16px 16px calc(20px + var(--safe-bottom));
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hint {
    text-align: center;
    margin: 0;
    font-size: 13px;
    opacity: 0.85;
  }
  .shutter {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    border: 5px solid #fff;
    background: #3ddc84;
    align-self: center;
  }
  .shutter:active {
    transform: scale(0.94);
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .row .btn.ghost {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.4);
  }
</style>
