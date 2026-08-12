// Client-side selfie capture + resize + compression.
// Flow: video frame -> canvas (resize) -> burn timestamp/location overlay ->
// encode WebP (fallback JPEG) targeting a small file size + a thumbnail.
// All native browser APIs, zero dependencies.

const FULL_MAX_W = 720; // selfie is plenty at 720px wide
const THUMB_MAX_W = 160;
const TARGET_MAX_BYTES = 300 * 1024; // upper bound; usually far smaller
const MIN_QUALITY = 0.45;

let _webp: boolean | null = null;
export function supportsWebp(): boolean {
  if (_webp !== null) return _webp;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    _webp = c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    _webp = false;
  }
  return _webp;
}

export interface OverlayInfo {
  time: string; // e.g. "12:03:45"
  date: string; // e.g. "Sel, 12 Agu 2026"
  lat: number;
  lng: number;
}

export interface CaptureResult {
  full: Blob;
  thumb: Blob;
  ext: 'webp' | 'jpg';
  bytes: number;
}

function drawScaled(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  maxW: number
): HTMLCanvasElement {
  const scale = Math.min(1, maxW / srcW);
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

function drawOverlay(canvas: HTMLCanvasElement, info: OverlayInfo) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const pad = Math.round(W * 0.03);
  const fs = Math.max(11, Math.round(W * 0.032));
  const lines = [
    info.time,
    info.date,
    `${info.lat.toFixed(6)}, ${info.lng.toFixed(6)}`
  ];
  ctx.font = `600 ${fs}px system-ui, sans-serif`;
  ctx.textBaseline = 'top';

  const lineH = Math.round(fs * 1.35);
  const boxW = Math.max(...lines.map((l) => ctx.measureText(l).width)) + pad * 2;
  const boxH = lineH * lines.length + pad * 1.4;
  const x = pad;
  const y = canvas.height - boxH - pad;

  // translucent dark plate for legibility over any background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  const r = 8;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + boxW, y, x + boxW, y + boxH, r);
  ctx.arcTo(x + boxW, y + boxH, x, y + boxH, r);
  ctx.arcTo(x, y + boxH, x, y, r);
  ctx.arcTo(x, y, x + boxW, y, r);
  ctx.fill();

  // green accent bar
  ctx.fillStyle = '#3ddc84';
  ctx.fillRect(x, y, 4, boxH);

  ctx.fillStyle = '#fff';
  lines.forEach((l, i) => {
    ctx.fillText(l, x + pad, y + pad * 0.7 + i * lineH);
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), type, q);
  });
}

async function encodeUnder(
  canvas: HTMLCanvasElement,
  type: string,
  maxBytes: number
): Promise<Blob> {
  let q = 0.72;
  let blob = await toBlob(canvas, type, q);
  while (blob.size > maxBytes && q > MIN_QUALITY) {
    q -= 0.1;
    blob = await toBlob(canvas, type, q);
  }
  return blob;
}

export async function captureSelfie(
  video: HTMLVideoElement,
  info: OverlayInfo
): Promise<CaptureResult> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const type = supportsWebp() ? 'image/webp' : 'image/jpeg';
  const ext = type === 'image/webp' ? 'webp' : 'jpg';

  const full = drawScaled(video, vw, vh, FULL_MAX_W);
  drawOverlay(full, info);
  const fullBlob = await encodeUnder(full, type, TARGET_MAX_BYTES);

  const thumb = drawScaled(video, vw, vh, THUMB_MAX_W);
  const thumbBlob = await toBlob(thumb, type, 0.55);

  return { full: fullBlob, thumb: thumbBlob, ext, bytes: fullBlob.size };
}

export function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS tidak didukung perangkat ini'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  });
}

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function nowLabels(d = new Date()): { time: string; date: string } {
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    time: `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
    date: `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  };
}
