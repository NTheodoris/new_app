import { Component, EventEmitter, Output, inject, input } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { AppState, BeachView } from '../services/app-state.service';
import { LEVEL_COLORS, compass } from '../services/sea';

/** Σύνοψη παραλίας: όνομα, κατάσταση θάλασσας, άνεμος. */
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
        <span class="badge" [style.background]="colors[v.sea.level]">{{ state.t($any('level' + v.sea.level)) }}</span>
      }
    </div>

    @if (v.weather; as w) {
      <div class="wind">
        💨 {{ w.windSpeed.toFixed(0) }} km/h {{ state.t('from') }} {{ dir(w.windDir) }}
        ({{ v.sea!.beaufort }} {{ state.t('beaufortShort') }}) · {{ state.t('gusts') }} {{ w.gusts.toFixed(0) }}
        @if (w.seaTemp != null) { · 🌊 {{ w.seaTemp.toFixed(0) }}°C }
      </div>
      <div class="why">{{ why(v) }}</div>
      @if (v.sea!.offshoreWarning) {
        <div class="warn">{{ state.t('offshoreWarning') }}</div>
      }
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
    .wind { margin-top: 8px; font-size: 13px; }
    .why { font-size: 12px; color: var(--ion-color-medium); margin-top: 2px; }
    .warn { margin-top: 6px; font-size: 12px; background: #fff4e5; color: #8a4b00; padding: 6px 8px; border-radius: 8px; }
    .actions { display: flex; gap: 6px; margin-top: 8px; }
  `],
})
export class BeachSummaryComponent {
  state = inject(AppState);
  view = input.required<BeachView>();
  showDetails = input(true);
  @Output() open = new EventEmitter<void>();
  colors = LEVEL_COLORS;

  dir(d: number) {
    return compass(d, this.state.lang());
  }

  why(v: BeachView) {
    const sea = v.sea;
    if (sea?.driver === 'waves') {
      return (sea.onshore < -0.35 ? this.state.t('swellOffshoreWind') : this.state.t('wavesReach'));
    }
    const o = v.sea?.onshore ?? 0;
    if (o > 0.35) return this.state.t('onshoreWind');
    if (o < -0.35) return this.state.t('offshoreWind');
    return this.state.t('sideWind');
  }

  mapsUrl(v: BeachView) {
    return `https://www.google.com/maps/dir/?api=1&destination=${v.beach.lat},${v.beach.lon}`;
  }
}
