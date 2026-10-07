import { Injectable, computed, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Geolocation } from '@capacitor/geolocation';
import { BEACHES } from '../data/beaches';
import { Beach, HourWeather, Lang, SeaCondition } from '../models';
import { seaCondition } from './sea';
import { DictKey, translate } from './i18n';

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const MARINE = 'https://marine-api.open-meteo.com/v1/marine';
const DAYS = 3;

export interface BeachView {
  beach: Beach;
  weather: HourWeather | null;
  sea: SeaCondition | null;
  distanceKm: number | null;
  favorite: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppState {
  readonly beaches = BEACHES;

  readonly lang = signal<Lang>('el');
  readonly favorites = signal<Set<string>>(new Set());
  readonly position = signal<{ lat: number; lon: number } | null>(null);

  readonly loading = signal(false);
  readonly error = signal(false);
  /** Ωριαία πρόγνωση ανά παραλία (ίδια σειρά με BEACHES). */
  private readonly hourly = signal<HourWeather[][]>([]);
  readonly times = computed(() => this.hourly()[0]?.map((h) => h.time) ?? []);
  /** Επιλεγμένη ώρα (δείκτης στον πίνακα ωρών). */
  readonly hourIndex = signal(0);
  readonly nowIndex = signal(0);

  readonly views = computed<BeachView[]>(() => {
    const data = this.hourly();
    const idx = this.hourIndex();
    const pos = this.position();
    const favs = this.favorites();
    return this.beaches.map((beach, i) => {
      const weather = data[i]?.[idx] ?? null;
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
    if (lang.value === 'en' || lang.value === 'el') this.lang.set(lang.value);
    else if (!navigator.language?.startsWith('el')) this.lang.set('en');
    if (favs.value) this.favorites.set(new Set(JSON.parse(favs.value)));
    this.loadWeather();
    this.locate(false);
  }

  hourlyFor(beachId: string): HourWeather[] {
    const i = this.beaches.findIndex((b) => b.id === beachId);
    return this.hourly()[i] ?? [];
  }

  toggleLang() {
    const next: Lang = this.lang() === 'el' ? 'en' : 'el';
    this.lang.set(next);
    Preferences.set({ key: 'lang', value: next });
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

  async loadWeather() {
    this.loading.set(true);
    this.error.set(false);
    const lats = this.beaches.map((b) => b.lat.toFixed(4)).join(',');
    const lons = this.beaches.map((b) => b.lon.toFixed(4)).join(',');
    const common = `latitude=${lats}&longitude=${lons}&forecast_days=${DAYS}&timezone=Europe%2FAthens`;
    try {
      const forecastReq = fetch(
        `${FORECAST}?${common}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m&wind_speed_unit=kmh`,
      ).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
      // Τα θαλάσσια δεδομένα είναι προαιρετικά — αν αποτύχουν, συνεχίζουμε μόνο με τον άνεμο.
      const marineReq = fetch(`${MARINE}?${common}&hourly=wave_height,sea_surface_temperature`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const [fc, mar] = await Promise.all([forecastReq, marineReq]);
      const fcList: any[] = Array.isArray(fc) ? fc : [fc];
      const marList: any[] | null = mar ? (Array.isArray(mar) ? mar : [mar]) : null;

      const data = fcList.map((f, i) => {
        const h = f.hourly;
        const m = marList?.[i]?.hourly;
        return (h.time as string[]).map<HourWeather>((time, j) => ({
          time,
          windSpeed: h.wind_speed_10m[j] ?? 0,
          windDir: h.wind_direction_10m[j] ?? 0,
          gusts: h.wind_gusts_10m[j] ?? 0,
          temp: h.temperature_2m[j] ?? null,
          waveHeight: m?.wave_height?.[j] ?? null,
          seaTemp: m?.sea_surface_temperature?.[j] ?? null,
        }));
      });
      this.hourly.set(data);
      const now = currentHourIndex(data[0]?.map((d) => d.time) ?? []);
      this.nowIndex.set(now);
      this.hourIndex.set(now);
    } catch (e) {
      console.error('weather', e);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
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
