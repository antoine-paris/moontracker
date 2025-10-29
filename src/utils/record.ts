import { toCanvas } from 'html-to-image';
import WebMWriter from 'webm-writer';

export type RecorderMode = 'realtime' | 'frame-locked';

export type CanvasRecorderHandle = {
  kind: 'canvas';
  stop: () => Promise<Blob>;
  mediaRecorder: MediaRecorder;
  mimeType: string;
  mode: RecorderMode;
  requestFrame: () => void;
  pause: () => void;
  resume: () => void;
};

type CanvasTrack = MediaStreamTrack & { requestFrame?: () => void };

export function startCanvasRecorder(
  canvas: HTMLCanvasElement,
  opts?: { mode?: RecorderMode; fps?: number; mimeType?: string; bitsPerSecond?: number }
): CanvasRecorderHandle {
  const mode = opts?.mode ?? 'realtime';
  const fps = Math.max(1, Math.round(opts?.fps ?? 30));
  const stream = mode === 'frame-locked' ? canvas.captureStream() : canvas.captureStream(fps);
  const track = (stream.getVideoTracks()[0] as CanvasTrack) ?? null;

  const candidates = [
    opts?.mimeType,
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ].filter(Boolean) as string[];
  const mimeType =
    candidates.find(t => (window as any).MediaRecorder?.isTypeSupported?.(t)) ?? 'video/webm';

  const mr = new MediaRecorder(stream, {
    mimeType,
    bitsPerSecond: opts?.bitsPerSecond ?? 5_000_000,
  });

  const chunks: BlobPart[] = [];
  mr.ondataavailable = (e: BlobEvent) => { if (e.data && e.data.size) chunks.push(e.data); };

  const stop = () =>
    new Promise<Blob>(resolve => {
      mr.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      if (mr.state !== 'inactive') mr.stop();
    });

  const requestFrame = () => { try { track?.requestFrame?.(); } catch {} };
  const pause = () => { try { mr.pause?.(); } catch {} };
  const resume = () => { try { mr.resume?.(); } catch {} };

  mr.start();
  return { kind: 'canvas', stop, mediaRecorder: mr, mimeType, mode, requestFrame, pause, resume };
}

// --- DOM snapshot recorder (matches PNG/JPEG capture of a node) ---------------
export type DomRecorderHandle = {
  kind: 'dom-snapshot';
  stop: () => Promise<Blob>;
  mediaRecorder: MediaRecorder;
  mimeType: string;
  mode: RecorderMode;
  canvas: HTMLCanvasElement;
  renderOnce: () => Promise<void>;
  pause: () => void;
  resume: () => void;
};

export async function startDomSnapshotRecorder(
  node: HTMLElement,
  opts?: {
    mode?: RecorderMode;            // 'realtime' | 'frame-locked'
    fps?: number;                   // realtime target fps (default 20)
    pixelRatio?: number;            // snapshot pixel ratio (default min(2, dpr))
    backgroundColor?: string;       // default '#000'
    bitsPerSecond?: number;         // encoder bitrate
    mimeType?: string;              // webm codec hint
  }
): Promise<DomRecorderHandle> {
  const mode = opts?.mode ?? 'realtime';
  const fps = Math.max(1, Math.round(opts?.fps ?? 20));
  const dpr = Math.max(1, Math.min(2, Math.round((opts?.pixelRatio ?? (window.devicePixelRatio || 1)) * 100) / 100));
  const bg = opts?.backgroundColor ?? '#000';

  const rect = node.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));

  // Output canvas (what we record)
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(cssW * dpr));
  out.height = Math.max(1, Math.round(cssH * dpr));
  out.style.width = `${cssW}px`;
  out.style.height = `${cssH}px`;

  const ctx = out.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  // MediaRecorder from the output canvas
  const stream = out.captureStream(); // manual frames via renderOnce() => requestFrame()
  const track = (stream.getVideoTracks()[0] as CanvasTrack) ?? null;

  const candidates = [
    opts?.mimeType,
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ].filter(Boolean) as string[];
  const mimeType =
    candidates.find(t => (window as any).MediaRecorder?.isTypeSupported?.(t)) ?? 'video/webm';

  const mr = new MediaRecorder(stream, {
    mimeType,
    bitsPerSecond: opts?.bitsPerSecond ?? 5_000_000,
  });

  const chunks: BlobPart[] = [];
  mr.ondataavailable = (e: BlobEvent) => { if (e.data && e.data.size) chunks.push(e.data); };

  let running = true;
  let paused = false;
  let rendering = false;
  let timer: number | null = null;

  const renderOnce = async () => {
    if (!running || paused || rendering) return;
    rendering = true;
    try {
      // Rasterize the same DOM subtree as PNG/JPEG capture
      const snap = await toCanvas(node, { pixelRatio: dpr, backgroundColor: bg } as any);
      // Clear and draw snapshot into output canvas
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.drawImage(snap, 0, 0, snap.width, snap.height, 0, 0, cssW, cssH);
      try { track?.requestFrame?.(); } catch {}
    } catch {
      // ignore snapshot failures
    } finally {
      rendering = false;
    }
  };

  const startRealtimeLoop = () => {
    if (mode !== 'realtime') return;
    const period = Math.max(10, Math.round(1000 / fps));
    timer = window.setInterval(() => { void renderOnce(); }, period);
  };

  const stop = () =>
    new Promise<Blob>(resolve => {
      running = false;
      if (timer != null) { clearInterval(timer); timer = null; }
      mr.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      if (mr.state !== 'inactive') mr.stop();
    });

  const pause = () => { paused = true; try { mr.pause?.(); } catch {} };
  const resume = () => { paused = false; try { mr.resume?.(); } catch {} };

  mr.start();
  startRealtimeLoop();

  return { kind: 'dom-snapshot', stop, mediaRecorder: mr, mimeType, mode, canvas: out, renderOnce, pause, resume };
}

// --- DOM CFR recorder (constant frame rate, uses WebMWriter) ------------------
export type DomCfrRecorderHandle = {
  kind: 'dom-cfr';
  stop: () => Promise<Blob>;
  mimeType: string;
  fps: number;
  canvas: HTMLCanvasElement;
  captureNext: () => Promise<void>;
};

export async function startDomCfrRecorder(
  node: HTMLElement,
  opts?: {
    fps?: number;                   // playback fps (CFR)
    pixelRatio?: number;            // default min(2, dpr)
    backgroundColor?: string;       // default '#000'
    quality?: number;               // 0..1 (default 0.95)
  }
): Promise<DomCfrRecorderHandle> {
  const fps = Math.max(1, Math.round(opts?.fps ?? 24));
  const dpr = Math.max(1, Math.min(2, Math.round((opts?.pixelRatio ?? (window.devicePixelRatio || 1)) * 100) / 100));
  const bg = opts?.backgroundColor ?? '#000';
  const quality = Math.max(0.1, Math.min(1, opts?.quality ?? 0.95));

  const rect = node.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));

  // Output canvas (fixed size)
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(cssW * dpr));
  out.height = Math.max(1, Math.round(cssH * dpr));
  out.style.width = `${cssW}px`;
  out.style.height = `${cssH}px`;

  const ctx = out.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  // CFR WebM writer
  const writer = new WebMWriter({ frameRate: fps, quality, transparent: false });

  const captureNext = async () => {
    // Rasterize the same DOM subtree as PNG/JPEG capture
    const snap = await toCanvas(node, { pixelRatio: dpr, backgroundColor: bg } as any);
    // Clear and draw snapshot into output canvas (resample if needed)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.drawImage(snap, 0, 0, snap.width, snap.height, 0, 0, cssW, cssH);

    // Add one frame (CFR): writer assigns constant duration = 1/fps
    await writer.addFrame(out);
  };

  const stop = async () => {
    return await writer.complete(); // Blob "video/webm"
  };

  return { kind: 'dom-cfr', stop, mimeType: 'video/webm', fps, canvas: out, captureNext };
}