<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import 'leaflet/dist/leaflet.css';
  import type * as LType from 'leaflet';

  let { data } = $props();

  let mapEl: HTMLDivElement;
  let L: typeof LType | null = null;
  let map: LType.Map | null = null;
  let newMarker: LType.Marker | null = null;
  let newCircle: LType.Circle | null = null;
  let existingLayer: LType.LayerGroup | null = null;

  let name = $state('');
  let lat = $state('');
  let lng = $state('');
  let radius = $state(100);
  let err = $state('');
  let saving = $state(false);
  let busy = $state<number | null>(null);

  // Default: tampilkan seluruh Indonesia agar admin bisa mencari & zoom sendiri.
  const DEFAULT: [number, number] = [-2.5, 118];
  const DEFAULT_ZOOM = 5;

  // Pencarian tempat (Nominatim via /api/geocode).
  let search = $state('');
  let results = $state<{ name: string; lat: number; lng: number }[]>([]);
  let searching = $state(false);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  function onSearchInput() {
    clearTimeout(searchTimer);
    if (search.trim().length < 3) {
      results = [];
      return;
    }
    searchTimer = setTimeout(doSearch, 400);
  }
  async function doSearch() {
    searching = true;
    try {
      const res = await fetch('/api/geocode?q=' + encodeURIComponent(search.trim()));
      const d = await res.json().catch(() => ({ results: [] }));
      results = d.results || [];
    } finally {
      searching = false;
    }
  }
  function chooseResult(r: { name: string; lat: number; lng: number }) {
    results = [];
    search = r.name.split(',')[0];
    map?.setView([r.lat, r.lng], 17);
    placePoint(r.lat, r.lng);
  }

  function placePoint(la: number, ln: number) {
    lat = la.toFixed(6);
    lng = ln.toFixed(6);
    if (!L || !map) return;
    if (!newMarker) {
      newMarker = L.marker([la, ln], { draggable: true }).addTo(map);
      newMarker.on('dragend', () => {
        const p = newMarker!.getLatLng();
        placePoint(p.lat, p.lng);
      });
      newCircle = L.circle([la, ln], { radius, color: '#e8892b', fillOpacity: 0.12 }).addTo(map);
    } else {
      newMarker.setLatLng([la, ln]);
      newCircle!.setLatLng([la, ln]);
    }
  }

  function drawExisting() {
    if (!L || !map) return;
    existingLayer?.remove();
    existingLayer = L.layerGroup().addTo(map);
    for (const loc of data.locations) {
      L.circle([loc.lat, loc.lng], {
        radius: loc.radius_m,
        color: loc.active ? '#0a8f3c' : '#9aa',
        fillOpacity: 0.15
      })
        .bindPopup(`<b>${loc.name}</b><br>±${loc.radius_m} m`)
        .addTo(existingLayer);
    }
  }

  onMount(async () => {
    L = (await import('leaflet')).default as unknown as typeof LType;
    const first = data.locations[0];
    const center: [number, number] = first ? [first.lat, first.lng] : DEFAULT;
    map = L.map(mapEl, { zoomControl: true }).setView(center, first ? 16 : DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    map.on('click', (e: LType.LeafletMouseEvent) => placePoint(e.latlng.lat, e.latlng.lng));
    drawExisting();
  });

  onDestroy(() => map?.remove());

  // Keep the pending circle radius in sync with the input.
  $effect(() => {
    if (newCircle) newCircle.setRadius(radius);
  });

  function useMyLocation() {
    err = '';
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        placePoint(p.coords.latitude, p.coords.longitude);
        map?.setView([p.coords.latitude, p.coords.longitude], 17);
      },
      () => (err = 'Tidak bisa membaca lokasi GPS.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function save() {
    err = '';
    if (!name.trim() || !lat || !lng) {
      err = 'Isi nama dan pilih titik di peta terlebih dahulu.';
      return;
    }
    saving = true;
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lat, lng, radius_m: radius })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        err = d.message || 'Gagal menyimpan';
        return;
      }
      name = '';
      newMarker?.remove();
      newCircle?.remove();
      newMarker = null;
      newCircle = null;
      lat = '';
      lng = '';
      await invalidateAll();
      drawExisting();
    } finally {
      saving = false;
    }
  }

  async function toggle(id: number, active: boolean) {
    busy = id;
    await fetch(`/api/locations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    await invalidateAll();
    drawExisting();
    busy = null;
  }

  async function remove(id: number, nm: string) {
    if (!confirm(`Hapus area "${nm}"?`)) return;
    busy = id;
    await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    await invalidateAll();
    drawExisting();
    busy = null;
  }
</script>

<div class="pad">
  <h2 style="font-size:17px;margin-bottom:4px">Area Absensi</h2>
  <p class="muted sm" style="margin:0 0 12px">
    Ketuk peta untuk memilih titik. Karyawan hanya bisa absen di dalam radius area aktif.
  </p>

  <div class="search">
    <input
      placeholder="🔍 Cari tempat / alamat (mis: JNT Bogor, Jl. ...)"
      bind:value={search}
      oninput={onSearchInput}
    />
    {#if searching}<span class="spin dark"></span>{/if}
    {#if results.length}
      <ul class="results">
        {#each results as r}
          <li><button type="button" onclick={() => chooseResult(r)}>{r.name}</button></li>
        {/each}
      </ul>
    {/if}
  </div>

  <div bind:this={mapEl} class="map"></div>

  <div class="card pad" style="margin-top:14px">
    {#if err}<div class="alert err">{err}</div>{/if}
    <div class="field">
      <label for="nm">Nama area</label>
      <input id="nm" bind:value={name} placeholder="cth: Kantor JNT BGR031A" />
    </div>
    <div class="grid2">
      <div class="field">
        <label for="la">Latitude</label>
        <input id="la" bind:value={lat} readonly placeholder="ketuk peta" />
      </div>
      <div class="field">
        <label for="ln">Longitude</label>
        <input id="ln" bind:value={lng} readonly placeholder="ketuk peta" />
      </div>
    </div>
    <div class="field">
      <label for="rad">Radius: {radius} meter</label>
      <input id="rad" type="range" min="20" max="500" step="10" bind:value={radius} />
    </div>
    <button class="btn ghost" onclick={useMyLocation} type="button" style="margin-bottom:10px">
      📍 Gunakan lokasi saya
    </button>
    <button class="btn" onclick={save} disabled={saving}>
      {#if saving}<span class="spin"></span>{:else}Simpan Area{/if}
    </button>
  </div>

  <p class="muted sm" style="margin:18px 0 8px">Daftar area ({data.locations.length})</p>
  {#if data.locations.length === 0}
    <p class="muted center" style="margin-top:16px">Belum ada area absensi.</p>
  {:else}
    <div class="list">
      {#each data.locations as loc (loc.id)}
        <div class="item card">
          <div class="info">
            <b>{loc.name}</b>
            <div class="muted sm">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} · ±{loc.radius_m} m</div>
          </div>
          <div class="acts">
            <button
              class="mini {loc.active ? 'on' : 'off'}"
              disabled={busy === loc.id}
              onclick={() => toggle(loc.id, !loc.active)}
            >
              {loc.active ? 'Aktif' : 'Nonaktif'}
            </button>
            <button class="mini del" disabled={busy === loc.id} onclick={() => remove(loc.id, loc.name)} aria-label="Hapus">🗑</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .map {
    height: 260px;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--line);
  }
  .search {
    position: relative;
    margin-bottom: 10px;
  }
  .search input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    outline: none;
  }
  .search input:focus {
    border-color: var(--green);
  }
  .search .spin.dark {
    position: absolute;
    right: 12px;
    top: 12px;
    border-color: var(--line);
    border-top-color: var(--green);
  }
  .results {
    list-style: none;
    margin: 6px 0 0;
    padding: 6px;
    position: absolute;
    z-index: 500;
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: var(--shadow);
    max-height: 240px;
    overflow-y: auto;
  }
  .results li button {
    width: 100%;
    text-align: left;
    border: 0;
    background: none;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.35;
    color: var(--ink);
  }
  .results li button:active {
    background: var(--green-light);
  }
  .sm {
    font-size: 12px;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--green);
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
  .info {
    flex: 1;
    min-width: 0;
  }
  .acts {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .mini {
    border: 0;
    border-radius: 9px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
  }
  .mini.on {
    background: var(--green-light);
    color: var(--green-dark);
  }
  .mini.off {
    background: #eee;
    color: #888;
  }
  .mini.del {
    background: transparent;
    padding: 8px;
  }
</style>
