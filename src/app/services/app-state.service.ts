import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Geolocation } from '@capacitor/geolocation';
import { BeachRepository, BeachSource } from './beach-repository.service';
import { Beach, HourWeather, Lang, SeaCondition, Text } from '../models';
import { DESC_I18N } from '../data/desc-i18n';
import { seaCondition } from './sea';
import { DictKey, translate } from './i18n';

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const MARINE = 'https://marine-api.open-meteo.com/v1/marine';
const DAYS = 3;
/** Αν η εφαρμογή ξαναγίνει ορατή μετά από τόσο χρόνο, ξαναφορτώνεται ο καιρός. */
const REFRESH_AFTER_MS = 30 * 60 * 1000;
/** Μετά από τόσα λεπτά στο παρασκήνιο, ο καιρός ξαναφορτώνεται όταν ξαναβλέπουμε την εφαρμογή. */
const STALE_MIN = 30;

export interface BeachView {
  beach: Beach;
  weather: HourWeather | null;
  sea: SeaCondition | null;
  distanceKm: number | null;
  favorite: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppState {
  private repo = inject(BeachRepository);
  /** Οι παραλίες που εμφανίζονται (ενσωματωμένες → αποθηκευμένες → από τη βάση). */
  readonly beaches = signal<Beach[]>(this.repo.bundled());
  readonly beachSource = signal<BeachSource>('bundled');

  readonly lang = signal<Lang>('el');
  readonly favorites = signal<Set<string>>(new Set());
  readonly position = signal<{ lat: number; lon: number } | null>(null);

  readonly loading = signal(false);
  readonly error = signal(false);
  /** Ωριαία πρόγνωση ανά παραλία (κλειδί: id παραλίας). */
  private readonly hourly = signal<Map<string, HourWeather[]>>(new Map());
  readonly times = computed(() => this.hourly().values().next().value?.map((h) => h.time) ?? []);
  /** Επιλεγμένη ώρα (δείκτης στον πίνακα ωρών). */
  readonly hourIndex = signal(0);
  readonly nowIndex = signal(0);
  private weatherLoadedAt = 0;
  private lastLoaded = 0;
  private resumeHooked = false;

  readonly views = computed<BeachView[]>(() => {
    const data = this.hourly();
    const idx = this.hourIndex();
    const pos = this.position();
    const favs = this.favorites();
    return this.beaches().map((beach) => {
      const weather = data.get(beach.id)?.[idx] ?? null;
      return {
        beach,
        weather,
        sea: weather ? seaCondition(beach, weather) : null,
        distanceKm: pos ? distanceKm(pos.lat, pos.lon, beach.lat, beach.lon) : null,
        favorite: favs.has(beach.id),
      };
    });
  });

  /** Η καλύτερη πρόταση: πιο ήρεμη θάλασσα, μετά πιο κοντά, μετά οργανωμένη. */
  readonly bestPick = computed(() => {
    const list = this.views().filter((v) => v.sea);
    if (!list.length) return null;
    return [...list].sort((a, b) => {
      // πρώτα η απόφαση (ιδανική > καλή > …), μετά πόσο ήρεμα είναι
      if (a.sea!.level !== b.sea!.level) return a.sea!.level - b.sea!.level;
      const s = a.sea!.index - b.sea!.index;
      if (Math.abs(s) > 3) return s;
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      return s;
    })[0];
  });

  t = (key: DictKey) => translate(key, this.lang());

  async init() {
    const [lang, favs] = await Promise.all([
      Preferences.get({ key: 'lang' }),
      Preferences.get({ key: 'favorites' }),
    ]);
    const saved = lang.value as Lang | null;
    if (saved && ['el', 'en', 'de', 'tr'].includes(saved)) this.lang.set(saved);
    else {
      // Πρώτη φορά: η γλώσσα του κινητού, αν την έχουμε· αλλιώς αγγλικά.
      const nav = (navigator.language || '').slice(0, 2).toLowerCase();
      this.lang.set((['el', 'de', 'tr'].includes(nav) ? nav : 'en') as Lang);
    }
    document.documentElement.lang = this.lang();
    if (favs.value) this.favorites.set(new Set(JSON.parse(favs.value)));
    this.locate(false);
    this.hookResume();
    await this.loadBeaches();
  }

  /** Όταν ο χρήστης γυρίζει στην εφαρμογή (ξεκλείδωμα, άλλη καρτέλα, άλλη εφαρμογή), ανανεώνουμε αν χρειάζεται. */
  private hookResume() {
    if (this.resumeHooked) return;
    this.resumeHooked = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.refreshIfStale();
    });
    window.addEventListener('pageshow', () => this.refreshIfStale());
  }

  async refreshIfStale() {
    if (this.loading() || !this.lastLoaded) return;
    const ageMin = (Date.now() - this.lastLoaded) / 60000;
    if (ageMin >= STALE_MIN) {
      await this.loadBeaches();
    } else {
      this.advanceClock();
    }
  }

  /** Χωρίς νέα λήψη: αν πέρασε η ώρα, μετακινούμε το «τώρα» στη σωστή ώρα της πρόγνωσης. */
  private advanceClock() {
    const times = this.times();
    if (!times.length) return;
    const now = currentHourIndex(times);
    if (now !== this.nowIndex()) {
      if (this.hourIndex() === this.nowIndex()) this.hourIndex.set(now);
      this.nowIndex.set(now);
    }
  }

  /** Φορτώνει παραλίες: πρώτα από τη συσκευή (γρήγορα), μετά από τη βάση (πιο φρέσκα). */
  async loadBeaches() {
    const cached = await this.repo.cached();
    if (cached) {
      this.beaches.set(cached);
      this.beachSource.set('cache');
    }
    const weatherDone = this.loadWeather();
    const remote = await this.repo.remote();
    if (remote) {
      const changed = locationKey(remote.list) !== locationKey(this.beaches());
      this.beaches.set(remote.list);
      this.beachSource.set(remote.source);
      // Αν άλλαξαν παραλίες ή θέσεις, ξαναζητάμε καιρό για τις καινούριες.
      if (changed) {
        await weatherDone;
        await this.loadWeather();
      }
    }
  }

  /** Αν η παραλία έχει κύμα, η πιο κοντινή της που είναι ήρεμη (επίπεδο 0–1) την ίδια ώρα. */
  calmAlternative(beachId: string): { view: BeachView; km: number } | null {
    const views = this.views();
    const me = views.find((v) => v.beach.id === beachId);
    if (!me?.sea || me.sea.level < 2) return null;
    let best: { view: BeachView; km: number } | null = null;
    for (const v of views) {
      if (v.beach.id === beachId || !v.sea || v.sea.level > 1) continue;
      const km = distanceKm(me.beach.lat, me.beach.lon, v.beach.lat, v.beach.lon);
      if (!best || km < best.km) best = { view: v, km };
    }
    return best;
  }

  /**
   * Η καλύτερη ώρα για μπάνιο την ημέρα που έχει επιλεγεί (09:00–20:00, από τώρα και μετά αν είναι σήμερα):
   * το μεγαλύτερο συνεχόμενο διάστημα με την πιο ήρεμη θάλασσα της ημέρας.
   */
  bestTime(beachId: string): { from: string; to: string; level: number; allDay: boolean } | null {
    const beach = this.beaches().find((b) => b.id === beachId);
    const all = this.hourlyFor(beachId);
    const sel = all[this.hourIndex()];
    if (!beach || !sel) return null;
    const day = sel.time.slice(0, 10);
    const now = all[this.nowIndex()]?.time ?? '';
    const hours = all
      .filter((h) => h.time.slice(0, 10) === day && h.time >= now.slice(0, 13))
      .filter((h) => { const hh = +h.time.slice(11, 13); return hh >= 9 && hh < 20; })
      .map((h) => ({ hh: +h.time.slice(11, 13), level: seaCondition(beach, h).level }));
    if (!hours.length) return null;
    const min = Math.min(...hours.map((h) => h.level));
    let bestStart = 0, bestLen = 0, start = -1;
    hours.forEach((h, i) => {
      if (h.level === min) {
        if (start < 0) start = i;
        if (i - start + 1 > bestLen) { bestLen = i - start + 1; bestStart = start; }
      } else start = -1;
    });
    const pad = (n: number) => String(n).padStart(2, '0') + ':00';
    return {
      from: pad(hours[bestStart].hh),
      to: pad(hours[bestStart + bestLen - 1].hh + 1),
      level: min,
      allDay: bestLen === hours.length,
    };
  }

  hourlyFor(beachId: string): HourWeather[] {
    return this.hourly().get(beachId) ?? [];
  }

  setLang(next: Lang) {
    this.lang.set(next);
    document.documentElement.lang = next;
    Preferences.set({ key: 'lang', value: next });
  }

  /** Κείμενο δεδομένων στη γλώσσα του χρήστη (γερμανικά/τουρκικά → αγγλικά αν λείπουν). */
  txt(t: Text): string {
    const l = this.lang();
    return t[l] || t.en || t.el;
  }

  /** Περιγραφή παραλίας, με τις έτοιμες γερμανικές/τουρκικές μεταφράσεις. */
  desc(b: Beach): string {
    const l = this.lang();
    if (l === 'de' || l === 'tr') return b.desc[l] || DESC_I18N[b.desc.en]?.[l] || b.desc.en;
    return b.desc[l];
  }

  toggleFavorite(id: string) {
    const s = new Set(this.favorites());
    s.has(id) ? s.delete(id) : s.add(id);
    this.favorites.set(s);
    Preferences.set({ key: 'favorites', value: JSON.stringify([...s]) });
  }

  async locate(ask = true) {
    try {
      if (!ask) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') return;
      }
      const p = await Geolocation.getCurrentPosition({ timeout: 10000 });
      this.position.set({ lat: p.coords.latitude, lon: p.coords.longitude });
    } catch {
      /* ο χρήστης αρνήθηκε ή δεν υπάρχει GPS — συνεχίζουμε χωρίς θέση */
    }
  }

  /** Ξαναφορτώνει τον καιρό αν έχει περάσει πάνω από μισή ώρα από την τελευταία φορά. */
  refreshWeatherIfStale() {
    if (this.loading() || !this.weatherLoadedAt) return;
    if (Date.now() - this.weatherLoadedAt > REFRESH_AFTER_MS) this.loadWeather();
  }

  async loadWeather() {
    const beaches = this.beaches();
    if (!beaches.length) return;
    this.loading.set(true);
    this.error.set(false);
    const lats = beaches.map((b) => b.lat.toFixed(4)).join(',');
    const lons = beaches.map((b) => b.lon.toFixed(4)).join(',');
    const common = `latitude=${lats}&longitude=${lons}&forecast_days=${DAYS}&timezone=Europe%2FAthens`;
    try {
      const forecastReq = fetch(
        `${FORECAST}?${common}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m&wind_speed_unit=kmh`,
      ).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
      // Τα θαλάσσια δεδομένα είναι προαιρετικά — αν αποτύχουν, συνεχίζουμε μόνο με τον άνεμο.
      // Το μοντέλο κύματος έχει αραιό πλέγμα και δεν έχει τιμές πάνω στη στεριά· γι' αυτό ρωτάμε
      // ένα σημείο ~4 χλμ. μέσα στη θάλασσα, μπροστά από κάθε παραλία.
      const sea = beaches.map((b) => offsetToSea(b));
      const marineCommon = `latitude=${sea.map((p) => p.lat.toFixed(4)).join(',')}&longitude=${sea.map((p) => p.lon.toFixed(4)).join(',')}&forecast_days=${DAYS}&timezone=Europe%2FAthens`;
      const marineReq = fetch(`${MARINE}?${marineCommon}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [fc, mar] = await Promise.all([forecastReq, marineReq]);
      const fcList: any[] = Array.isArray(fc) ? fc : [fc];
      const marList: any[] | null = mar ? (Array.isArray(mar) ? mar : [mar]) : null;

      const data = new Map<string, HourWeather[]>();
      fcList.forEach((f, i) => {
        const h = f.hourly;
        const m = marList?.[i]?.hourly;
        data.set(beaches[i].id, (h.time as string[]).map<HourWeather>((time, j) => ({
          time,
          windSpeed: h.wind_speed_10m[j] ?? 0,
          windDir: h.wind_direction_10m[j] ?? 0,
          gusts: h.wind_gusts_10m[j] ?? 0,
          temp: h.temperature_2m[j] ?? null,
          waveHeight: m?.wave_height?.[j] ?? null,
          waveDir: m?.wave_direction?.[j] ?? null,
          wavePeriod: m?.wave_period?.[j] ?? null,
          seaTemp: m?.sea_surface_temperature?.[j] ?? null,
        })));
      });
      this.hourly.set(data);
      const first = data.values().next().value ?? [];
      const now = currentHourIndex(first.map((d) => d.time));
      this.nowIndex.set(now);
      this.hourIndex.set(now);
      this.weatherLoadedAt = Date.now();
      this.lastLoaded = Date.now();
    } catch (e) {
      console.error('weather', e);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}

/** Σημείο ~4 χλμ. από την παραλία, προς την κατεύθυνση που κοιτάει (δηλ. προς τη θάλασσα). */
export function offsetToSea(b: Beach, km = 4): { lat: number; lon: number } {
  const rad = (b.facing * Math.PI) / 180;
  const dLat = (km * Math.cos(rad)) / 111;
  const dLon = (km * Math.sin(rad)) / (111 * Math.cos((b.lat * Math.PI) / 180));
  return { lat: b.lat + dLat, lon: b.lon + dLon };
}

function locationKey(list: Beach[]) {
  return list.map((b) => `${b.id}@${b.lat.toFixed(4)},${b.lon.toFixed(4)}`).join('|');
}

function currentHourIndex(times: string[]): number {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  // Οι ώρες έρχονται σε ώρα Ελλάδας· η συσκευή του τουρίστα μπορεί να έχει άλλη ζώνη.
  const athens = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Athens' }));
  const key = `${athens.getFullYear()}-${pad(athens.getMonth() + 1)}-${pad(athens.getDate())}T${pad(athens.getHours())}:00`;
  const i = times.indexOf(key);
  return i === -1 ? 0 : i;
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
