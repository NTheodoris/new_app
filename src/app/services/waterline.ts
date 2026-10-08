import { SeaLevel } from '../models';

/**
 * Η «γραμμή του νερού»: το σήμα της εφαρμογής.
 * Ίσια όταν η θάλασσα είναι ήρεμη, όλο και πιο κυματιστή όσο ανεβαίνει το κύμα.
 */
const AMPLITUDE: Record<SeaLevel, number> = { 0: 0.04, 1: 0.14, 2: 0.26, 3: 0.4 };
const WAVES: Record<SeaLevel, number> = { 0: 2, 1: 3, 2: 3, 3: 4 };

/** Διαδρομή SVG για γραμμή νερού πλάτους w και ύψους h. */
export function wavePath(level: SeaLevel, w: number, h: number, waves = WAVES[level]): string {
  const amp = h * AMPLITUDE[level];
  const mid = h / 2;
  const seg = w / (waves * 2);
  let d = `M0 ${mid.toFixed(1)}`;
  for (let i = 0; i < waves * 2; i++) {
    const dir = i % 2 === 0 ? -1 : 1;
    d += ` q${(seg / 2).toFixed(1)} ${(dir * amp * 2).toFixed(1)} ${seg.toFixed(1)} 0`;
  }
  return d;
}

/** Μικρό εικονίδιο (λευκή γραμμή νερού) για τους δείκτες του χάρτη, σε HTML. */
export function waveGlyph(level: SeaLevel, size = 16, color = '#fff'): string {
  const d = wavePath(level, size, size, 2);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/></svg>`;
}

export const levelVar = (l: SeaLevel) => `var(--lv${l})`;
export const levelInk = (l: SeaLevel) => `var(--lv${l}-ink)`;
export const levelTint = (l: SeaLevel) => `var(--lv${l}-tint)`;
