import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { AppState, BeachView } from '../services/app-state.service';
import { DictKey } from '../services/i18n';
import { beaufort, compass, compassWord, windWord } from '../services/sea';
import { WaterlineComponent } from './waterline.component';

/** Σύνοψη παραλίας: όνομα, η απόφαση «κάνει για μπάνιο;» με τη γραμμή του νερού, και τα βασικά του καιρού. */
@Component({
  selector: 'app-beach-summary',
  standalone: true,
  host: { '[class.compact]': 'compact()' },
  imports: [IonButton, IonIcon, WaterlineComponent],
  template: `
    @let v = view();
    @let lang = state.lang();
    @if (kicker()) { <div class="kicker"><span class="sun"></span>{{ kicker() }}</div> }
    @if (showName()) {
      <h2 class="name">{{ v.beach.name[lang] }}@if (v.favorite) {<span class="star" aria-label="★"> ★</span>}</h2>
      <div class="area">{{ v.beach.area[lang] }}@if (v.distanceKm != null) {, {{ v.distanceKm.toFixed(0) }} {{ state.t('km') }}}</div>
    }

    @if (v.sea && v.weather; as w) {
      @let l = v.sea.level;
      <section class="verdict" [style.background]="'var(--lv' + l + '-tint)'">
        <app-waterline class="line" [level]="l" [width]="320" [height]="compact() ? 12 : 22" />
        <div class="vrow">
          <strong class="vtitle" [style.color]="'var(--lv' + l + '-ink)'">{{ state.t(levelKey(v)) }}</strong>
          @if (v.sea.coastWave >= 0.2) {
            <span class="wave" [style.color]="'var(--lv' + l + '-ink)'">{{ state.t('waveShort') }} ~{{ num(v.sea.coastWave) }} m</span>
          }
        </div>
        <p class="advice">{{ state.t(adviceKey(v)) }}</p>
        @if (!compact()) { <p class="why">{{ state.t(whyKey(v)) }}</p> }
      </section>

      @if (v.sea.offshoreWarning && !compact()) {
        <p class="warn">{{ state.t('offshoreWarning') }}</p>
      }
      @if (alt(); as a) {
        <button class="alt" (click)="go(a.view.beach.id)">
          <span>{{ state.t('goInstead') }}:</span>
          <strong>{{ a.view.beach.name[lang] }}</strong>
          <span class="km">{{ a.km.toFixed(0) }} {{ state.t('km') }}</span>
        </button>
      }

      @if (compact()) {
        <p class="factline">
          <span>{{ state.t(windKey(v)) }} <b>{{ w.windSpeed.toFixed(0) }} km/h · {{ bf(w.windSpeed) }} {{ state.t('bft') }}</b>@if (w.windSpeed >= 6) { {{ compassShort(w.windDir) }}}</span>
          @if (w.seaTemp != null) { <span>{{ state.t('seaTemp') }} <b>{{ w.seaTemp.toFixed(0) }}°</b></span> }
          @if (w.temp != null) { <span>{{ state.t('airTemp') }} <b>{{ w.temp.toFixed(0) }}°</b></span> }
        </p>
      } @else {
      <dl class="facts">
        <div>
          <dt>{{ state.t(windKey(v)) }}</dt>
          <dd>{{ w.windSpeed.toFixed(0) }} <small>km/h</small> <span class="bf">{{ bf(w.windSpeed) }} {{ state.t('bft') }}</span></dd>
          @if (w.windSpeed >= 6) { <dd class="sub">{{ state.t('from') }} {{ compass(w.windDir) }}</dd> }
        </div>
        @if (w.seaTemp != null) {
          <div><dt>{{ state.t('seaTemp') }}</dt><dd>{{ w.seaTemp.toFixed(0) }}°</dd></div>
        }
        @if (w.temp != null) {
          <div><dt>{{ state.t('airTemp') }}</dt><dd>{{ w.temp.toFixed(0) }}°</dd></div>
        }
      </dl>
      }
    }

    <div class="actions">
      @if (showDetails()) {
        <ion-button (click)="open.emit()">{{ state.t('details') }}</ion-button>
      }
      <ion-button fill="outline" [href]="mapsUrl(v)" target="_blank">
        <ion-icon name="navigate" slot="start" /> {{ state.t('navigate') }}
      </ion-button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    :host(.compact) .name { font-size: 19px; padding-right: 40px; }
    :host(.compact) .area { font-size: 13px; margin-top: 0; }
    :host(.compact) .verdict { margin-top: 8px; padding: 6px 12px 8px; border-radius: 14px; }
    :host(.compact) .line { height: 10px; margin: 0 0 4px; }
    :host(.compact) .vtitle { font-size: 17px; }
    :host(.compact) .wave { font-size: 13px; }
    :host(.compact) .advice { font-size: 13.5px; margin-top: 2px; }
    :host(.compact) .warn { margin-top: 8px; padding: 7px 10px; font-size: 12.5px; }
    :host(.compact) .alt { margin-top: 8px; padding: 8px 12px; font-size: 13.5px; }
    :host(.compact) .actions { margin-top: 10px; }
    :host(.compact) .actions ion-button { height: 38px; font-size: 14px; }
    .factline { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 8px 0 0; font-size: 13px; color: var(--lg-muted); }
    .factline b { color: var(--lg-ink); font-weight: 700; font-variant-numeric: tabular-nums; }
    .kicker { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 650; color: #8a5a00; margin-bottom: 4px; }
    .sun { width: 10px; height: 10px; border-radius: 50%; background: var(--lg-sun); box-shadow: 0 0 0 3px rgba(255,181,46,.25); }
    .name { margin: 0; font-size: 22px; font-weight: 750; letter-spacing: -0.015em; line-height: 1.15; color: var(--lg-ink); }
    .star { color: var(--lg-sun); }
    .area { font-size: 14px; color: var(--lg-muted); margin-top: 2px; }

    .verdict { margin-top: 12px; border-radius: 18px; padding: 12px 14px 12px; }
    .line { height: 22px; margin: 2px 0 8px; }
    .vrow { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    .vtitle { font-size: 21px; font-weight: 780; letter-spacing: -0.01em; }
    .wave { font-size: 14px; font-weight: 650; white-space: nowrap; }
    .advice { margin: 4px 0 0; font-size: 15px; font-weight: 520; color: var(--lg-ink); line-height: 1.35; }
    .why { margin: 3px 0 0; font-size: 13px; color: var(--lg-muted); line-height: 1.35; }

    .warn { margin: 10px 0 0; font-size: 13px; line-height: 1.4; background: #fff1df; color: #7a4300; padding: 9px 12px; border-radius: 12px; }
    .alt {
      display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; width: 100%; text-align: left;
      margin-top: 10px; font: inherit; font-size: 14px; color: var(--lv0-ink);
      background: var(--lg-surface); border: 1.5px solid var(--lv0); border-radius: 14px; padding: 10px 12px;
    }
    .alt strong { font-weight: 750; }
    .alt .km { margin-left: auto; color: var(--lg-muted); font-size: 13px; }
    .alt:focus-visible { outline: 2px solid var(--lg-sea); outline-offset: 2px; }

    .facts { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 8px; margin: 14px 0 0; }
    .facts dt { font-size: 12px; color: var(--lg-muted); }
    .facts dd { margin: 1px 0 0; font-size: 19px; font-weight: 720; color: var(--lg-ink); font-variant-numeric: tabular-nums; }
    .facts dd small { font-size: 12px; font-weight: 600; color: var(--lg-muted); }
    .facts dd .bf { font-size: 14px; font-weight: 700; color: var(--lg-ink); margin-left: 4px; white-space: nowrap; }
    .facts dd.sub { font-size: 12px; font-weight: 500; color: var(--lg-muted); }

    .actions { display: flex; gap: 8px; margin-top: 14px; }
    .actions ion-button { flex: 1; margin: 0; height: 44px; font-size: 15px; }
  `],
})
export class BeachSummaryComponent {
  state = inject(AppState);
  private router = inject(Router);
  view = input.required<BeachView>();
  showDetails = input(true);
  showName = input(true);
  /** Μικρή γραμμή πάνω από το όνομα, π.χ. «Πρόταση για τώρα». */
  kicker = input<string | null>(null);
  /** Πιο μικρή εκδοχή (για την κάρτα πάνω στον χάρτη). */
  compact = input(false);
  @Output() open = new EventEmitter<void>();

  alt = computed(() => this.state.calmAlternative(this.view().beach.id));

  levelKey(v: BeachView) {
    return ('level' + v.sea!.level) as DictKey;
  }

  adviceKey(v: BeachView) {
    if (v.sea!.offshoreWarning && v.sea!.level <= 1) return 'advice_offshore' as DictKey;
    return ('advice' + v.sea!.level) as DictKey;
  }

  /** Μία απλή φράση για το «γιατί». */
  whyKey(v: BeachView): DictKey {
    const sea = v.sea!;
    if (sea.driver === 'waves') return 'why_waves';
    if (sea.offshoreWarning) return 'why_offshore';
    if (sea.level >= 1) return 'why_onshore';
    if (sea.onshore < -0.35 && (v.weather?.windSpeed ?? 0) >= 12) return 'why_offshore';
    return 'why_light';
  }

  windKey(v: BeachView) {
    const w = v.weather!;
    return ('wind_' + windWord(w.windSpeed, w.windDir, w.time)) as DictKey;
  }

  compass(deg: number) {
    return compassWord(deg, this.state.lang());
  }

  bf(kmh: number) {
    return beaufort(kmh);
  }

  compassShort(deg: number) {
    return compass(deg, this.state.lang());
  }

  num(x: number) {
    const s = x.toFixed(1);
    return this.state.lang() === 'el' ? s.replace('.', ',') : s;
  }

  go(id: string) {
    this.router.navigate(['/beach', id]);
  }

  mapsUrl(v: BeachView) {
    return `https://www.google.com/maps/dir/?api=1&destination=${v.beach.lat},${v.beach.lon}`;
  }
}
