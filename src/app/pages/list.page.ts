import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonChip,
  IonSegment, IonSegmentButton, IonButtons, IonButton, IonNote,
} from '@ionic/angular/standalone';
import { AppState, BeachView } from '../services/app-state.service';
import { LEVEL_COLORS } from '../services/sea';
import { TimePickerComponent } from '../components/time-picker.component';
import { DictKey } from '../services/i18n';

type Filter = 'fav' | 'organized' | 'sand' | 'family' | 'quiet' | 'snorkel' | 'hotspring' | 'nudist' | 'tavern';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar, IonList, IonItem, IonLabel, IonChip,
    IonSegment, IonSegmentButton, IonButtons, IonButton, IonNote, RouterLink, TimePickerComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ state.t('tabList') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="state.toggleLang()">{{ state.t('language') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar><app-time-picker /></ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-searchbar [placeholder]="state.t('search')" (ionInput)="query.set($any($event.detail.value) ?? '')" />

      <ion-segment [value]="sort()" (ionChange)="setSort($any($event.detail.value))">
        <ion-segment-button value="calm">{{ state.t('calmFirst') }}</ion-segment-button>
        <ion-segment-button value="near">{{ state.t('nearestFirst') }}</ion-segment-button>
      </ion-segment>

      <div class="chips">
        @for (f of filterList; track f.key) {
          <ion-chip [outline]="!filters().has(f.key)" color="primary" (click)="toggle(f.key)">
            {{ f.icon }} {{ state.t(f.label) }}
          </ion-chip>
        }
      </div>

      <ion-list>
        @for (v of items(); track v.beach.id) {
          <ion-item [routerLink]="['/beach', v.beach.id]" detail>
            <span class="dot" slot="start" [style.background]="v.sea ? colors[v.sea.level] : '#7a8794'"></span>
            <ion-label>
              <h2>@if (v.favorite) {<span class="star">★ </span>}{{ v.beach.name[state.lang()] }}</h2>
              <p>
                {{ v.beach.area[state.lang()] }}
                @if (v.distanceKm != null) { · {{ v.distanceKm.toFixed(0) }} {{ state.t('km') }} }
              </p>
              @if (v.sea && v.weather) {
                <p class="cond">{{ state.t($any('level' + v.sea.level)) }} · 💨 {{ v.weather.windSpeed.toFixed(0) }} km/h</p>
              }
            </ion-label>
          </ion-item>
        } @empty {
          <ion-item><ion-note>—</ion-note></ion-item>
        }
      </ion-list>
    </ion-content>
  `,
  styles: [`
    .chips { padding: 4px 8px; display: flex; flex-wrap: wrap; }
    .dot { width: 14px; height: 14px; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(0,0,0,.15); }
    .star { color: #f5a623; }
    .cond { font-weight: 600; color: var(--ion-color-dark) !important; }
    ion-segment { padding: 0 12px; }
  `],
})
export class ListPage {
  state = inject(AppState);
  colors = LEVEL_COLORS;
  query = signal('');
  sort = signal<'calm' | 'near'>('calm');
  filters = signal<Set<Filter>>(new Set());

  filterList: { key: Filter; label: DictKey; icon: string }[] = [
    { key: 'fav', label: 'favorites', icon: '★' },
    { key: 'organized', label: 'organized', icon: '⛱️' },
    { key: 'sand', label: 'sand', icon: '🏖️' },
    { key: 'family', label: 'tag_family', icon: '👨‍👩‍👧' },
    { key: 'quiet', label: 'tag_quiet', icon: '🤫' },
    { key: 'tavern', label: 'tag_tavern', icon: '🐟' },
    { key: 'snorkel', label: 'tag_snorkel', icon: '🤿' },
    { key: 'hotspring', label: 'tag_hotspring', icon: '♨️' },
    { key: 'nudist', label: 'tag_nudist', icon: '🌿' },
  ];

  items = computed(() => {
    const q = normalize(this.query());
    const f = this.filters();
    let list = this.state.views().filter((v) => {
      if (q && !normalize(v.beach.name.el + ' ' + v.beach.name.en + ' ' + v.beach.area.el + ' ' + v.beach.area.en).includes(q)) return false;
      for (const k of f) {
        if (k === 'fav' && !v.favorite) return false;
        if (k === 'organized' && !v.beach.organized) return false;
        if (k === 'sand' && v.beach.surface !== 'sand') return false;
        if (!['fav', 'organized', 'sand'].includes(k) && !v.beach.tags.includes(k as any)) return false;
      }
      return true;
    });
    const byCalm = (a: BeachView, b: BeachView) => (a.sea?.index ?? 99) - (b.sea?.index ?? 99);
    const byNear = (a: BeachView, b: BeachView) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    list = [...list].sort(this.sort() === 'near' && this.state.position() ? byNear : byCalm);
    return list;
  });


  async setSort(s: 'calm' | 'near') {
    this.sort.set(s);
    if (s === 'near' && !this.state.position()) await this.state.locate(true);
  }

  toggle(k: Filter) {
    const s = new Set(this.filters());
    s.has(k) ? s.delete(k) : s.add(k);
    this.filters.set(s);
  }
}

/** Αφαιρεί τόνους και πεζά-κεφαλαία για αναζήτηση. */
function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
