/**
 * Robust UTC ISO Date parser and relative time formatter.
 * Solves timezone offsets (e.g. IST +05:30) when backend sends naive UTC timestamps without 'Z'.
 */

export function parseIsoUtc(iso) {
  if (!iso) return null;
  if (iso instanceof Date) return iso;
  let str = String(iso).trim();
  // If string has no timezone indicator (Z or +HH:MM / -HH:MM), append Z to force UTC interpretation
  if (!str.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(str)) {
    str += 'Z';
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatRelativeTime(iso) {
  const date = parseIsoUtc(iso);
  if (!date) return '';

  const diff = Math.max(0, Date.now() - date.getTime());
  const secs = Math.floor(diff / 1000);

  if (secs < 45) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
