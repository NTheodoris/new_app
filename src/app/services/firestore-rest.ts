/**
 * Ελαφριά ανάγνωση από το Cloud Firestore μέσω REST, χωρίς το Firebase SDK,
 * ώστε η εφαρμογή του τουρίστα να μένει μικρή. (Το SDK φορτώνεται μόνο στη σελίδα διαχείρισης.)
 */
import { BEACHES_COLLECTION, FIREBASE_CONFIG, META_DOC } from '../config';

const base = () =>
  `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

/** Μετατρέπει τη μορφή τιμών του Firestore REST ({stringValue: ...}) σε απλό JavaScript. */
export function decodeValue(v: any): unknown {
  if (!v || typeof v !== 'object') return null;
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('geoPointValue' in v) return { lat: v.geoPointValue.latitude, lon: v.geoPointValue.longitude };
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields ?? {});
  return null;
}

export function decodeFields(fields: Record<string, any>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields ?? {})) out[k] = decodeValue(v);
  return out;
}

async function getJson(url: string): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Ο αριθμός έκδοσης των παραλιών (1 ανάγνωση). null αν δεν έχει γίνει ακόμα εισαγωγή. */
export async function fetchVersion(): Promise<number | null> {
  const doc = await getJson(`${base()}/${META_DOC}?key=${FIREBASE_CONFIG.apiKey}`);
  const v = doc?.fields ? decodeFields(doc.fields)['version'] : null;
  return typeof v === 'number' ? v : null;
}

/** Όλα τα έγγραφα της συλλογής παραλιών, με το id τους. */
export async function fetchBeachDocs(): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  let pageToken = '';
  for (let i = 0; i < 20; i++) {
    const url = `${base()}/${BEACHES_COLLECTION}?pageSize=300&key=${FIREBASE_CONFIG.apiKey}` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
    const json = await getJson(url);
    for (const d of json?.documents ?? []) {
      const id = String(d.name).split('/').pop();
      out.push({ id, ...decodeFields(d.fields) });
    }
    pageToken = json?.nextPageToken ?? '';
    if (!pageToken) break;
  }
  return out;
}
