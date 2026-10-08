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
 * Πόσο από ένα κύμα που έρχεται από την κατεύθυνση `waveFrom` φτάνει σε παραλία που κοιτάει προς `facing`.
 * Με γωνία έως 50° φτάνει ολόκληρο· μέχρι 120° εξασθενεί (το κύμα στρίβει γύρω από ακρωτήρια)·
 * πέρα από ~150° (το κύμα έρχεται από τη στεριά) δεν φτάνει καθόλου.
 */
export function waveReach(waveFrom: number, facing: number): number {
  const d = angleDiff(waveFrom, facing);
  if (d <= 50) return 1;
  if (d <= 120) return 1 - 0.85 * ((d - 50) / 70);
  if (d <= 150) return 0.15 * (1 - (d - 120) / 30);
  return 0;
}

/** Τα μακρύτερης περιόδου κύματα έχουν περισσότερη ενέργεια (0.85 στα 4 s … 1.15 στα 14 s). */
export function periodFactor(periodSec: number | null): number {
  if (periodSec == null) return 1;
  return Math.min(1.15, Math.max(0.85, 0.85 + 0.03 * (periodSec - 4)));
}

/** Αντιστοιχία ύψους κύματος (m) → «ισοδύναμος άνεμος» που χρησιμοποιούν τα όρια των επιπέδων. */
const WAVE_TO_INDEX = 22;

/**
 * Εκτίμηση κατάστασης θάλασσας σε μια παραλία. Δύο πηγές κύματος, παίρνουμε τη μεγαλύτερη:
 *
 * 1. Τοπικός άνεμος: ο άνεμος που φυσάει από τη θάλασσα προς την ακτή (onshore) φέρνει κύμα,
 *    ενώ ο άνεμος από τη στεριά (offshore) αφήνει τα νερά ήρεμα κοντά στην ακτή.
 * 2. Κύμα από τα ανοιχτά (φουσκοθαλασσιά): έχει δική του κατεύθυνση και περίοδο. Φτάνει στην
 *    παραλία μόνο αν έρχεται από το μέρος που κοιτάει — ακόμη κι όταν ο τοπικός άνεμος έχει κοπάσει
 *    ή φυσάει από τη στεριά. Αν η κατεύθυνση του κύματος λείπει, γίνεται κατά προσέγγιση με τον άνεμο.
 *
 * Σε κλειστούς κόλπους (μικρό exposure) το κύμα δεν προλαβαίνει να μεγαλώσει ή δεν μπαίνει.
 */
export function seaCondition(beach: Beach, w: HourWeather): SeaCondition {
  const diff = angleDiff(w.windDir, beach.facing);
  const onshore = Math.cos((diff * Math.PI) / 180);
  // Λίγο κύμα φτάνει και με πλάγιο άνεμο, γι' αυτό υπάρχει ένα μικρό υπόλοιπο.
  const effectiveWind = w.windSpeed * (0.15 + 0.85 * Math.max(0, onshore));
  const windIndex = effectiveWind * beach.exposure;

  let reach: number | null = null;
  let waveIndex = 0;
  if (w.waveHeight != null) {
    if (w.waveDir != null) {
      reach = waveReach(w.waveDir, beach.facing);
      waveIndex = w.waveHeight * reach * periodFactor(w.wavePeriod) * WAVE_TO_INDEX * beach.exposure;
    } else if (onshore > 0.2) {
      // Χωρίς κατεύθυνση κύματος: υποθέτουμε ότι ακολουθεί τον άνεμο (παλιός τρόπος υπολογισμού).
      waveIndex = w.waveHeight * WAVE_TO_INDEX * beach.exposure;
    }
  }

  const index = Math.max(windIndex, waveIndex);
  let level: SeaLevel = 0;
  if (index >= 28) level = 3;
  else if (index >= 18) level = 2;
  else if (index >= 10) level = 1;

  // Δυνατός αέρας από τη στεριά: νερά ήρεμα, αλλά όχι «ιδανικά» (παρασύρει φουσκωτά στα ανοιχτά).
  const offshoreWarning = onshore < -0.3 && w.windSpeed >= 25;
  if (offshoreWarning && level === 0) level = 1;

  return {
    level,
    onshore,
    index: Math.round(index),
    waveReach: reach,
    coastWave: Math.round((index / WAVE_TO_INDEX) * 10) / 10,
    driver: waveIndex > windIndex * 1.15 && level > 0 ? 'waves' : 'wind',
    offshoreWarning,
    beaufort: beaufort(w.windSpeed),
  };
}

export const LEVEL_COLORS: Record<SeaLevel, string> = {
  0: '#1a9e5c',
  1: '#d4b106',
  2: '#e8710a',
  3: '#d32f2f',
};
