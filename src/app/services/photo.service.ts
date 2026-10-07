import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Beach, Photo } from '../models';

const API = 'https://commons.wikimedia.org/w/api.php';
const CACHE_PREFIX = 'photos-v2:';
const CACHE_DAYS = 7;
const MAX_PHOTOS = 6;
/** Πόσο μακριά από το σημείο της παραλίας ψάχνουμε φωτογραφίες με γεωγραφική θέση (μέτρα). */
const RADIUS_M = 2000;

/** Λέξεις που δείχνουν ότι η φωτογραφία είναι πιθανότατα παραλία/θάλασσα. */
const BEACH_WORDS = ['beach', 'παραλ', 'plaz', 'plage', 'strand', 'spiaggia', 'sea', 'θάλασσ', 'coast', 'bay', 'όρμο', 'shore', 'sunset'];
/** Λέξεις που δείχνουν ότι ΔΕΝ είναι φωτογραφία τοπίου. */
const SKIP_WORDS = ['map', 'χάρτη', 'logo', 'coat of arms', 'diagram', 'plan ', 'sign', 'icon', 'flag', 'graph', 'chart', 'stamp'];

interface CacheEntry { at: number; photos: Photo[] }

/**
 * Φωτογραφίες παραλιών από το Wikimedia Commons.
 *
 *  - Αν η παραλία έχει πεδίο "photos" στο beaches.json, δείχνει ΑΚΡΙΒΩΣ αυτές (επιλεγμένες με το χέρι).
 *  - Αλλιώς συνδυάζει: αναζήτηση με το όνομα (π.χ. "Petra Lesbos beach", "Πέτρα Λέσβος")
 *    και φωτογραφίες με γεωγραφική θέση κοντά στην παραλία. Πρώτα μπαίνουν όσες δείχνουν παραλία/θάλασσα,
 *    και αν είναι λίγες, συμπληρώνονται με φωτογραφίες του χωριού/της περιοχής.
 *
 * Όλες οι φωτογραφίες του Commons έχουν ελεύθερη άδεια· η εφαρμογή δείχνει πάντα δημιουργό και άδεια.
 */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private memory = new Map<string, Promise<Photo[]>>();

  photosFor(beach: Beach): Promise<Photo[]> {
    const key = `${beach.id}|${beach.lat}|${beach.lon}|${(beach.photos ?? []).join(',')}`;
    let p = this.memory.get(key);
    if (!p) {
      p = this.load(beach, key);
      this.memory.set(key, p);
    }
    return p;
  }

  private async load(beach: Beach, key: string): Promise<Photo[]> {
    const cached = await this.readCache(key);
    if (cached) return cached;
    try {
      const photos = beach.photos?.length ? await this.byTitles(beach.photos) : await this.find(beach);
      await Preferences.set({ key: CACHE_PREFIX + key, value: JSON.stringify({ at: Date.now(), photos }) });
      return photos;
    } catch (e) {
      console.warn('photos', beach.id, e);
      this.memory.delete(key); // να ξαναδοκιμάσει την επόμενη φορά
      return [];
    }
  }

  private async readCache(key: string): Promise<Photo[] | null> {
    try {
      const { value } = await Preferences.get({ key: CACHE_PREFIX + key });
      if (!value) return null;
      const entry = JSON.parse(value) as CacheEntry;
      return Date.now() - entry.at < CACHE_DAYS * 864e5 ? entry.photos : null;
    } catch {
      return null;
    }
  }

  /** Συγκεκριμένα αρχεία, με τη σειρά που δόθηκαν. */
  private async byTitles(titles: string[]): Promise<Photo[]> {
    const norm = titles.map((t) => (/^(file|αρχείο):/i.test(t) ? t.replace(/^αρχείο:/i, 'File:') : `File:${t}`));
    const pages = await this.query({ titles: norm.slice(0, 20).join('|') });
    const byTitle = new Map(pages.map((p) => [p.title.replace(/_/g, ' '), p]));
    return norm
      .map((t) => byTitle.get(t.replace(/_/g, ' ')))
      .map((p) => (p ? toPhoto(p) : null))
      .filter((p): p is Photo => !!p);
  }

  /** Αναζήτηση με όνομα + γεωγραφική αναζήτηση, ταξινομημένα κατά σχετικότητα. */
  private async find(beach: Beach): Promise<Photo[]> {
    const main = (n: string) => n.split(/[–(]/)[0].trim(); // "Μόλυβος – Ψηριάρα" → "Μόλυβος"
    const en = main(beach.name.en), el = main(beach.name.el);
    const areaEn = beach.area.en && beach.area.en !== en ? main(beach.area.en) : '';
    const searches = [
      `${en} Lesbos beach`,
      `${en} Lesvos`,
      `${el} Λέσβος`,
      ...(areaEn ? [`${areaEn} Lesbos beach`] : []),
    ].map((q) =>
      this.query({ generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '25' })
        .then((pages) => pages.map((p) => ({ p, via: 'search' as const })))
        .catch(() => []),
    );
    const geo = this.query({
      generator: 'geosearch', ggscoord: `${beach.lat}|${beach.lon}`, ggsradius: String(RADIUS_M), ggsnamespace: '6', ggslimit: '50',
    })
      .then((pages) => pages.map((p) => ({ p, via: 'geo' as const })))
      .catch(() => []);

    const all = (await Promise.all([...searches, geo])).flat();
    const names = [beach.name.el, beach.name.en, beach.area.el, beach.area.en]
      .flatMap((n) => n.split(/[\s–\-(),.]+/))
      .map(fold)
      .filter((w) => w.length >= 4 && !['beach', 'lesbos', 'lesvos', 'coast', 'south', 'east', 'west', 'north'].includes(w));

    const seen = new Set<string>();
    const scored: { p: any; score: number; beachy: boolean }[] = [];
    for (const { p, via } of all) {
      if (!p?.title || seen.has(p.title)) continue;
      seen.add(p.title);
      const ii = p.imageinfo?.[0];
      if (!/^image\/(jpeg|png|webp)$/.test(ii?.mime ?? '') || (ii?.width ?? 0) < 640) continue;
      const text = fold(`${p.title} ${stripHtml(meta(p, 'ImageDescription'))} ${stripHtml(meta(p, 'Categories'))}`);
      if (SKIP_WORDS.some((w) => text.includes(fold(w)))) continue;
      const beachy = BEACH_WORDS.some((w) => text.includes(fold(w)));
      const named = names.some((n) => text.includes(n));
      const lesvos = /lesbos|lesvos|λεσβ|mytilene|mytilini|μυτιλην/.test(text);
      // Από αναζήτηση με όνομα: πρέπει να αναφέρει τη Λέσβο (αλλιώς π.χ. "Petra" φέρνει την Ιορδανία).
      if (via === 'search' && !lesvos) continue;
      let score = (beachy ? 4 : 0) + (named ? 3 : 0) + (lesvos ? 1 : 0) + (via === 'geo' ? 1 : 0);
      if (via === 'geo') score -= Math.min(1, (p.index ?? 0) / 50); // πιο κοντινές λίγο ψηλότερα
      if (!beachy && !named && via === 'geo' && score < 1) continue;
      scored.push({ p, score, beachy });
    }
    scored.sort((a, b) => b.score - a.score);
    // Πρώτα όσες δείχνουν παραλία/θάλασσα· αν είναι λιγότερες από 3, συμπληρώνουμε με την περιοχή.
    const beachPhotos = scored.filter((x) => x.beachy);
    const picked = beachPhotos.length >= 3 ? beachPhotos : [...beachPhotos, ...scored.filter((x) => !x.beachy)];
    return picked
      .slice(0, MAX_PHOTOS)
      .map((x) => toPhoto(x.p))
      .filter((p): p is Photo => !!p);
  }

  private async query(params: Record<string, string>): Promise<any[]> {
    const qs = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      origin: '*',
      prop: 'imageinfo',
      iiprop: 'url|mime|size|extmetadata',
      iiurlwidth: '800',
      iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|ImageDescription|Categories|AttributionRequired',
      ...params,
    });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(`${API}?${qs}`, {
        headers: { 'Api-User-Agent': 'LesvosBeaches/1.0 (https://github.com/NTheodoris/new_app)' },
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json?.query?.pages ?? [];
    } finally {
      clearTimeout(timer);
    }
  }
}

function toPhoto(p: any): Photo | null {
  const ii = p?.imageinfo?.[0];
  if (!ii?.thumburl) return null;
  return {
    title: String(p.title).replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
    thumb: ii.thumburl,
    page: ii.descriptionurl,
    author: stripHtml(meta(p, 'Artist')) || 'Wikimedia Commons',
    license: stripHtml(meta(p, 'LicenseShortName')) || 'Wikimedia Commons',
    licenseUrl: meta(p, 'LicenseUrl') || null,
    description: stripHtml(meta(p, 'ImageDescription')).slice(0, 200),
  };
}

function meta(p: any, key: string): string {
  return String(p?.imageinfo?.[0]?.extmetadata?.[key]?.value ?? '');
}

/** Αφαιρεί HTML (το Commons δίνει π.χ. τον δημιουργό ως σύνδεσμο). */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Πεζά, χωρίς τόνους — για σύγκριση κειμένων. */
function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
