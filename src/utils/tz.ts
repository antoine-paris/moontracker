export function zonedLocalToUtcMs(isoLocal: string, timeZone: string): number {
  // isoLocal attendu: YYYY-MM-DDTHH:mm:ss (sans décalage)
  const m = isoLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return Number.NaN;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const h = Number(m[4]), mi = Number(m[5]), s = Number(m[6]);

  const toParts = (ms: number) => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    const parts = fmt.formatToParts(new Date(ms));
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? '0');
    return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
  };

  const getOffsetMs = (ms: number) => {
    const zp = toParts(ms);
    const asUTC = Date.UTC(zp.y, zp.mo - 1, zp.d, zp.h, zp.mi, zp.s);
    return asUTC - ms;
  };

  const wallMs = Date.UTC(y, mo - 1, d, h, mi, s);
  let offset = getOffsetMs(wallMs);
  let result = wallMs - offset;
  const offset2 = getOffsetMs(result);
  if (offset2 !== offset) {
    result = wallMs - offset2;
  }
  return result;
}
