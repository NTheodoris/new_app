import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BEACHES } from '../data/beaches';
import { Beach, Surface, Tag } from '../models';
import { BEACHES_URL, firebaseConfigured } from '../config';
import { fetchBeachDocs, fetchVersion } from './firestore-rest';

const CACHE_KEY = 'beaches-cache-v3';
const SURFACES: Surface[] = ['sand', 'pebbles', 'mixed'];

export type BeachSource = 'bundled' | 'cache' | 'firebase' | 'github';

interface CacheEntry {
  source: 'firebase' | 'github';
  version: number | null;
  list: Beach[];
}

/**
 * Από πού έρχονται οι παραλίες:
 *  1. ενσωματωμένα δεδομένα (πάντα διαθέσιμα, και χωρίς ίντερνετ)
 *  2. η τελευταία λίστα που κατέβηκε, αποθηκευμένη στη συσκευή
 *  3. το backend (Firebase / Cloud Firestore) — ή, αν δεν έχει ρυθμιστεί/δεν απαντά,
 *     το data/beaches.json στο GitHub
 *
 * Για να μένουμε άνετα στο δωρεάν όριο του Firestore, η εφαρμογή διαβάζει πρώτα ΕΝΑ
 * έγγραφο με τον αριθμό έκδοσης, και κατεβάζει όλες τις παραλίες μόνο αν άλλαξε.
 */
@Injectable({ providedIn: 'root' })
export class BeachRepository {
  bundled(): Beach[] {
    return BEACHES;
  }

  async cached(): Promise<Beach[] | null> {
    const c = await this.readCache();
    return c?.list.length ? c.list : null;
  }

  /** Η πιο φρέσκια λίστα. null αν δεν απαντά καμία πηγή. */
  async remote(): Promise<{ list: Beach[]; source: 'firebase' | 'github' } | null> {
    if (firebaseConfigured()) {
      const fromDb = await this.fromFirestore();
      if (fromDb) return { list: fromDb, source: 'firebase' };
    }
    const fromGh = await this.fromGithub();
    if (fromGh) {
      await this.writeCache({ source: 'github', version: null, list: fromGh });
      return { list: fromGh, source: 'github' };
    }
    return null;
  }

  private async fromFirestore(): Promise<Beach[] | null> {
    try {
      const version = await fetchVersion();
      if (version === null) return null; // δεν έχει γίνει ακόμα εισαγωγή παραλιών
      const cache = await this.readCache();
      if (cache?.source === 'firebase' && cache.version === version && cache.list.length) return cache.list;
      const docs = await fetchBeachDocs();
      docs.sort((a, b) => (Number(a['order']) || 0) - (Number(b['order']) || 0));
      const list = parseBeaches({ beaches: docs });
      if (!list.length) return null;
      await this.writeCache({ source: 'firebase', version, list });
      return list;
    } catch (e) {
      console.warn('beaches: το Firebase δεν απάντησε', e);
      return null;
    }
  }

  private async fromGithub(): Promise<Beach[] | null> {
    if (!BEACHES_URL) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      // Το ?t= παρακάμπτει την προσωρινή μνήμη του κινητού· το GitHub έχει δική του (~5 λεπτά).
      const res = await fetch(`${BEACHES_URL}?t=${Math.floor(Date.now() / 60000)}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list = parseBeaches(await res.json());
      return list.length ? list : null;
    } catch (e) {
      console.warn('beaches: το GitHub δεν απάντησε', e);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async readCache(): Promise<CacheEntry | null> {
    try {
      const { value } = await Preferences.get({ key: CACHE_KEY });
      const c = value ? (JSON.parse(value) as CacheEntry) : null;
      return c && Array.isArray(c.list) ? c : null;
    } catch {
      return null;
    }
  }

  private async writeCache(c: CacheEntry) {
    try {
      await Preferences.set({ key: CACHE_KEY, value: JSON.stringify(c) });
    } catch {
      /* γεμάτη μνήμη κ.λπ. — δεν είναι κρίσιμο */
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
    });
  }
  return out;
}
