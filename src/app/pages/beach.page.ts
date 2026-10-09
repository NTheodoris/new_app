import { Component, computed, inject, input } from '@angular/core';
import { IonHeader, IonToolbar, IonContent, IonButtons, IonBackButton, IonIcon } from '@ionic/angular/standalone';
import { AppState } from '../services/app-state.service';
import { seaCondition } from '../services/sea';
import { BeachSummaryComponent } from '../components/beach-summary.component';
import { TimePickerComponent } from '../components/time-picker.component';

@Component({
  selector: 'app-beach',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonContent, IonButtons, IonBackButton, IonIcon, BeachSummaryComponent, TimePickerComponent,
  ],
  template: `
    @if (view(); as v) {
      @let lang = state.lang();
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start"><ion-back-button defaultHref="/tabs/map" text="" /></ion-buttons>
          <ion-buttons slot="end">
            <button class="fav" [class.on]="v.favorite" (click)="state.toggleFavorite(v.beach.id)"
              [attr.aria-pressed]="v.favorite" [attr.aria-label]="state.t('favorite')">
              <ion-icon [name]="v.favorite ? 'star' : 'star-outline'" />
              <span>{{ state.t('favorite') }}</span>
            </button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar><app-time-picker /></ion-toolbar>
      </ion-header>

      <ion-content>
        <div class="panel">
          <app-beach-summary [view]="v" [showDetails]="false" />
        </div>

        @if (best(); as bt) {
          @if (bt.level <= 1) {
            <section class="block best">
              <h3>{{ state.t('bestTime') }}</h3>
              <p class="big" [style.color]="'var(--lv' + bt.level + '-ink)'">@if (bt.allDay) { {{ state.t('sameAllDay') }} } @else { {{ bt.from }} – {{ bt.to }} }</p>
            </section>
          }
        }

        <section class="block">
          <h3 id="hours">{{ state.t('hoursAhead') }}</h3>
          <div class="hours" role="list">
            @for (h of hours(); track h.i) {
              <button role="listitem" class="hour" [class.sel]="h.i === state.hourIndex()" (click)="state.hourIndex.set(h.i)"
                [attr.aria-label]="h.label + ':00 ' + state.t($any('legend' + h.level))">
                <span class="cap" [style.background]="'var(--lv' + h.level + ')'" [style.height.px]="16 + h.level * 11"></span>
                <span class="t">{{ h.label }}</span>
              </button>
            }
          </div>
        </section>

        <section class="block">
          <p class="desc">{{ state.desc(v.beach) }}</p>
          <div class="tags">
            @if (v.beach.surface) { <span>{{ state.t(v.beach.surface) }}</span> }
            @if (v.beach.organized) { <span>⛱️ {{ state.t('organized') }}</span> }
            @for (tag of v.beach.tags; track tag) {
              <span>{{ state.t($any('tag_' + tag)) }}</span>
            }
          </div>
        </section>

        <p class="note">{{ state.t('dataNote') }}</p>
      </ion-content>
    }
  `,
  styles: [`
    ion-back-button { --color: var(--lg-ink); --icon-font-size: 24px; }
    .fav {
      display: inline-flex; align-items: center; gap: 6px; margin-right: 12px; font: inherit; font-size: 14px; font-weight: 650;
      color: var(--lg-ink); background: var(--lg-surface); border: 1px solid var(--lg-line); border-radius: 999px; padding: 6px 12px;
    }
    .fav ion-icon { font-size: 17px; color: var(--lg-muted); }
    .fav.on ion-icon { color: var(--lg-sun); }
    .fav:focus-visible, .hour:focus-visible { outline: 2px solid var(--lg-sea); outline-offset: 2px; }

    .panel { background: var(--lg-surface); margin: 6px 12px 0; border-radius: 24px; padding: 16px; }
    .block { margin: 22px 16px 0; }
    h3 { font-size: 16px; font-weight: 720; margin: 0 0 8px; color: var(--lg-ink); }
    .best h3 { margin-bottom: 2px; }
    .big { margin: 0; font-size: 28px; font-weight: 780; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }

    .hours { display: flex; gap: 2px; overflow-x: auto; padding: 4px 0 4px; scrollbar-width: none; }
    .hours::-webkit-scrollbar { display: none; }
    .hour {
      flex: none; width: 36px; height: 76px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px;
      background: none; border: 0; border-radius: 12px; padding: 6px 0; color: inherit; font: inherit;
    }
    .hour.sel { background: var(--lg-surface); box-shadow: inset 0 0 0 2px var(--lg-ink); }
    .cap { width: 14px; border-radius: 7px; }
    .t { font-size: 12px; color: var(--lg-muted); font-variant-numeric: tabular-nums; }
    .hour.sel .t { color: var(--lg-ink); font-weight: 700; }

    .desc { font-size: 16px; line-height: 1.55; margin: 0; max-width: 62ch; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .tags span { font-size: 13px; font-weight: 600; background: var(--lg-surface); border: 1px solid var(--lg-line); border-radius: 999px; padding: 5px 11px; }
    .note { font-size: 12px; color: var(--lg-muted); margin: 22px 16px 24px; line-height: 1.45; }
  `],
})
export class BeachPage {
  state = inject(AppState);
  /** Παράμετρος διαδρομής :id */
  id = input.required<string>();


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
