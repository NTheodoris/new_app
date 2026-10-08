import { Component, computed, inject } from '@angular/core';
import { IonRange } from '@ionic/angular/standalone';
import { AppState } from '../services/app-state.service';

/** Επιλογή ημέρας και ώρας για την πρόγνωση. */
@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [IonRange],
  template: `
    @if (state.times().length) {
      <div class="tp">
        <div class="days" role="tablist">
          @for (d of [0, 1, 2]; track d) {
            <button role="tab" class="day" [class.on]="day() === d" [attr.aria-selected]="day() === d" (click)="setDay(d)">
              {{ dayLabel(d) }}
            </button>
          }
        </div>
        <div class="row">
          <span class="hour">{{ hourLabel() }}</span>
          <ion-range
            [min]="0" [max]="23" [step]="1" [snaps]="false"
            [value]="hour()" (ionInput)="setHour(+$any($event.detail.value))"
            [attr.aria-label]="state.t('now')"></ion-range>
          @if (state.hourIndex() !== state.nowIndex()) {
            <button class="now" (click)="state.hourIndex.set(state.nowIndex())">{{ state.t('now') }}</button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .tp { padding: 4px 16px 6px; }
    .days { display: flex; gap: 6px; }
    .day {
      font: inherit; font-size: 14px; font-weight: 600; color: var(--lg-muted);
      background: transparent; border: 0; border-radius: 999px; padding: 6px 12px;
    }
    .day.on { background: var(--lg-ink); color: #fff; }
    .day:focus-visible, .now:focus-visible { outline: 2px solid var(--lg-sea); outline-offset: 2px; }
    .row { display: flex; align-items: center; gap: 10px; height: 40px; }
    .hour { font-weight: 750; font-size: 17px; font-variant-numeric: tabular-nums; min-width: 50px; color: var(--lg-ink); }
    ion-range {
      flex: 1; padding: 0 4px;
      --bar-height: 6px; --bar-border-radius: 3px; --bar-background: var(--lg-line); --bar-background-active: var(--lg-sea);
      --knob-size: 22px; --knob-background: #fff; --knob-box-shadow: 0 1px 4px rgba(10,53,80,.35);
    }
    .now {
      font: inherit; font-size: 13px; font-weight: 700; color: var(--lg-sea); background: var(--lg-surface);
      border: 1px solid var(--lg-line); border-radius: 999px; height: 30px; padding: 0 12px;
    }
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
