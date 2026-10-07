import { Beach, HourWeather, SeaCondition, SeaLevel } from '../models';

/** Μικρότερη γωνιακή διαφορά δύο κατευθύνσεων (0..180). */
export function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 540) % 360 - 180);
  return d;
}

export function beaufort(kmh: number): number {
  const limits = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
  const i = limits.findIndex((l) => kmh < l);
  return i === -1 ? 12 : i;
}

const COMPASS_EL = ['Β', 'ΒΑ', 'Α', 'ΝΑ', 'Ν', 'ΝΔ', 'Δ', 'ΒΔ'];
const COMPASS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export function compass(deg: number, lang: 'el' | 'en'): string {
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return (lang === 'el' ? COMPASS_EL : COMPASS_EN)[i];
}

/**
 * Εκτίμηση κατάστασης θάλασσας σε μια παραλία.
 *
 * Ιδέα: ο άνεμος που φυσάει από τη θάλασσα προς την ακτή (onshore) φέρνει κύμα,
 * ενώ ο άνεμος από τη στεριά (offshore) αφήνει τα νερά ήρεμα κοντά στην ακτή.
 * Σε κλειστούς κόλπους (μικρό exposure) το κύμα δεν προλαβαίνει να μεγαλώσει.
 */
export function seaCondition(beach: Beach, w: HourWeather): SeaCondition {
  const diff = angleDiff(w.windDir, beach.facing);
  const onshore = Math.cos((diff * Math.PI) / 180);
  // Λίγο κύμα φτάνει και με πλάγιο άνεμο, γι' αυτό υπάρχει ένα μικρό υπόλοιπο.
  const effectiveWind = w.windSpeed * (0.15 + 0.85 * Math.max(0, onshore));
  let index = effectiveWind * beach.exposure;

  // Αν το μοντέλο θάλασσας δίνει μεγάλο κύμα ανοιχτά και ο αέρας είναι προς την ακτή,
  // ενίσχυσε λίγο την εκτίμηση (π.χ. φουσκοθαλασσιά από προηγούμενο αέρα).
  if (w.waveHeight != null && onshore > 0.2) {
    index = Math.max(index, w.waveHeight * 22 * beach.exposure);
  }

  let level: SeaLevel = 0;
  if (index >= 28) level = 3;
  else if (index >= 18) level = 2;
  else if (index >= 10) level = 1;

  return {
    level,
    onshore,
    index: Math.round(index),
    offshoreWarning: onshore < -0.3 && w.windSpeed >= 25,
    beaufort: beaufort(w.windSpeed),
  };
}

export const LEVEL_COLORS: Record<SeaLevel, string> = {
  0: '#1a9e5c',
  1: '#d4b106',
  2: '#e8710a',
  3: '#d32f2f',
};
