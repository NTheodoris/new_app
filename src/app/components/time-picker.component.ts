import { Component, computed, inject } from '@angular/core';
import { IonButton, IonRange, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { AppState } from '../services/app-state.service';

/** Επιλογή ημέρας και ώρας για την πρόγνωση. */
@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonLabel, IonRange, IonButton],
  template: `
    @if (state.times().length) {
      <div class="tp">
        <ion-segment [value]="day()" (ionChange)="setDay(+$any($event.detail.value))">
          @for (d of [0, 1, 2]; track d) {
            <ion-segment-button [value]="d"><ion-label>{{ dayLabel(d) }}</ion-label></ion-segment-button>
          }
        </ion-segment>
        <div class="row">
          <span class="hour">{{ hourLabel() }}</span>
          <ion-range
            [min]="0" [max]="23" [step]="1" [snaps]="false"
            [value]="hour()" (ionInput)="setHour(+$any($event.detail.value))"
            aria-label="hour"></ion-range>
          <ion-button size="small" fill="outline" (click)="state.hourIndex.set(state.nowIndex())">
            {{ state.t('now') }}
          </ion-button>
        </div>
      </div>
    }
  `,
  styles: [`
    .tp { padding: 6px 12px 0; }
    .row { display: flex; align-items: center; gap: 8px; }
    .hour { font-weight: 700; font-variant-numeric: tabular-nums; min-width: 48px; }
    ion-range { flex: 1; --bar-height: 4px; padding: 0 4px; }
    ion-segment { --background: var(--ion-color-light); }
  `],
})
export class TimePickerComponent {
  state = inject(AppState);

  day = computed(() => Math.floor(this.state.hourIndex() / 24));
  hour = computed(() => this.state.hourIndex() % 24);
  hourLabel = computed(() => `${String(this.hour()).padStart(2, '0')}:00`);

  dayLabel(d: number) {
    return this.state.t(d === 0 ? 'today' : d === 1 ? 'tomorrow' : 'dayAfter');
  }
  setDay(d: number) {
    const max = this.state.times().length - 1;
    this.state.hourIndex.set(Math.min(max, d * 24 + this.hour()));
  }
  setHour(h: number) {
    this.state.hourIndex.set(this.day() * 24 + h);
  }
}
