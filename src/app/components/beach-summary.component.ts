import { Component, EventEmitter, Output, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { AppState, BeachView } from '../services/app-state.service';
import { DictKey } from '../services/i18n';
import { LEVEL_COLORS, compassWord, windWord } from '../services/sea';

/** Σύνοψη παραλίας: όνομα και μια απλή απόφαση «κάνει για μπάνιο ή όχι». */
@Component({
  selector: 'app-beach-summary',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    @let v = view();
    @let lang = state.lang();
    <div class="head">
      <div class="names">
        <div class="name">@if (v.favorite) {<span class="star">★</span>} {{ v.beach.name[lang] }}</div>
        <div class="area">{{ v.beach.area[lang] }}
          @if (v.distanceKm != null) { · {{ v.distanceKm.toFixed(0) }} {{ state.t('km') }} }
        </div>
      </div>
      @if (v.sea) {
        <span class="badge" [style.background]="colors[v.sea.level]">{{ state.t(levelKey(v)) }}</span>
      }
    </div>

    @if (v.sea && v.weather; as w) {
      <div class="advice">{{ state.t(adviceKey(v)) }}</div>
      <div class="why">{{ state.t(whyKey(v)) }}</div>
      @if (v.sea.offshoreWarning) {
        <div class="warn">{{ state.t('offshoreWarning') }}</div>
      }
      @if (alt(); as a) {
        <button class="alt" (click)="go(a.view.beach.id)">
          👉 {{ state.t('goInstead') }}: <b>{{ a.view.beach.name[lang] }}</b> · {{ a.km.toFixed(0) }} {{ state.t('km') }}
        </button>
      }
      <div class="windline">
        💨 <b>{{ state.t(windKey(v)) }}</b> · {{ w.windSpeed.toFixed(0) }} km/h
        @if (w.windSpeed >= 6) { {{ state.t('from') }} {{ compass(w.windDir) }} }
        @if (v.sea.coastWave >= 0.2) { · 🌊 {{ state.t('waveShort') }} ~{{ v.sea.coastWave.toFixed(1) }} m }
      </div>
      <div class="temps">
        @if (v.weather.temp != null) { ☀️ {{ state.t('airTemp') }} {{ v.weather.temp.toFixed(0) }}° }
        @if (v.weather.seaTemp != null) { · 🌊 {{ state.t('seaTemp') }} {{ v.weather.seaTemp.toFixed(0) }}° }
      </div>
    }

    <div class="actions">
      @if (showDetails()) {
        <ion-button size="small" (click)="open.emit()">{{ state.t('details') }}</ion-button>
      }
      <ion-button size="small" fill="outline" [href]="mapsUrl(v)" target="_blank">
        <ion-icon name="navigate" slot="start" /> {{ state.t('navigate') }}
      </ion-button>
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .name { font-size: 17px; font-weight: 700; }
    .star { color: #f5a623; }
    .area { font-size: 13px; color: var(--ion-color-medium); }
    .badge { color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
    .advice { margin-top: 8px; font-size: 15px; font-weight: 600; }
    .why { font-size: 12px; color: var(--ion-color-medium); margin-top: 2px; }
    .warn { margin-top: 6px; font-size: 12px; background: #fff4e5; color: #8a4b00; padding: 6px 8px; border-radius: 8px; }
    .alt {
      display: block; width: 100%; text-align: left; margin-top: 8px; font: inherit; font-size: 13px;
      background: #e8f6ee; color: #135c37; border: 0; border-radius: 8px; padding: 8px 10px; cursor: pointer;
    }
    .windline { margin-top: 8px; font-size: 13px; }
    .temps { margin-top: 4px; font-size: 13px; color: var(--ion-color-medium); }
    .actions { display: flex; gap: 6px; margin-top: 8px; }
  `],
})
export class BeachSummaryComponent {
  state = inject(AppState);
  private router = inject(Router);
  view = input.required<BeachView>();
  showDetails = input(true);
  @Output() open = new EventEmitter<void>();
  colors = LEVEL_COLORS;

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

  go(id: string) {
    this.router.navigate(['/beach', id]);
  }

  mapsUrl(v: BeachView) {
    return `https://www.google.com/maps/dir/?api=1&destination=${v.beach.lat},${v.beach.lon}`;
  }
}
