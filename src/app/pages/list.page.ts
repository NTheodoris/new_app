import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonToolbar, IonContent, IonIcon } from '@ionic/angular/standalone';
import { AppState, BeachView } from '../services/app-state.service';
import { TimePickerComponent } from '../components/time-picker.component';
import { AppHeaderComponent } from '../components/app-header.component';
import { WaterlineComponent } from '../components/waterline.component';
import { DictKey } from '../services/i18n';
import { beaufort } from '../services/sea';

type Filter = 'fav' | 'organized' | 'sand' | 'blueflag' | 'sunset' | 'family' | 'quiet' | 'snorkel' | 'hotspring' | 'nudist' | 'tavern';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    IonToolbar, IonContent, IonIcon, RouterLink, TimePickerComponent, AppHeaderComponent, WaterlineComponent,
  ],
  template: `
    <app-header [title]="state.t('tabList')">
      <ion-toolbar><app-time-picker /></ion-toolbar>
    </app-header>
    <ion-content>
      <div class="tools">
        <label class="search">
          <ion-icon name="search" aria-hidden="true" />
          <input type="search" [placeholder]="state.t('search')" [value]="query()" (input)="query.set($any($event.target).value)" />
        </label>
        <div class="sort" role="tablist">
          <button role="tab" [class.on]="sort() === 'calm'" [attr.aria-selected]="sort() === 'calm'" (click)="setSort('calm')">{{ state.t('calmFirst') }}</button>
          <button role="tab" [class.on]="sort() === 'near'" [attr.aria-selected]="sort() === 'near'" (click)="setSort('near')">{{ state.t('nearestFirst') }}</button>
        </div>
        <div class="chips">
          @for (f of filterList; track f.key) {
            <button class="chip" [class.on]="filters().has(f.key)" [attr.aria-pressed]="filters().has(f.key)" (click)="toggle(f.key)">
              @if (f.key === 'blueflag') {<svg class="bflag" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 1.5v13" stroke="#5b7385" stroke-width="1.6" stroke-linecap="round"/><path d="M3.8 2.2h9.4l-2.3 3.1 2.3 3.1H3.8z" fill="#1565c0"/></svg>} @else { {{ f.icon }} } {{ state.t(f.label) }}
            </button>
          }
        </div>
      </div>

      <ul class="rows">
        @for (v of items(); track v.beach.id) {
          <li>
            <a class="row" [routerLink]="['/beach', v.beach.id]">
              <span class="tile" [style.background]="v.sea ? 'var(--lv' + v.sea.level + '-tint)' : 'var(--lg-foam)'">
                @if (v.sea) { <app-waterline [level]="v.sea.level" [width]="28" [height]="18" [waves]="2" [stroke]="2.6" /> }
              </span>
              <span class="txt">
                <span class="nm">{{ state.txt(v.beach.name) }}@if (state.blueFlag(v.beach)) {<span class="bf-wrap" [attr.aria-label]="state.t('blueFlag')"><svg class="bflag" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M3 1.5v13" stroke="#5b7385" stroke-width="1.6" stroke-linecap="round"/><path d="M3.8 2.2h9.4l-2.3 3.1 2.3 3.1H3.8z" fill="#1565c0"/></svg></span>}@if (v.favorite) {<span class="star"> ★</span>}</span>
                <span class="ar">{{ state.txt(v.beach.area) }}@if (v.distanceKm != null) {, {{ v.distanceKm.toFixed(0) }} {{ state.t('km') }}}</span>
              </span>
              @if (v.sea && v.weather) {
                <span class="right">
                  <span class="vd" [style.color]="'var(--lv' + v.sea.level + '-ink)'">{{ state.t($any('legend' + v.sea.level)) }}</span>
                  <span class="wd">{{ v.weather.windSpeed.toFixed(0) }} km/h · {{ bf(v.weather.windSpeed) }} {{ state.t('bft') }}</span>
                </span>
              }
            </a>
          </li>
        } @empty {
          <li class="empty">{{ state.t('noResults') }}</li>
        }
      </ul>
    </ion-content>
  `,
  styles: [`
    .tools { padding: 4px 12px 0; }
    .search {
      display: flex; align-items: center; gap: 8px; margin: 4px 4px 10px; padding: 0 14px; height: 46px;
      background: var(--lg-surface); border: 1px solid var(--lg-line); border-radius: 14px;
    }
    .search:focus-within { border-color: var(--lg-sea); box-shadow: 0 0 0 3px rgba(1,106,169,.15); }
    .search ion-icon { font-size: 19px; color: var(--lg-muted); flex: none; }
    .search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font: inherit; font-size: 16px; color: var(--lg-ink); }
    .search input::placeholder { color: var(--lg-muted); }
    .sort { display: flex; background: var(--ion-color-light); border-radius: 12px; padding: 3px; margin: 0 4px; }
    .sort button {
      flex: 1; font: inherit; font-size: 14px; font-weight: 600; color: var(--lg-muted);
      background: transparent; border: 0; border-radius: 10px; padding: 8px 6px;
    }
    .sort button.on { background: var(--lg-surface); color: var(--lg-ink); box-shadow: 0 1px 3px rgba(10,53,80,.15); }
    .chips { display: flex; gap: 6px; overflow-x: auto; padding: 10px 4px 6px; scrollbar-width: none; }
    .chips::-webkit-scrollbar { display: none; }
    .chip {
      flex: none; font: inherit; font-size: 13px; font-weight: 600; color: var(--lg-ink); white-space: nowrap;
      background: var(--lg-surface); border: 1px solid var(--lg-line); border-radius: 999px; padding: 7px 12px;
    }
    .chip.on { background: var(--lg-sea); border-color: var(--lg-sea); color: #fff; }
    button:focus-visible, .row:focus-visible { outline: 2px solid var(--lg-sea); outline-offset: 2px; }

    .rows { list-style: none; margin: 6px 12px 16px; padding: 0; background: var(--lg-surface); border-radius: 18px; overflow: hidden; }
    .rows li + li .row { border-top: 1px solid var(--lg-line); }
    .row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; color: inherit; text-decoration: none; }
    .tile { flex: none; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; }
    .tile app-waterline { width: 28px; height: 18px; }
    .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .nm { font-size: 16px; font-weight: 650; color: var(--lg-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .star { color: var(--lg-sun); }
    .ar { font-size: 13px; color: var(--lg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .right { flex: none; display: flex; flex-direction: column; align-items: flex-end; }
    .vd { font-size: 14px; font-weight: 720; }
    .wd { font-size: 12px; color: var(--lg-muted); font-variant-numeric: tabular-nums; }
    .chip .bflag { vertical-align: -2px; margin-right: 2px; }
    .chip.on .bflag path { fill: #fff; stroke: #fff; }
    .chip.on .bflag path:first-child { fill: none; }
    .bf-wrap { display: inline-block; margin-left: 5px; vertical-align: -1px; }
    .bf-wrap svg { display: block; width: 13px; height: 13px; }
    .empty { padding: 20px; color: var(--lg-muted); text-align: center; }
  `],
})
export class ListPage {
  state = inject(AppState);
  bf = beaufort;
  query = signal('');
  sort = signal<'calm' | 'near'>('calm');
  filters = signal<Set<Filter>>(new Set());

  filterList: { key: Filter; label: DictKey; icon: string }[] = [
    { key: 'fav', label: 'favorites', icon: '★' },
    { key: 'organized', label: 'organized', icon: '⛱️' },
    { key: 'sand', label: 'sand', icon: '🏖️' },
    { key: 'blueflag', label: 'blueFlag', icon: '' },
    { key: 'sunset', label: 'sunsetTonight', icon: '🌅' },
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
        if (k === 'blueflag' && !this.state.blueFlag(v.beach)) return false;
        if (k === 'sunset' && !this.state.sunsetFor(v.beach)?.overSea) return false;
        if (!['fav', 'organized', 'sand', 'blueflag', 'sunset'].includes(k) && !v.beach.tags.includes(k as any)) return false;
      }
      return true;
    });
    const calm = (v: BeachView) => (v.sea ? v.sea.level * 1000 + v.sea.index : 9999);
    const byCalm = (a: BeachView, b: BeachView) => calm(a) - calm(b);
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
