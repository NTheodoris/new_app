import { Component, ElementRef, NgZone, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonSpinner, IonSearchbar,
} from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { Auth, GoogleAuthProvider, User, getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { Firestore, collection, doc, getDoc, getDocs, getFirestore, writeBatch } from 'firebase/firestore';
import { BEACHES_COLLECTION, FIREBASE_CONFIG, META_DOC, firebaseConfigured } from '../config';
import seed from '../../../data/beaches.json';
import { compass } from '../services/sea';

/** Μια παραλία όπως αποθηκεύεται στο Firestore (ίδια μορφή με το data/beaches.json). */
interface BeachDoc {
  id: string;
  name: { el: string; en: string };
  area: { el: string; en: string };
  lat: number;
  lon: number;
  facing: number;
  exposure: number;
  surface: 'sand' | 'pebbles' | 'mixed' | null;
  organized: boolean | null;
  tags: string[];
  desc: { el: string; en: string };
  active: boolean;
  order: number;
}

const TAGS: { key: string; label: string }[] = [
  { key: 'family', label: 'Για οικογένειες' }, { key: 'quiet', label: 'Ήσυχη' },
  { key: 'tavern', label: 'Ταβέρνα' }, { key: 'snorkel', label: 'Μάσκα' },
  { key: 'hotspring', label: 'Θερμές πηγές' }, { key: 'nudist', label: 'Γυμνισμός' },
  { key: 'surf', label: 'Σέρφ' }, { key: 'shade', label: 'Φυσική σκιά' },
  { key: 'sunset', label: 'Ηλιοβασίλεμα' }, { key: 'birds', label: 'Πουλιά' },
  { key: 'watersports', label: 'Θαλάσσια σπορ' },
];
const DIRS = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * Σελίδα διαχείρισης παραλιών: https://…/admin
 * Σύνδεση με Google· αποθηκεύει μόνο αν ο λογαριασμός είναι διαχειριστής (βλ. firestore.rules).
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonSpinner, IonSearchbar],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Διαχείριση παραλιών</ion-title>
        <ion-buttons slot="end">
          @if (user()) {
            <ion-button (click)="logout()">Αποσύνδεση</ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="wrap">
        @if (!configured) {
          <div class="box warn">
            <b>Το backend δεν έχει ρυθμιστεί ακόμα.</b><br />
            Συμπλήρωσε τα στοιχεία του Firebase στο <code>src/app/config.ts</code> (οδηγίες στο README).
          </div>
        } @else if (!authReady()) {
          <ion-spinner />
        } @else if (!user()) {
          <div class="box">
            <p>Συνδέσου με τον λογαριασμό Google του διαχειριστή.</p>
            <ion-button (click)="login()">Σύνδεση με Google</ion-button>
          </div>
        } @else {
          <p class="who">Συνδεδεμένος ως <b>{{ user()!.email }}</b></p>

          @if (message(); as m) {
            <div class="box" [class.warn]="m.kind === 'error'" [class.ok]="m.kind === 'ok'">{{ m.text }}</div>
          }

          @if (loading()) {
            <ion-spinner />
          } @else if (!beaches().length) {
            <div class="box">
              <p><b>Η βάση είναι άδεια.</b> Πάτα το κουμπί για να περάσουν οι {{ seedCount }} παραλίες της εφαρμογής.</p>
              <ion-button (click)="importSeed()" [disabled]="saving()">Εισαγωγή {{ seedCount }} παραλιών</ion-button>
            </div>
          } @else if (!edit()) {
            <!-- ΛΙΣΤΑ -->
            <div class="bar">
              <ion-searchbar placeholder="Αναζήτηση" (ionInput)="query.set($any($event.detail.value) ?? '')" />
              <ion-button (click)="newBeach()">+ Νέα παραλία</ion-button>
              <ion-button fill="outline" (click)="exportJson()">Κατέβασε αντίγραφο (JSON)</ion-button>
            </div>
            <p class="hint">{{ beaches().length }} παραλίες · πάτα μία για επεξεργασία</p>
            <ul class="list">
              @for (b of filtered(); track b.id) {
                <li (click)="open(b)" [class.off]="!b.active">
                  <span class="nm">{{ b.name.el }}</span>
                  <span class="meta">{{ b.area.el }} · βλέπει {{ dirLabel(b.facing) }}{{ b.active ? '' : ' · κρυφή' }}</span>
                </li>
              }
            </ul>
          } @else {
            <!-- ΦΟΡΜΑ -->
            @let e = edit()!;
            <div class="bar">
              <ion-button fill="clear" (click)="close()">← Πίσω στη λίστα</ion-button>
            </div>
            <h2>{{ isNew() ? 'Νέα παραλία' : e.name.el }}</h2>

            <div class="grid">
              <div>
                <div #map class="map"></div>
                <p class="hint">
                  🖐️ <b>Σύρε</b> τον δείκτη στη σωστή θέση.<br />
                  🌊 <b>Πάτα πάνω στη θάλασσα</b> μπροστά από την παραλία για να οριστεί προς τα πού κοιτάει (μπλε γραμμή).
                </p>
              </div>

              <div class="form">
                <label>Κωδικός (id)
                  <input [(ngModel)]="e.id" [disabled]="!isNew()" placeholder="π.χ. faneromeni" />
                  @if (isNew()) { <small>λατινικά πεζά, χωρίς κενά — δεν αλλάζει μετά</small> }
                </label>
                <div class="row">
                  <label>Όνομα (ΕΛ)<input [(ngModel)]="e.name.el" /></label>
                  <label>Όνομα (EN)<input [(ngModel)]="e.name.en" /></label>
                </div>
                <div class="row">
                  <label>Περιοχή (ΕΛ)<input [(ngModel)]="e.area.el" /></label>
                  <label>Περιοχή (EN)<input [(ngModel)]="e.area.en" /></label>
                </div>
                <div class="row">
                  <label>Γεωγρ. πλάτος (lat)<input type="number" step="0.0001" [(ngModel)]="e.lat" (ngModelChange)="syncMap()" /></label>
                  <label>Γεωγρ. μήκος (lon)<input type="number" step="0.0001" [(ngModel)]="e.lon" (ngModelChange)="syncMap()" /></label>
                </div>

                <label>Προς τα πού κοιτάει: <b>{{ e.facing }}° ({{ dirLabel(e.facing) }})</b></label>
                <div class="dirs">
                  @for (d of dirs; track d) {
                    <button type="button" [class.on]="dirLabel(e.facing) === dirLabel(d)" (click)="e.facing = d; syncMap()">{{ dirLabel(d) }}</button>
                  }
                </div>

                <label>Πόσο ανοιχτή στο πέλαγος: <b>{{ exposureLabel(e.exposure) }}</b>
                  <input type="range" min="0.2" max="1" step="0.05" [(ngModel)]="e.exposure" />
                  <small>αριστερά: κλειστός κόλπος (σχεδόν πάντα ήρεμα) · δεξιά: ανοιχτό πέλαγος</small>
                </label>

                <div class="row">
                  <label>Ακτή
                    <select [(ngModel)]="e.surface">
                      <option [ngValue]="null">Άγνωστο</option>
                      <option ngValue="sand">Άμμος</option>
                      <option ngValue="pebbles">Βότσαλο</option>
                      <option ngValue="mixed">Άμμος & βότσαλο</option>
                    </select>
                  </label>
                  <label>Οργανωμένη
                    <select [(ngModel)]="e.organized">
                      <option [ngValue]="null">Άγνωστο</option>
                      <option [ngValue]="true">Ναι</option>
                      <option [ngValue]="false">Όχι</option>
                    </select>
                  </label>
                </div>

                <label>Χαρακτηριστικά</label>
                <div class="tags">
                  @for (t of tagList; track t.key) {
                    <button type="button" [class.on]="e.tags.includes(t.key)" (click)="toggleTag(e, t.key)">{{ t.label }}</button>
                  }
                </div>

                <label>Περιγραφή (ΕΛ)<textarea rows="3" [(ngModel)]="e.desc.el"></textarea></label>
                <label>Περιγραφή (EN)<textarea rows="3" [(ngModel)]="e.desc.en"></textarea></label>

                <label class="check"><input type="checkbox" [(ngModel)]="e.active" /> Εμφανίζεται στην εφαρμογή</label>

                <div class="actions">
                  <ion-button (click)="save()" [disabled]="saving()">
                    @if (saving()) { <ion-spinner name="dots" /> } @else { Αποθήκευση }
                  </ion-button>
                  <ion-button fill="outline" (click)="close()">Ακύρωση</ion-button>
                  @if (!isNew()) {
                    <ion-button fill="clear" color="danger" class="del" (click)="confirmDelete.set(true)" [disabled]="saving()">Διαγραφή</ion-button>
                  }
                </div>
                @if (confirmDelete()) {
                  <div class="box warn confirm">
                    <p><b>Να σβηστεί οριστικά η παραλία «{{ e.name.el }}»;</b><br />
                      Δεν γίνεται αναίρεση. Αν θες απλώς να μη φαίνεται, βγάλε το τικ «Εμφανίζεται στην εφαρμογή».</p>
                    <ion-button color="danger" (click)="remove()" [disabled]="saving()">
                      @if (saving()) { <ion-spinner name="dots" /> } @else { Ναι, διαγραφή }
                    </ion-button>
                    <ion-button fill="outline" (click)="confirmDelete.set(false)">Όχι</ion-button>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .wrap { max-width: 1100px; margin: 0 auto; }
    .box { background: var(--ion-color-light); border-radius: 12px; padding: 14px 16px; margin: 10px 0; }
    .box.warn { background: #fdecea; color: #7a1c1c; }
    .box.ok { background: #e7f6ec; color: #145a32; }
    .del { margin-left: auto; }
    .confirm p { margin: 0 0 10px; }
    .who { color: var(--ion-color-medium); font-size: 14px; }
    .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .bar ion-searchbar { flex: 1; min-width: 220px; padding: 0; }
    .hint { font-size: 13px; color: var(--ion-color-medium); }
    .list { list-style: none; padding: 0; margin: 0; columns: 2 320px; }
    .list li { break-inside: avoid; padding: 10px 12px; border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; }
    .list li:hover { background: var(--ion-color-light); }
    .list li.off { opacity: .5; }
    .nm { font-weight: 600; }
    .meta { font-size: 12px; color: var(--ion-color-medium); }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    .map { height: 420px; border-radius: 12px; }
    .form { display: flex; flex-direction: column; gap: 10px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; }
    label.check { flex-direction: row; align-items: center; font-weight: 500; }
    small { font-weight: 400; color: var(--ion-color-medium); }
    input, select, textarea { font: inherit; font-weight: 400; padding: 8px 10px; border: 1px solid var(--ion-color-light-shade); border-radius: 8px;
      background: var(--ion-background-color, #fff); color: inherit; }
    input[type=range] { padding: 0; border: 0; }
    input:disabled { opacity: .6; }
    .dirs, .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .dirs button, .tags button { font: inherit; font-size: 13px; padding: 6px 10px; border-radius: 999px; cursor: pointer;
      border: 1px solid var(--ion-color-primary); background: transparent; color: var(--ion-color-primary); }
    .dirs button { min-width: 44px; }
    .dirs button.on, .tags button.on { background: var(--ion-color-primary); color: #fff; }
    .actions { display: flex; gap: 8px; margin-top: 6px; }
    code { background: rgba(0,0,0,.06); padding: 1px 4px; border-radius: 4px; }
  `],
})
export class AdminPage implements OnDestroy {
  private zone = inject(NgZone);
  @ViewChild('map') set mapRef(el: ElementRef<HTMLDivElement> | undefined) {
    if (el) setTimeout(() => this.initMap(el.nativeElement));
    else this.destroyMap();
  }

  readonly configured = firebaseConfigured();
  readonly seedCount = (seed.beaches as unknown[]).length;
  readonly tagList = TAGS;
  readonly dirs = DIRS;

  authReady = signal(false);
  user = signal<User | null>(null);
  loading = signal(false);
  saving = signal(false);
  message = signal<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);
  confirmDelete = signal(false);
  beaches = signal<BeachDoc[]>([]);
  edit = signal<BeachDoc | null>(null);
  isNew = signal(false);
  query = signal('');

  filtered = computed(() => {
    const q = fold(this.query());
    return this.beaches().filter((b) => !q || fold(`${b.name.el} ${b.name.en} ${b.area.el} ${b.id}`).includes(q));
  });

  private app?: FirebaseApp;
  private auth?: Auth;
  private db?: Firestore;
  private unsub?: () => void;
  private map?: L.Map;
  private marker?: L.Marker;
  private facingLine?: L.Polyline;

  constructor() {
    if (!this.configured) return;
    this.app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.unsub = onAuthStateChanged(this.auth, (u) =>
      this.zone.run(() => {
        this.user.set(u);
        this.authReady.set(true);
        if (u) this.load();
      }),
    );
  }

  async login() {
    try {
      await signInWithPopup(this.auth!, new GoogleAuthProvider());
    } catch (e: any) {
      this.fail('Η σύνδεση απέτυχε', e);
    }
  }

  async logout() {
    await signOut(this.auth!);
    this.beaches.set([]);
    this.edit.set(null);
  }

  async load() {
    this.loading.set(true);
    try {
      const snap = await getDocs(collection(this.db!, BEACHES_COLLECTION));
      const list = snap.docs.map((d) => normalize({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.order - b.order || a.name.el.localeCompare(b.name.el, 'el'));
      this.beaches.set(list);
    } catch (e) {
      this.fail('Δεν ήταν δυνατή η ανάγνωση της βάσης', e);
    } finally {
      this.loading.set(false);
    }
  }

  async importSeed() {
    this.saving.set(true);
    try {
      const batch = writeBatch(this.db!);
      (seed.beaches as any[]).forEach((b, i) => {
        const d = normalize({ ...b, active: b.active !== false, order: (i + 1) * 10 });
        batch.set(doc(this.db!, BEACHES_COLLECTION, d.id), strip(d));
      });
      batch.set(doc(this.db!, META_DOC), { version: Date.now() });
      await batch.commit();
      this.message.set({ kind: 'ok', text: `Έγινε εισαγωγή ${this.seedCount} παραλιών. Η εφαρμογή τις διαβάζει πλέον από τη βάση.` });
      await this.load();
    } catch (e) {
      this.fail('Η εισαγωγή απέτυχε', e);
    } finally {
      this.saving.set(false);
    }
  }

  open(b: BeachDoc) {
    this.message.set(null);
    this.isNew.set(false);
    this.confirmDelete.set(false);
    this.edit.set(structuredClone(b));
  }

  newBeach() {
    this.message.set(null);
    this.isNew.set(true);
    this.confirmDelete.set(false);
    const maxOrder = Math.max(0, ...this.beaches().map((b) => b.order));
    this.edit.set(normalize({ id: '', lat: 39.2, lon: 26.25, facing: 180, exposure: 1, active: true, order: maxOrder + 10 }));
  }

  close() {
    this.edit.set(null);
    this.confirmDelete.set(false);
  }

  /** Οριστική διαγραφή (μετά από επιβεβαίωση). Αλλάζει και την έκδοση, για να ενημερωθούν τα κινητά. */
  async remove() {
    const e = this.edit();
    if (!e || this.isNew()) return;
    this.saving.set(true);
    try {
      const batch = writeBatch(this.db!);
      batch.delete(doc(this.db!, BEACHES_COLLECTION, e.id));
      batch.set(doc(this.db!, META_DOC), { version: Date.now() });
      await batch.commit();
      this.message.set({ kind: 'ok', text: `Διαγράφηκε: ${e.name.el}. Η εφαρμογή δεν θα τη δείχνει από το επόμενο άνοιγμα.` });
      this.close();
      await this.load();
    } catch (err) {
      this.fail('Η διαγραφή απέτυχε', err);
    } finally {
      this.saving.set(false);
    }
  }

  async save() {
    const e = this.edit();
    if (!e) return;
    e.id = e.id.trim().toLowerCase();
    const problem =
      !/^[a-z0-9][a-z0-9-]*$/.test(e.id) ? 'Ο κωδικός (id) θέλει λατινικά πεζά, αριθμούς ή παύλες, χωρίς κενά.' :
      this.isNew() && this.beaches().some((b) => b.id === e.id) ? 'Υπάρχει ήδη παραλία με αυτόν τον κωδικό.' :
      !e.name.el.trim() ? 'Συμπλήρωσε το ελληνικό όνομα.' :
      !(e.lat > 38.8 && e.lat < 39.6 && e.lon > 25.7 && e.lon < 26.8) ? 'Οι συντεταγμένες δεν είναι πάνω στη Λέσβο.' :
      null;
    if (problem) {
      this.message.set({ kind: 'error', text: problem });
      return;
    }
    if (!e.name.en.trim()) e.name.en = e.name.el;
    this.saving.set(true);
    try {
      const batch = writeBatch(this.db!);
      batch.set(doc(this.db!, BEACHES_COLLECTION, e.id), strip(normalize(e)));
      batch.set(doc(this.db!, META_DOC), { version: Date.now() });
      await batch.commit();
      this.message.set({ kind: 'ok', text: `Αποθηκεύτηκε: ${e.name.el}. Η εφαρμογή θα το δείξει στο επόμενο άνοιγμα.` });
      this.edit.set(null);
      await this.load();
    } catch (err) {
      this.fail('Η αποθήκευση απέτυχε', err);
    } finally {
      this.saving.set(false);
    }
  }

  toggleTag(e: BeachDoc, key: string) {
    e.tags = e.tags.includes(key) ? e.tags.filter((t) => t !== key) : [...e.tags, key];
  }

  /** Αντίγραφο ασφαλείας στη μορφή του data/beaches.json. */
  exportJson() {
    const out = { _help: (seed as any)._help ?? [], beaches: this.beaches().map(strip) };
    const blob = new Blob([JSON.stringify(out, null, 2) + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'beaches.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  dirLabel(d: number) {
    return compass(d, 'el');
  }

  exposureLabel(x: number) {
    return x >= 0.85 ? 'ανοιχτό πέλαγος' : x >= 0.6 ? 'λίγο προστατευμένη' : x >= 0.4 ? 'όρμος' : 'κλειστός κόλπος';
  }

  // ---------- χάρτης φόρμας ----------
  private initMap(el: HTMLDivElement) {
    const e = this.edit();
    if (!e || this.map) return;
    this.map = L.map(el).setView([e.lat, e.lon], this.isNew() ? 10 : 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(this.map);
    const icon = L.divIcon({ className: 'beach-marker', html: '<div class="dot" style="background:#0b6e99"></div>', iconSize: [26, 26], iconAnchor: [13, 13] });
    this.marker = L.marker([e.lat, e.lon], { draggable: true, icon }).addTo(this.map);
    this.facingLine = L.polyline([], { color: '#1e88e5', weight: 4 }).addTo(this.map);
    this.marker.on('drag', () => {
      const cur = this.edit();
      if (!cur) return;
      const p = this.marker!.getLatLng();
      cur.lat = round(p.lat);
      cur.lon = round(p.lng);
      this.drawFacing();
    });
    // Ενημέρωση των πεδίων lat/lon της φόρμας όταν αφήσεις τον δείκτη.
    this.marker.on('dragend', () => this.zone.run(() => undefined));
    this.map.on('click', (ev: L.LeafletMouseEvent) =>
      this.zone.run(() => {
        const cur = this.edit();
        if (!cur) return;
        cur.facing = Math.round(bearing(cur.lat, cur.lon, ev.latlng.lat, ev.latlng.lng)) % 360;
        this.drawFacing();
      }),
    );
    this.drawFacing();
  }

  syncMap() {
    const e = this.edit();
    if (!e || !this.map || !this.marker) return;
    if (Number.isFinite(e.lat) && Number.isFinite(e.lon)) {
      this.marker.setLatLng([e.lat, e.lon]);
      this.map.panTo([e.lat, e.lon]);
    }
    this.drawFacing();
  }

  private drawFacing() {
    const e = this.edit();
    if (!e || !this.facingLine) return;
    const len = 0.006; // ~600 μ.
    const rad = (e.facing * Math.PI) / 180;
    const end: L.LatLngExpression = [e.lat + len * Math.cos(rad), e.lon + (len * Math.sin(rad)) / Math.cos((e.lat * Math.PI) / 180)];
    this.facingLine.setLatLngs([[e.lat, e.lon], end]);
  }

  private destroyMap() {
    this.map?.remove();
    this.map = undefined;
    this.marker = undefined;
    this.facingLine = undefined;
  }

  private fail(what: string, e: any) {
    console.error(what, e);
    const code = String(e?.code ?? '');
    const text = code.includes('permission-denied')
      ? `${what}: ο λογαριασμός ${this.user()?.email ?? ''} δεν έχει δικαίωμα αλλαγών. Έλεγξε ότι το email σου είναι γραμμένο στους κανόνες του Firestore (Rules).`
      : code.includes('unauthorized-domain')
        ? `${what}: η διεύθυνση ${location.hostname} δεν είναι εγκεκριμένη. Πρόσθεσέ την στο Firebase: Authentication → Settings → Authorized domains.`
        : code.includes('popup-closed') || code.includes('cancelled-popup')
          ? 'Η σύνδεση ακυρώθηκε.'
          : `${what}: ${e?.message ?? e}`;
    this.message.set({ kind: 'error', text });
  }

  ngOnDestroy() {
    this.unsub?.();
    this.destroyMap();
  }
}

/** Συμπληρώνει κενά πεδία ώστε η φόρμα να δουλεύει πάντα. */
function normalize(r: any): BeachDoc {
  const text = (o: any) => ({ el: String(o?.el ?? ''), en: String(o?.en ?? '') });
  return {
    id: String(r.id ?? ''),
    name: text(r.name),
    area: text(r.area),
    lat: Number(r.lat) || 0,
    lon: Number(r.lon) || 0,
    facing: ((Math.round(Number(r.facing) || 0) % 360) + 360) % 360,
    exposure: Math.min(1, Math.max(0, Number(r.exposure ?? 1))),
    surface: ['sand', 'pebbles', 'mixed'].includes(r.surface) ? r.surface : null,
    organized: typeof r.organized === 'boolean' ? r.organized : null,
    tags: Array.isArray(r.tags) ? r.tags.filter((t: unknown) => typeof t === 'string') : [],
    desc: text(r.desc),
    active: r.active !== false,
    order: Number(r.order) || 0,
  };
}

/** Απλό αντικείμενο για αποθήκευση (το id μένει και ως πεδίο, για το αντίγραφο JSON). */
function strip(b: BeachDoc) {
  return { ...b, name: { ...b.name }, area: { ...b.area }, desc: { ...b.desc }, tags: [...b.tags] };
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const y = Math.sin((lon2 - lon1) * r) * Math.cos(lat2 * r);
  const x = Math.cos(lat1 * r) * Math.sin(lat2 * r) - Math.sin(lat1 * r) * Math.cos(lat2 * r) * Math.cos((lon2 - lon1) * r);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

function round(x: number) {
  return Math.round(x * 1e5) / 1e5;
}

function fold(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
