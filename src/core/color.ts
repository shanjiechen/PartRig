const cache = new Map<string, string>();

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

export function mix(a: string, b: string, t: number): string {
  const key = `m${a}${b}${t}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const x = hexToRgb(a), y = hexToRgb(b);
  const out = rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  cache.set(key, out);
  return out;
}

/** amt > 0 lightens toward white, amt < 0 darkens toward a warm dark. */
export function shade(hex: string, amt: number): string {
  return amt >= 0 ? mix(hex, '#ffffff', amt) : mix(hex, '#1e1216', -amt);
}

/** Cartoon outline color derived from a fill color. */
export function ink(hex: string): string {
  return mix(mix(hex, '#2a1a1e', 0.62), '#3a2028', 0.25);
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
