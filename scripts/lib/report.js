// Tiny formatting helpers for readable CLI reports. No dependencies, no color
// libraries. Dotted leader lines keep the output aligned like an official form.

export function leader(label, value, width = 20) {
  const dots = '.'.repeat(Math.max(2, width - label.length));
  return `${label} ${dots} ${value}`;
}

export function statusWord(pass) {
  return pass ? 'PASS' : 'FAIL';
}

export function heading(text) {
  return `\n${text}\n${'='.repeat(text.length)}`;
}

// UNAVAILABLE is the honest value when data cannot be retrieved. Never guess.
export const UNAVAILABLE = 'UNAVAILABLE';

export function pct(part, whole) {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return UNAVAILABLE;
  return `${((part / whole) * 100).toFixed(1)}%`;
}
