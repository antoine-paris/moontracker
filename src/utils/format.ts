export function formatDeg(value: number, digits = 1): string {
  const sign = value >= 0 ? "" : "-";
  return `${sign}${Math.abs(value).toFixed(digits)}°`;
}

export function toDatetimeLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

export function formatTimeInZone(d: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

export function formatDateTimeInZone(d: Date, timeZone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('fr-FR', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    return fmt.format(d).replace(',', '');
  } catch {
    const dd = d.toLocaleDateString('fr-FR');
    const tt = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dd} ${tt}`;
  }
}
