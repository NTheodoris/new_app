import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BEACHES } from '../data/beaches';
import { Beach, Surface, Tag } from '../models';
import { BEACHES_URL } from '../config';

const CACHE_KEY = 'beaches-cache-v2';
const SURFACES: Surface[] = ['sand', 'pebbles', 'mixed'];

export type BeachSource = 'bundled' | 'cache' | 'remote';

/**
 * Από πού έρχονται οι παραλίες:
 *  1. ενσωματωμένα δεδομένα (πάντα διαθέσιμα, και χωρίς ίντερνετ)
 *  2. η τελευταία λίστα που κατέβηκε, αποθηκευμένη στη συσκευή
 *  3. το data/beaches.json στο GitHub (η πιο πρόσφατη εκδοχή)
 */
@Injectable({ providedIn: 'root' })
export class BeachRepository {
  readonly configured = !!BEACHES_URL;

  bundled(): Beach[] {
    return BEACHES;
  }

  async cached(): Promise<Beach[] | null> {
    try {
      const { value } = await Preferences.get({ key: CACHE_KEY });
      const list = value ? (JSON.parse(value) as Beach[]) : null;
      return list?.length ? list : null;
    } catch {
      return null;
    }
  }

  /** Κατεβάζει τις παραλίες από το GitHub. Επιστρέφει null αν δεν γίνεται ή αν το αρχείο είναι χαλασμένο. */
  async remote(): Promise<Beach[] | null> {
    if (!this.configured) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      // Το ?t= παρακάμπτει την προσωρινή μνήμη του κινητού· το GitHub έχει δική του (~5 λεπτά).
      const res = await fetch(`${BEACHES_URL}?t=${Math.floor(Date.now() / 60000)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = parseBeaches(json);
      if (!list.length) return null; // κενό ή χαλασμένο αρχείο: κρατάμε ό,τι είχαμε
      await Preferences.set({ key: CACHE_KEY, value: JSON.stringify(list) });
      return list;
    } catch (e) {
      console.warn('beaches: δεν ήταν δυνατή η λήψη από το GitHub', e);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Ελέγχει κάθε παραλία και αγνοεί όσες έχουν λάθη, ώστε ένα τυπογραφικό να μη ρίχνει την εφαρμογή. */
export function parseBeaches(json: unknown): Beach[] {
  const arr = (json as { beaches?: unknown })?.beaches;
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: Beach[] = [];
  for (const r of arr as any[]) {
    if (!r || r.active === false) continue;
    const id = String(r.id ?? '').trim();
    const lat = r.lat == null || r.lat === '' ? NaN : Number(r.lat);
    const lon = r.lon == null || r.lon === '' ? NaN : Number(r.lon);
    const nameEl = r.name?.el ?? r.name_el;
    if (!id || seen.has(id) || !nameEl || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    seen.add(id);
    const text = (o: any, el: string) => ({ el: String(o?.el ?? el ?? ''), en: String(o?.en || o?.el || el || '') });
    const exposure = Number(r.exposure);
    out.push({
      id,
      name: text(r.name, nameEl),
      area: text(r.area, ''),
      lat,
      lon,
      facing: ((Number(r.facing) % 360) + 360) % 360 || 0,
      exposure: Number.isFinite(exposure) ? Math.min(1, Math.max(0, exposure)) : 1,
      surface: SURFACES.includes(r.surface) ? r.surface : null,
      organized: typeof r.organized === 'boolean' ? r.organized : null,
      tags: Array.isArray(r.tags) ? (r.tags.filter((t: unknown) => typeof t === 'string') as Tag[]) : [],
      desc: text(r.desc, ''),
      photos: Array.isArray(r.photos)
        ? r.photos.filter((p: unknown) => typeof p === 'string' && p.trim()).map((p: string) => p.trim())
        : undefined,
    });
  }
  return out;
}
