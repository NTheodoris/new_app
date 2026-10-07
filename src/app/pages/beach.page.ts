import { Component, computed, inject, input } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonChip,
} from '@ionic/angular/standalone';
import { AppState } from '../services/app-state.service';
import { LEVEL_COLORS, compass, seaCondition } from '../services/sea';
import { BeachSummaryComponent } from '../components/beach-summary.component';
import { TimePickerComponent } from '../components/time-picker.component';

@Component({
  selector: 'app-beach',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonChip,
    BeachSummaryComponent, TimePickerComponent,
  ],
  template: `
    @if (view(); as v) {
      @let lang = state.lang();
      <ion-header>
        <ion-toolbar color="primary">
          <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/map" /></ion-buttons>
          <ion-title>{{ v.beach.name[lang] }}</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="state.toggleFavorite(v.beach.id)" [attr.aria-label]="state.t('favorite')">
              <ion-icon [name]="v.favorite ? 'star' : 'star-outline'" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar><app-time-picker /></ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <app-beach-summary [view]="v" [showDetails]="false" />

        <div class="compass-row">
          <svg viewBox="-60 -60 120 120" class="compass" role="img" [attr.aria-label]="state.t('facing')">
            <circle r="52" class="ring" />
            @for (c of cardinals; track c.d) {
              <text [attr.x]="52 * sin(c.d) * 0.82" [attr.y]="-52 * cos(c.d) * 0.82 + 4" text-anchor="middle" class="card">{{ c[lang] }}</text>
            }
            <!-- θάλασσα: τομέας προς τον οποίο κοιτάει η παραλία -->
            <path [attr.d]="seaSector(v.beach.facing)" class="sea" />
            <!-- άνεμος: βέλος από την κατεύθυνση που φυσάει προς το κέντρο -->
            @if (v.weather; as w) {
              <g [attr.transform]="'rotate(' + w.windDir + ')'">
                <line x1="0" y1="-48" x2="0" y2="-8" class="wind" />
                <path d="M -6 -16 L 0 -6 L 6 -16 Z" class="wind-head" />
              </g>
            }
            <circle r="5" class="beach" />
          </svg>
          <div class="legend">
            <div><span class="sw sea"></span> {{ state.t('facing') }} <b>{{ dir(v.beach.facing) }}</b></div>
            @if (v.weather; as w) {
              <div><span class="sw wind"></span> {{ state.t('wind') }} {{ state.t('from') }} <b>{{ dir(w.windDir) }}</b></div>
              @if (w.waveHeight != null) {
                <div>🌊 {{ state.t('waveOffshore') }}: <b>{{ w.waveHeight.toFixed(1) }} m</b></div>
              }
              @if (w.temp != null) { <div>🌡️ {{ state.t('airTemp') }}: <b>{{ w.temp.toFixed(0) }}°C</b></div> }
            }
          </div>
        </div>

        <h3 id="hours">{{ state.t('next24') }}</h3>
        <div class="hours">
          @for (h of hours(); track h.i) {
            <button class="hour" [class.sel]="h.i === state.hourIndex()" (click)="state.hourIndex.set(h.i)">
              <span class="t">{{ h.label }}</span>
              <span class="bar" [style.background]="colors[h.level]" [style.height.px]="14 + h.level * 12"></span>
              <span class="w">{{ h.wind }}</span>
              <span class="d">{{ h.dir }}</span>
            </button>
          }
        </div>

        <p class="desc">{{ v.beach.desc[lang] }}</p>

        <div class="chips">
          @if (v.beach.surface) { <ion-chip>{{ state.t(v.beach.surface) }}</ion-chip> }
          @if (v.beach.organized) { <ion-chip>⛱️ {{ state.t('organized') }}</ion-chip> }
          @for (tag of v.beach.tags; track tag) {
            <ion-chip>{{ state.t($any('tag_' + tag)) }}</ion-chip>
          }
        </div>

        <p class="note">{{ state.t('dataNote') }}</p>
      </ion-content>
    }
  `,
  styles: [`
    .compass-row { display: flex; gap: 16px; align-items: center; margin: 16px 0 8px; }
    .compass { width: 130px; height: 130px; flex: none; }
    .ring { fill: none; stroke: var(--ion-color-light-shade); stroke-width: 1.5; }
    .card { font-size: 10px; fill: var(--ion-color-medium); font-weight: 700; }
    .sea { fill: rgba(30, 136, 229, .25); stroke: #1e88e5; stroke-width: 1; }
    .wind { stroke: #455a64; stroke-width: 3; stroke-linecap: round; }
    .wind-head { fill: #455a64; }
    .beach { fill: #f5c26b; stroke: #a0782b; }
    .legend { font-size: 13px; display: grid; gap: 4px; }
    .sw { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -1px; }
    .sw.sea { background: rgba(30,136,229,.35); border: 1px solid #1e88e5; }
    .sw.wind { background: #455a64; }
    h3 { font-size: 15px; margin: 18px 0 6px; }
    .hours { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 6px; }
    .hour {
      flex: none; width: 40px; display: flex; flex-direction: column; align-items: center; gap: 3px;
      background: none; border: 1px solid transparent; border-radius: 8px; padding: 4px 0; color: inherit; font: inherit;
    }
    .hour.sel { border-color: var(--ion-color-primary); background: rgba(0,0,0,.03); }
    .hour .t { font-size: 11px; color: var(--ion-color-medium); }
    .hour .bar { width: 16px; border-radius: 4px; margin-top: auto; }
    .hour .w { font-size: 12px; font-weight: 700; }
    .hour .d { font-size: 10px; color: var(--ion-color-medium); }
    .desc { font-size: 15px; line-height: 1.5; }
    .chips { display: flex; flex-wrap: wrap; }
    .note { font-size: 11px; color: var(--ion-color-medium); margin-top: 16px; }
  `],
})
export class BeachPage {
  state = inject(AppState);
  /** Παράμετρος διαδρομής :id */
  id = input.required<string>();

  colors = LEVEL_COLORS;
  cardinals = [
    { d: 0, el: 'Β', en: 'N' }, { d: 90, el: 'Α', en: 'E' },
    { d: 180, el: 'Ν', en: 'S' }, { d: 270, el: 'Δ', en: 'W' },
  ];

  view = computed(() => this.state.views().find((v) => v.beach.id === this.id()) ?? null);

  hours = computed(() => {
    const v = this.view();
    if (!v) return [];
    const all = this.state.hourlyFor(v.beach.id);
    const start = this.state.nowIndex();
    return all.slice(start, start + 24).map((w, k) => ({
      i: start + k,
      label: w.time.slice(11, 13),
      level: seaCondition(v.beach, w).level,
      wind: Math.round(w.windSpeed),
      dir: compass(w.windDir, this.state.lang()),
    }));
  });

  sin = (d: number) => Math.sin((d * Math.PI) / 180);
  cos = (d: number) => Math.cos((d * Math.PI) / 180);

  dir(d: number) {
    return compass(d, this.state.lang());
  }

  /** Τομέας 120° γύρω από την κατεύθυνση που κοιτάει η παραλία. */
  seaSector(facing: number) {
    const r = 44;
    const a1 = facing - 60, a2 = facing + 60;
    const p = (a: number) => `${(r * this.sin(a)).toFixed(1)} ${(-r * this.cos(a)).toFixed(1)}`;
    return `M 0 0 L ${p(a1)} A ${r} ${r} 0 0 1 ${p(a2)} Z`;
  }

}
