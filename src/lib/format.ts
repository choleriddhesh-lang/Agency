export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Not available';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Not available';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fromYMD(ymd: string): Date {
  // ymd is YYYY-MM-DD; build a local date so it displays on the right calendar day
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function orNa(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Not available';
  return value;
}

export function orNaNum(value: number | null | undefined, suffix?: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Not available';
  return suffix ? `${value}${suffix}` : String(value);
}
