import { Component, computed, inject, input } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon, IonChip,
} from '@ionic/angular/standalone';
import { AppState } from '../services/app-state.service';
import { LEVEL_COLORS, seaCondition } from '../services/sea';
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

        @if (best(); as bt) {
          @if (bt.level <= 1) {
            <div class="best">🕐 {{ state.t('bestTime') }}:
              <b>@if (bt.allDay) { {{ state.t('sameAllDay') }} } @else { {{ bt.from }}–{{ bt.to }} }</b>
            </div>
          }
        }

        <h3 id="hours">{{ state.t('hoursAhead') }}</h3>
        <div class="hours">
          @for (h of hours(); track h.i) {
            <button class="hour" [class.sel]="h.i === state.hourIndex()" (click)="state.hourIndex.set(h.i)">
              <span class="t">{{ h.label }}</span>
              <span class="bar" [style.background]="colors[h.level]" [style.height.px]="14 + h.level * 12"></span>
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
    .best { margin: 14px 0 4px; font-size: 14px; background: var(--ion-color-light); padding: 8px 10px; border-radius: 8px; }
    h3 { font-size: 15px; margin: 18px 0 6px; }
    .hours { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 6px; }
    .hour {
      flex: none; width: 40px; display: flex; flex-direction: column; align-items: center; gap: 3px;
      background: none; border: 1px solid transparent; border-radius: 8px; padding: 4px 0; color: inherit; font: inherit;
    }
    .hour.sel { border-color: var(--ion-color-primary); background: rgba(0,0,0,.03); }
    .hour .t { font-size: 11px; color: var(--ion-color-medium); }
    .hour .bar { width: 16px; border-radius: 4px; margin-top: auto; }
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
    }));
  });

  best = computed(() => {
    const v = this.view();
    this.state.hourIndex();
    return v ? this.state.bestTime(v.beach.id) : null;
  });
}
