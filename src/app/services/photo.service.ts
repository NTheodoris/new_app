import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Beach, Photo } from '../models';

const API = 'https://commons.wikimedia.org/w/api.php';
const CACHE_PREFIX = 'photos-v1:';
const CACHE_DAYS = 7;
const MAX_PHOTOS = 6;
/** Πόσο μακριά από το σημείο της παραλίας ψάχνουμε φωτογραφίες (μέτρα). */
const RADIUS_M = 700;

/** Λέξεις που δείχνουν ότι η φωτογραφία είναι πιθανότατα παραλία/θάλασσα. */
const BEACH_WORDS = ['beach', 'παραλ', 'plaz', 'plage', 'strand', 'spiaggia', 'sea', 'θάλασσ', 'coast', 'bay', 'όρμο', 'shore', 'sunset'];
/** Λέξεις που δείχνουν ότι ΔΕΝ είναι φωτογραφία τοπίου. */
const SKIP_WORDS = ['map', 'χάρτη', 'logo', 'coat of arms', 'diagram', 'plan ', 'sign', 'icon', 'flag', 'graph', 'chart', 'stamp'];

interface CacheEntry { at: number; photos: Photo[] }

/**
 * Φωτογραφίες παραλιών από το Wikimedia Commons.
 *
 *  - Αν η παραλία έχει πεδίο "photos" στο beaches.json, δείχνει ΑΚΡΙΒΩΣ αυτές (επιλεγμένες με το χέρι).
 *  - Αλλιώς ψάχνει φωτογραφίες με γεωγραφική θέση κοντά στην παραλία και κρατά τις πιο σχετικές.
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
      const photos = beach.photos?.length ? await this.byTitles(beach.photos) : await this.nearby(beach);
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

  /** Φωτογραφίες τραβηγμένες κοντά στην παραλία, ταξινομημένες κατά σχετικότητα. */
  private async nearby(beach: Beach): Promise<Photo[]> {
    const pages = await this.query({
      generator: 'geosearch',
      ggscoord: `${beach.lat}|${beach.lon}`,
      ggsradius: String(RADIUS_M),
      ggsnamespace: '6',
      ggslimit: '40',
    });
    const names = [beach.name.el, beach.name.en, beach.area.en]
      .flatMap((n) => n.split(/[\s–\-(),.]+/))
      .map(fold)
      .filter((w) => w.length >= 4);

    return pages
      .filter((p) => /^image\/(jpeg|png|webp)$/.test(p.imageinfo?.[0]?.mime ?? ''))
      .filter((p) => (p.imageinfo?.[0]?.width ?? 0) >= 640)
      .map((p) => {
        const text = fold(`${p.title} ${stripHtml(meta(p, 'ImageDescription'))} ${stripHtml(meta(p, 'Categories'))}`);
        if (SKIP_WORDS.some((w) => text.includes(fold(w)))) return null;
        let score = 0;
        if (BEACH_WORDS.some((w) => text.includes(fold(w)))) score += 3;
        if (names.some((n) => text.includes(n))) score += 2;
        score -= (p.index ?? 0) / 100; // ελαφρύ προβάδισμα στις πιο κοντινές
        return { p, score };
      })
      .filter((x): x is { p: any; score: number } => !!x && x.score > 0)
      .sort((a, b) => b.score - a.score)
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
