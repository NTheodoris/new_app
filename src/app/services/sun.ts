import { Beach } from '../models';
import { angleDiff } from './sea';

/**
 * Ηλιοβασίλεμα χωρίς ίντερνετ: αστρονομικός υπολογισμός (τύποι του SunCalc / NOAA, ακρίβεια ~1 λεπτό).
 * Βγάζει την ώρα και το αζιμούθιο (προς τα πού δύει ο ήλιος), ώστε να ξέρουμε αν δύει πάνω από τη θάλασσα
 * μπροστά από την παραλία ή πίσω από τη στεριά.
 */
const RAD = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;
const E = RAD * 23.4397; // κλίση του άξονα της Γης

const toJulian = (d: Date) => d.getTime() / 86400000 - 0.5 + J1970;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * 86400000);
const toDays = (d: Date) => toJulian(d) - J2000;

const solarMeanAnomaly = (d: number) => RAD * (357.5291 + 0.98560028 * d);
function eclipticLongitude(M: number) {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  return M + C + RAD * 102.9372 + Math.PI;
}
const declination = (l: number) => Math.asin(Math.sin(E) * Math.sin(l));
const rightAscension = (l: number) => Math.atan2(Math.sin(l) * Math.cos(E), Math.cos(l));

export interface Sunset {
  /** Ώρα δύσης σε ώρα Ελλάδας, «20:14» */
  time: string;
  /** Αζιμούθιο δύσης (μοίρες από τον βορρά, δεξιόστροφα) */
  azimuth: number;
}

/** Δύση ηλίου για την ημερομηνία (YYYY-MM-DD, ώρα Ελλάδας) και τη θέση. */
export function sunset(dateIso: string, lat: number, lon: number): Sunset | null {
  // μεσημέρι της ημέρας, για να πέσουμε σωστά στον ηλιακό κύκλο
  const date = new Date(dateIso + 'T12:00:00Z');
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = toDays(date);
  const n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const h0 = RAD * -0.833; // ο δίσκος του ήλιου ακουμπά τον ορίζοντα (με τη διάθλαση)
  const cosW = (Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
  if (cosW < -1 || cosW > 1) return null;
  const w = Math.acos(cosW);
  const jSet = J2000 + 0.0009 + (w + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const when = fromJulian(jSet);
  // Αζιμούθιο τη στιγμή της δύσης
  const dd = toDays(when);
  const L2 = eclipticLongitude(solarMeanAnomaly(dd));
  const dec2 = declination(L2);
  const ra = rightAscension(L2);
  const sidereal = RAD * (280.16 + 360.9856235 * dd) - lw;
  const H = sidereal - ra;
  const azSouth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec2) * Math.cos(phi));
  const azimuth = ((azSouth / RAD + 180) % 360 + 360) % 360;
  const time = when.toLocaleTimeString('en-GB', { timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit', hour12: false });
  return { time, azimuth };
}

/**
 * Ο ήλιος δύει «πάνω από τη θάλασσα» αν η κατεύθυνση της δύσης είναι μέσα στο άνοιγμα που κοιτάει η παραλία.
 * Κρατάμε ±60° γύρω από την κατεύθυνση της παραλίας — πιο πλάγια, συνήθως τον κρύβει κάποιο ακρωτήρι.
 * Στους κλειστούς κόλπους (μικρή έκθεση) ο ήλιος δύει πίσω από την απέναντι ακτή, όχι στη θάλασσα.
 */
export function sunsetOverSea(beach: Beach, s: Sunset): boolean {
  return beach.exposure >= 0.45 && angleDiff(s.azimuth, beach.facing) <= 60;
}
