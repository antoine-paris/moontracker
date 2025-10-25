import { toPng, toJpeg } from 'html-to-image';

// --- PNG metadata helpers (tEXt / iTXt) --------------------------------------
const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function isPng(u8: Uint8Array): boolean {
  if (u8.length < 8) return false;
  for (let i = 0; i < 8; i++) if (u8[i] !== PNG_SIG[i]) return false;
  return true;
}

function be32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = (n >>> 24) & 0xff;
  b[1] = (n >>> 16) & 0xff;
  b[2] = (n >>> 8) & 0xff;
  b[3] = n & 0xff;
  return b;
}

let CRC_TABLE: number[] | null = null;
function crc32(bytes: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE![(c ^ bytes[i]) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const lenBytes = be32(data.length);
  const crcIn = new Uint8Array(typeBytes.length + data.length);
  crcIn.set(typeBytes, 0);
  crcIn.set(data, typeBytes.length);
  const crc = be32(crc32(crcIn));
  const out = new Uint8Array(4 + 4 + data.length + 4);
  out.set(lenBytes, 0);
  out.set(typeBytes, 4);
  out.set(data, 8);
  out.set(crc, 8 + data.length);
  return out;
}

// iTXt: keyword(utf8) 00 compFlag(0) compMethod(0) 00(lang) 00(translated) text(utf8)
function makeITXt(keyword: string, textUtf8: string): Uint8Array {
  const te = new TextEncoder();
  const kw = te.encode(keyword);
  const text = te.encode(textUtf8);
  const payload = new Uint8Array(kw.length + 1 + 1 + 1 + 1 + text.length);
  let p = 0;
  payload.set(kw, p); p += kw.length;
  payload[p++] = 0; // NUL
  payload[p++] = 0; // compression flag = 0 (uncompressed)
  payload[p++] = 0; // compression method = 0
  payload[p++] = 0; // language tag = "" + NUL
  // translated keyword = "" + NUL
  const payload2 = new Uint8Array(payload.length + 1);
  payload2.set(payload.subarray(0, p), 0);
  payload2[p++] = 0; // translated keyword = "" + NUL
  payload2.set(text, p);
  return makeChunk('iTXt', payload2);
}

// tEXt: keyword(latin-1) 00 text(latin-1). Use ASCII-safe values only.
function makeTEXt(keyword: string, value: string): Uint8Array {
  const te = new TextEncoder();
  const asciiValue = value.replace(/[^\x20-\x7E]/g, '?');
  const asciiKey = keyword.replace(/[^\x20-\x7E]/g, '?');
  const kw = te.encode(asciiKey);
  const val = te.encode(asciiValue);
  const payload = new Uint8Array(kw.length + 1 + val.length);
  payload.set(kw, 0);
  payload[kw.length] = 0;
  payload.set(val, kw.length + 1);
  return makeChunk('tEXt', payload);
}

function insertChunksAfterIHDR(png: Uint8Array, chunks: Uint8Array[]): Uint8Array {
  // Find end of IHDR chunk
  let i = 8; // after signature
  while (i + 8 <= png.length) {
    const len = (png[i] << 24) | (png[i + 1] << 16) | (png[i + 2] << 8) | png[i + 3];
    const type = String.fromCharCode(png[i + 4], png[i + 5], png[i + 6], png[i + 7]);
    const end = i + 12 + len;
    if (type === 'IHDR') {
      const before = png.subarray(0, end);
      const after = png.subarray(end);
      const extraLen = chunks.reduce((s, c) => s + c.length, 0);
      const out = new Uint8Array(before.length + extraLen + after.length);
      out.set(before, 0);
      let p = before.length;
      for (const c of chunks) { out.set(c, p); p += c.length; }
      out.set(after, p);
      return out;
    }
    i = end;
  }
  return png; // fallback: unchanged
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(',')[1] || '';
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function uint8ToDataUrl(u8: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return 'data:image/png;base64,' + btoa(bin);
}

// --- NEW: JPEG data URL encoder ----------------------------------------------
function uint8ToJpegDataUrl(u8: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return 'data:image/jpeg;base64,' + btoa(bin);
}

// --- EXIF builder (TIFF little-endian) ---------------------------------------
function asciiSafe(s: string): string {
  return s.replace(/[^\x20-\x7E]/g, '?');
}

function fmtExifDateTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${d.getUTCFullYear()}:${pad(d.getUTCMonth() + 1)}:${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

class ByteWriter {
  private bytes: number[] = [];
  tell(): number { return this.bytes.length; }
  writeU8(v: number) { this.bytes.push(v & 0xFF); }
  writeU16LE(v: number) { this.writeU8(v & 0xFF); this.writeU8((v >> 8) & 0xFF); }
  writeU32LE(v: number) { this.writeU16LE(v & 0xFFFF); this.writeU16LE((v >>> 16) & 0xFFFF); }
  writeBytes(arr: Uint8Array) { for (let i = 0; i < arr.length; i++) this.writeU8(arr[i]); }
  finalize(): Uint8Array { return new Uint8Array(this.bytes); }
}

type ExifPatch = { at: number; value: number };
type DataPatch = { at: number; bytes: Uint8Array };

// Builds minimal EXIF: IFD0(Software, Make, Model, DateTime, ExifIFDPointer[, ImageDescription]) + ExifIFD(DateTimeOriginal, UserComment)
function makeExifTiff(meta?: PngMeta): Uint8Array | null {
  try {
    const w = new ByteWriter();
    // Header
    w.writeU8(0x49); w.writeU8(0x49); w.writeU16LE(0x2A); w.writeU32LE(8);

    const patches: ExifPatch[] = [];
    const dataPatches: DataPatch[] = [];

    const whenMs = Number.isFinite(meta?.whenMs) ? (meta!.whenMs as number) : Date.now();
    const dt = fmtExifDateTime(whenMs);
    const makeStr = 'MoonTracker';
    const modelStr = asciiSafe(`Simulation ${meta?.deviceLabel || 'Simulation'}`);
    const urlStr = meta?.exportUrl ? asciiSafe(meta.exportUrl) : '';
    const software = asciiSafe(`MoonTracker — ${(meta?.siteUrl || (typeof window !== 'undefined' ? window.location.origin : ''))}`);

    const userCommentObj = {
      site: meta?.siteUrl,
      city: meta?.city,
      lat: Number.isFinite(meta?.lat) ? meta?.lat : undefined,
      lng: Number.isFinite(meta?.lng) ? meta?.lng : undefined,
      altDeg: Number.isFinite(meta?.altDeg) ? meta?.altDeg : undefined,
      azDeg: Number.isFinite(meta?.azDeg) ? meta?.azDeg : undefined,
      when: new Date(whenMs).toISOString(),
      device: meta?.deviceLabel,
      projection: meta?.projection,
      fovDeg: (Number.isFinite(meta?.fovXDeg) && Number.isFinite(meta?.fovYDeg)) ? { x: meta?.fovXDeg, y: meta?.fovYDeg } : undefined,
      exportUrl: meta?.exportUrl,
    };
    const userCommentAscii = asciiSafe(JSON.stringify(userCommentObj));
    const userCommentBytes = new Uint8Array(8 + userCommentAscii.length + 1);
    userCommentBytes.set([0x41,0x53,0x43,0x49,0x49,0x00,0x00,0x00],0);
    for (let i=0;i<userCommentAscii.length;i++) userCommentBytes[8+i] = userCommentAscii.charCodeAt(i);
    userCommentBytes[userCommentBytes.length - 1] = 0x00;

    const TYPE_BYTE=1, TYPE_ASCII=2, TYPE_SHORT=3, TYPE_LONG=4, TYPE_RATIONAL=5, TYPE_UNDEFINED=7;

    // IFD0 (sorted)
    const ifd0Entries: { tag:number; type:number; count:number; write:()=>void }[] = [];
    const pushAscii = (tag:number, s:string) => {
      const bytes = new Uint8Array(s.length + 1);
      for (let i=0;i<s.length;i++) bytes[i] = s.charCodeAt(i);
      bytes[bytes.length-1] = 0x00;
      ifd0Entries.push({
        tag, type: TYPE_ASCII, count: bytes.length,
        write: () => {
          w.writeU16LE(tag); w.writeU16LE(TYPE_ASCII); w.writeU32LE(bytes.length);
          const at = w.tell(); w.writeU32LE(0);
          dataPatches.push({ at, bytes });
        }
      });
    };

    pushAscii(0x010E, urlStr || '');       // ImageDescription (export URL if present; empty ok)
    pushAscii(0x010F, makeStr);            // Make
    pushAscii(0x0110, modelStr);           // Model
    pushAscii(0x0131, software);           // Software
    pushAscii(0x0132, dt);                 // DateTime

    // ExifIFDPointer (0x8769)
    let exifIfdPtrPos = -1;
    ifd0Entries.push({
      tag: 0x8769, type: TYPE_LONG, count: 1,
      write: () => { w.writeU16LE(0x8769); w.writeU16LE(TYPE_LONG); w.writeU32LE(1); exifIfdPtrPos = w.tell(); w.writeU32LE(0); }
    });

    // GPSInfoIFDPointer (0x8825)
    let gpsIfdPtrPos = -1;
    if (Number.isFinite(meta?.lat) && Number.isFinite(meta?.lng)) {
      ifd0Entries.push({
        tag: 0x8825, type: TYPE_LONG, count: 1,
        write: () => { w.writeU16LE(0x8825); w.writeU16LE(TYPE_LONG); w.writeU32LE(1); gpsIfdPtrPos = w.tell(); w.writeU32LE(0); }
      });
    }

    // sort IFD0 by tag
    ifd0Entries.sort((a,b) => a.tag - b.tag);
    w.writeU16LE(ifd0Entries.length);
    for (const e of ifd0Entries) e.write();
    w.writeU32LE(0); // next IFD (none)

    // ExifIFD (sorted)
    const exifIfdStart = w.tell();
    const exifEntries: { tag:number; type:number; count:number; write:()=>void }[] = [];

    const pushExifAscii = (tag:number, s:string) => {
      const bytes = new Uint8Array(s.length + 1);
      for (let i=0;i<s.length;i++) bytes[i] = s.charCodeAt(i);
      bytes[bytes.length-1] = 0x00;
      exifEntries.push({
        tag, type: TYPE_ASCII, count: bytes.length,
        write: () => {
          w.writeU16LE(tag); w.writeU16LE(TYPE_ASCII); w.writeU32LE(bytes.length);
          const at = w.tell(); w.writeU32LE(0);
          dataPatches.push({ at, bytes });
        }
      });
    };

    pushExifAscii(0x9003, dt); // DateTimeOriginal
    exifEntries.push({
      tag: 0x9286, type: TYPE_UNDEFINED, count: userCommentBytes.length, // UserComment
      write: () => {
        w.writeU16LE(0x9286); w.writeU16LE(TYPE_UNDEFINED); w.writeU32LE(userCommentBytes.length);
        const at = w.tell(); w.writeU32LE(0);
        dataPatches.push({ at, bytes: userCommentBytes });
      }
    });

    exifEntries.sort((a,b) => a.tag - b.tag);
    w.writeU16LE(exifEntries.length);
    for (const e of exifEntries) e.write();
    w.writeU32LE(0); // next IFD (none)

    // GPS IFD (sorted, with GPSVersionID)
    let gpsIfdStart = -1;
    if (gpsIfdPtrPos >= 0 && Number.isFinite(meta?.lat) && Number.isFinite(meta?.lng)) {
      const lat = meta!.lat as number;
      const lng = meta!.lng as number;
      const dmsLat = toDmsRationals(lat);
      const dmsLng = toDmsRationals(lng);
      const latRef = lat >= 0 ? 'N' : 'S';
      const lngRef = lng >= 0 ? 'E' : 'W';

      const gpsEntries: { tag:number; type:number; count:number; write:()=>void }[] = [];

      const pushGpsAscii = (tag:number, s:string) => {
        const bytes = new Uint8Array(s.length + 1);
        for (let i=0;i<s.length;i++) bytes[i] = s.charCodeAt(i);
        bytes[bytes.length-1] = 0x00;
        gpsEntries.push({
          tag, type: TYPE_ASCII, count: bytes.length,
          write: () => {
            w.writeU16LE(tag); w.writeU16LE(TYPE_ASCII); w.writeU32LE(bytes.length);
            const at = w.tell(); w.writeU32LE(0);
            dataPatches.push({ at, bytes });
          }
        });
      };
      const pushGpsRats = (tag:number, rats: [number,number][]) => {
        const bw = new ByteWriter();
        for (const [num, den] of rats) { bw.writeU32LE(num>>>0); bw.writeU32LE(den>>>0); }
        const arr = bw.finalize();
        gpsEntries.push({
          tag, type: TYPE_RATIONAL, count: rats.length,
          write: () => {
            w.writeU16LE(tag); w.writeU16LE(TYPE_RATIONAL); w.writeU32LE(rats.length);
            const at = w.tell(); w.writeU32LE(0);
            dataPatches.push({ at, bytes: arr });
          }
        });
      };
      const pushGpsBytes = (tag:number, bytes: number[]) => {
        const arr = new Uint8Array(bytes);
        gpsEntries.push({
          tag, type: TYPE_BYTE, count: arr.length,
          write: () => {
            w.writeU16LE(tag); w.writeU16LE(TYPE_BYTE); w.writeU32LE(arr.length);
            const at = w.tell(); w.writeU32LE(0);
            dataPatches.push({ at, bytes: arr });
          }
        });
      };

      // Required by some readers
      pushGpsBytes(0x0000, [2, 3, 0, 0]); // GPSVersionID = 2.3.0.0

      // Latitude/Longitude and refs
      pushGpsAscii(0x0001, latRef);     // GPSLatitudeRef
      pushGpsRats(0x0002, dmsLat);      // GPSLatitude
      pushGpsAscii(0x0003, lngRef);     // GPSLongitudeRef
      pushGpsRats(0x0004, dmsLng);      // GPSLongitude

      // Time/Date
      const d = new Date(whenMs);
      pushGpsRats(0x0007, [[d.getUTCHours(),1],[d.getUTCMinutes(),1],[d.getUTCSeconds(),1]]); // GPSTimeStamp
      pushGpsAscii(0x001D, `${d.getUTCFullYear()}:${String(d.getUTCMonth()+1).padStart(2,'0')}:${String(d.getUTCDate()).padStart(2,'0')}`); // GPSDateStamp

      // Bearing (optional)
      if (Number.isFinite(meta?.azDeg)) {
        pushGpsAscii(0x0010, 'T'); // GPSImgDirectionRef
        const az = Math.round(((meta!.azDeg as number) % 360 + 360) % 360 * 1000);
        pushGpsRats(0x0011, [[az, 1000]]); // GPSImgDirection
      }

      // sort GPS IFD by tag
      gpsEntries.sort((a,b) => a.tag - b.tag);

      gpsIfdStart = w.tell();
      w.writeU16LE(gpsEntries.length);
      for (const e of gpsEntries) e.write();
      w.writeU32LE(0); // next IFD
    }

    // Patch pointers (in-place on base TIFF bytes)
    const base = w.finalize();
    const dv = new DataView(base.buffer);
    if (exifIfdPtrPos >= 0) dv.setUint32(exifIfdPtrPos, (exifIfdStart >>> 0), true);
    if (gpsIfdPtrPos >= 0 && gpsIfdStart >= 0) dv.setUint32(gpsIfdPtrPos, (gpsIfdStart >>> 0), true);

    // Append deferred data blobs and back-fill their offsets
    let totalExtra = 0;
    for (const p of dataPatches) totalExtra += p.bytes.length;
    const out = new Uint8Array(base.length + totalExtra);
    out.set(base, 0);
    const dvOut = new DataView(out.buffer);
    let tail = base.length;
    for (const p of dataPatches) {
      dvOut.setUint32(p.at, tail, true);
      out.set(p.bytes, tail);
      tail += p.bytes.length;
    }
    return out;
  } catch {
    return null;
  }
}

// --- JPEG EXIF injector -------------------------------------------------------
function addExifToJpegDataUrl(jpegDataUrl: string, meta?: PngMeta): string {
  try {
    const exif = makeExifTiff(meta);
    if (!exif) return jpegDataUrl;
    const u8 = dataUrlToUint8(jpegDataUrl);
    if (u8.length < 2 || u8[0] !== 0xFF || u8[1] !== 0xD8) return jpegDataUrl; // not JPEG SOI

    // Build APP1 Exif segment
    const exifHeader = new TextEncoder().encode('Exif\0\0');
    const payload = new Uint8Array(exifHeader.length + exif.length);
    payload.set(exifHeader, 0);
    payload.set(exif, exifHeader.length);

    const len = payload.length + 2; // includes the length field itself
    const seg = new Uint8Array(2 + 2 + payload.length);
    seg[0] = 0xFF; seg[1] = 0xE1;                 // APP1
    seg[2] = (len >> 8) & 0xFF; seg[3] = len & 0xFF;
    seg.set(payload, 4);

    // Insert right after SOI
    const out = new Uint8Array(2 + seg.length + (u8.length - 2));
    out.set(u8.subarray(0, 2), 0);
    out.set(seg, 2);
    out.set(u8.subarray(2), 2 + seg.length);

    return uint8ToJpegDataUrl(out);
  } catch {
    return jpegDataUrl;
  }
}

type PngMeta = {
  siteUrl?: string;
  city?: string;
  lat?: number;
  lng?: number;
  altDeg?: number;
  azDeg?: number;
  whenMs?: number;
  deviceLabel?: string;
  projection?: string;
  fovXDeg?: number;
  fovYDeg?: number;
  // NEW: full export/share URL
  exportUrl?: string;
};

function addMetadataToPngDataUrl(dataUrl: string, meta?: PngMeta): string {
  if (!meta) return dataUrl;
  try {
    const u8 = dataUrlToUint8(dataUrl);
    if (!isPng(u8)) return dataUrl;

    const creationIso = meta.whenMs ? new Date(meta.whenMs).toISOString() : new Date().toISOString();
    const software = `MoonTracker — ${meta.siteUrl || (typeof window !== 'undefined' ? window.location.origin : '')}`;

    // JSON payload with all details (UTF‑8, iTXt)
    const metaJson = JSON.stringify({
      app: 'MoonTracker',
      site: meta.siteUrl || (typeof window !== 'undefined' ? window.location.origin : undefined),
      city: meta.city,
      coords: (Number.isFinite(meta.lat) && Number.isFinite(meta.lng)) ? { lat: meta.lat, lng: meta.lng } : undefined,
      altAz: (Number.isFinite(meta.altDeg) && Number.isFinite(meta.azDeg)) ? { altDeg: meta.altDeg, azDeg: meta.azDeg } : undefined,
      when: creationIso,
      device: meta.deviceLabel,
      projection: meta.projection,
      fovDeg: (Number.isFinite(meta.fovXDeg) && Number.isFinite(meta.fovYDeg)) ? { x: meta.fovXDeg, y: meta.fovYDeg } : undefined,
      // NEW
      exportUrl: meta.exportUrl,
    });

    const chunks: Uint8Array[] = [];

    // NEW: EXIF in PNG via eXIf chunk
    const exifBytes = makeExifTiff(meta);
    if (exifBytes && exifBytes.length) {
      chunks.push(makeChunk('eXIf', exifBytes));
    }

    // Existing tEXt/iTXt
    chunks.push(makeTEXt('Software', software));
    chunks.push(makeTEXt('Creation Time', creationIso));
    // NEW: add Source URL as tEXt for broad tooling visibility
    if (meta.exportUrl) chunks.push(makeTEXt('Source', meta.exportUrl));
    chunks.push(makeITXt('MoonTracker-Info', metaJson));

    const withMeta = insertChunksAfterIHDR(u8, chunks);
    return uint8ToDataUrl(withMeta);
  } catch {
    return dataUrl; // best-effort
  }
}

export async function copyAndDownloadNodeAsPngAndJpeg(
  node: HTMLElement,
  options?: {
    filenameBase?: string;       // e.g. "spaceview"
    pngFilename?: string;        // override, e.g. "custom.png"
    jpgFilename?: string;        // override, e.g. "custom.jpg"
    pixelRatio?: number;
    backgroundColor?: string;    // used for both PNG/JPEG
    meta?: PngMeta;              // injected in PNG (iTXt/tEXt/eXIf) and JPEG (APP1 Exif)
    jpegQuality?: number;        // 0..1 (default 0.92)
  }
): Promise<{ pngDataUrl: string; jpegDataUrl: string }> {
  const filenameBase = options?.filenameBase ?? 'spaceview';
  const pngName = options?.pngFilename ?? `${filenameBase}.png`;
  const jpgName = options?.jpgFilename ?? `${filenameBase}.jpg`;
  const pixelRatio = options?.pixelRatio ?? Math.min(2, (window.devicePixelRatio || 1));
  const backgroundColor = options?.backgroundColor ?? '#000';
  const jpegQuality = options?.jpegQuality ?? 0.92;

  const waitTwoFrames = async () =>
    new Promise<void>(res =>
      requestAnimationFrame(() => requestAnimationFrame(() => res()))
    );

  if (!document.hasFocus()) {
    window.focus?.();
    await new Promise(r => setTimeout(r, 0));
  }

  await waitTwoFrames();

  // PNG + metadata (tEXt/iTXt + eXIf)
  const basePngDataUrl = await toPng(node, { pixelRatio, backgroundColor } as any);
  const pngDataUrl = addMetadataToPngDataUrl(basePngDataUrl, options?.meta);

  // Best-effort: copy PNG to clipboard
  const ClipboardItemAny = (window as any).ClipboardItem;
  if (navigator.clipboard?.write && ClipboardItemAny) {
    try {
      const blob = await (await fetch(pngDataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItemAny({ 'image/png': blob })]);
    } catch {
      // ignore clipboard failures
    }
  }

  // Trigger PNG download
  /*
  const aPng = document.createElement('a');
  aPng.href = pngDataUrl;
  aPng.download = pngName;
  document.body.appendChild(aPng);
  aPng.click();
  aPng.remove();
  */
  // JPEG + EXIF (APP1)
  const baseJpegDataUrl = await toJpeg(node, { pixelRatio, backgroundColor, quality: jpegQuality } as any);
  const jpegDataUrl = addExifToJpegDataUrl(baseJpegDataUrl, options?.meta);

  const aJpg = document.createElement('a');
  aJpg.href = jpegDataUrl;
  aJpg.download = jpgName;
  document.body.appendChild(aJpg);
  aJpg.click();
  aJpg.remove();

  return { pngDataUrl, jpegDataUrl };
}

// RATIONAL helpers for EXIF GPS
function toDmsRationals(deg: number): [number, number][] {
  const abs = Math.abs(deg);
  let d = Math.floor(abs);
  let mFloat = (abs - d) * 60;
  let m = Math.floor(mFloat);
  let s = (mFloat - m) * 60;
  // normalize rounding (carry if seconds hit 60.000)
  let sNum = Math.round(s * 1000);
  let sDen = 1000;
  if (sNum === 60 * sDen) {
    sNum = 0;
    m += 1;
  }
  if (m === 60) {
    m = 0;
    d += 1;
  }
  return [[d, 1], [m, 1], [sNum, sDen]];
}