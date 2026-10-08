import { Component, computed, input } from '@angular/core';
import { SeaLevel } from '../models';
import { wavePath } from '../services/waterline';

/** Η γραμμή του νερού ως εικόνα: δείχνει με μια ματιά πόσο κύμα έχει. */
@Component({
  selector: 'app-waterline',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height()" preserveAspectRatio="none" aria-hidden="true">
      <path [attr.d]="d()" fill="none" [attr.stroke]="'var(--lv' + level() + ')'"
        [attr.stroke-width]="stroke()" stroke-linecap="round" vector-effect="non-scaling-stroke" />
    </svg>
  `,
  styles: [`:host { display: block; } svg { display: block; width: 100%; height: 100%; overflow: visible; }`],
})
export class WaterlineComponent {
  level = input.required<SeaLevel>();
  width = input(240);
  height = input(24);
  stroke = input(3);
  waves = input<number | undefined>(undefined);
  d = computed(() => wavePath(this.level(), this.width(), this.height(), this.waves()));
}
