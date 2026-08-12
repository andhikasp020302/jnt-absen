<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import 'leaflet/dist/leaflet.css';
  import type * as LType from 'leaflet';

  let { data } = $props();

  let mapEl: HTMLDivElement;
  let L: typeof LType | null = null;
  let map: LType.Map | null = null;
  let existingLayer: LType.LayerGroup | null = null;

  // Titik area yang sedang dibuat (maks 4).
  let points = $state<{ lat: number; lng: number }[]>([]);
  let markers: LType.Marker[] = [];
  let workPoly: LType.Polygon | null = null;

  let name = $state('');
  let err = $state('');
  let saving = $state(false);
  let busy = $state<number | null>(null);

  // Pencarian tempat (untuk mengarahkan peta).
  let search = $state('');
  let results = $state<{ name: string; lat: number; lng: number }[]>([]);
  let searching = $state(false);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  const DEFAULT: [number, number] = [-2.5, 118];
  const DEFAULT_ZOOM = 5;
  const COLORS = ['#e8892b', '#0a8f3c', '#2b7de8', '#b02be8'];

  function numberIcon(i: number) {
    return L!.divIcon({
      className: 'pin-wrap',
      html: `<div class="pin" style="background:${COLORS[i] || '#e8892b'}">${i + 1}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  }

  function updatePoly() {
    if (!L || !map) return;
    if (workPoly) {
      workPoly.remove();
      workPoly = null;
    }
    if (points.length >= 2) {
      workPoly = L.polygon(
        points.map((p) => [p.lat, p.lng]) as [number, number][],
        { color: '#e8892b', weight: 2, fillOpacity: 0.15 }
      ).addTo(map);
    }
  }

  function addPoint(lat: number, lng: number) {
    if (!L || !map || points.length >= 4) return;
    const idx = points.length;
    points = [...points, { lat, lng }];
    const m = L.marker([lat, lng], { draggable: true, icon: numberIcon(idx) }).addTo(map);
    m.on('drag dragend', () => {
      const p = m.getLatLng();
      points[idx] = { lat: p.lat, lng: p.lng };
      updatePoly();
    });
    markers.push(m);
    updatePoly();
  }

  function resetPoints() {
    markers.forEach((m) => m.remove());
    markers = [];
    if (workPoly) {
      workPoly.remove();
      workPoly = null;
    }
    points = [];
  }

  function drawExisting() {
    if (!L || !map) return;
    existingLayer?.remove();
    existingLayer = L.layerGroup().addTo(map);
    for (const loc of data.locations) {
      const poly = loc.polygon as { lat: number; lng: number }[] | null;
      if (!poly || poly.length < 3) continue;
      L.polygon(poly.map((p) => [p.lat, p.lng]) as [number, number][], {
        color: loc.active ? '#0a8f3c' : '#9aa',
        weight: 2,
        fillOpacity: 0.18
      })
        .bindPopup(`<b>${loc.name}</b>`)
        .addTo(existingLayer);
    }
  }

  onMount(async () => {
    L = (await import('leaflet')).default as unknown as typeof LType;
    map = L.map(mapEl, { zoomControl: true }).setView(DEFAULT, DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    map.on('click', (e: LType.LeafletMouseEvent) => addPoint(e.latlng.lat, e.latlng.lng));
    drawExisting();

    // Zoom ke area pertama bila ada.
    const first = data.locations.find((l) => Array.isArray(l.polygon) && l.polygon.length >= 3);
    if (first) {
      const poly = first.polygon as { lat: number; lng: number }[];
      map.fitBounds(poly.map((p) => [p.lat, p.lng]) as [number, number][], { padding: [40, 40] });
    }
  });

  onDestroy(() => map?.remove());

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
    map?.setView([r.lat, r.lng], 18);
  }

  function useMyLocation() {
    err = '';
    navigator.geolocation?.getCurrentPosition(
      (p) => map?.setView([p.coords.latitude, p.coords.longitude], 18),
      () => (err = 'Tidak bisa membaca lokasi GPS.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function save() {
    err = '';
    if (!name.trim()) {
      err = 'Isi nama area terlebih dahulu.';
      return;
    }
    if (points.length !== 4) {
      err = `Tentukan 4 titik di peta (baru ${points.length}/4).`;
      return;
    }
    saving = true;
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, polygon: points })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        err = d.message || 'Gagal menyimpan';
        return;
      }
      name = '';
      resetPoints();
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
    Cari lokasi, lalu <b>ketuk peta 4 kali</b> membentuk area (titik 1→2→3→4). Karyawan hanya
    bisa absen di dalam area aktif.
  </p>

  <div class="lok-grid">
    <div class="lok-left">
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

      <div class="pointbar">
        <span class="cnt">Titik: <b>{points.length}/4</b></span>
        <button class="btn ghost sm-btn" type="button" onclick={resetPoints} disabled={points.length === 0}>
          Reset titik
        </button>
      </div>
    </div>

    <div class="lok-right">
      <div class="card pad">
        {#if err}<div class="alert err">{err}</div>{/if}
        <div class="field">
          <label for="nm">Nama area</label>
          <input id="nm" bind:value={name} placeholder="cth: Kantor JNT BGR031A" />
        </div>
        <button class="btn ghost" onclick={useMyLocation} type="button" style="margin-bottom:10px">
          📍 Arahkan ke lokasi saya
        </button>
        <button class="btn" onclick={save} disabled={saving}>
          {#if saving}<span class="spin"></span>{:else}Simpan Area (4 titik){/if}
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
                <div class="muted sm">{Array.isArray(loc.polygon) ? loc.polygon.length : 0} titik</div>
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
  </div>
</div>

<style>
  .map {
    height: 300px;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--line);
  }
  @media (min-width: 880px) {
    .lok-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 22px;
      align-items: start;
    }
    .lok-right :global(.card) {
      margin-top: 0 !important;
    }
  }
  .search {
    position: relative;
    margin-bottom: 10px;
    z-index: 1100;
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
    z-index: 1200;
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
  .pointbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
  }
  .cnt {
    font-size: 14px;
  }
  .sm-btn {
    width: auto;
    padding: 8px 14px;
    min-height: 0;
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
  :global(.pin) {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  }
</style>
