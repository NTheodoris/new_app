import { Component, inject, input } from '@angular/core';
import { IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { AppState } from '../services/app-state.service';

/** Κεφαλίδα: λογότυπο ή τίτλος σελίδας και αλλαγή γλώσσας. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonHeader, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <div class="bar">
          @if (title()) {
            <h1 class="title">{{ title() }}</h1>
          } @else {
            <h1 class="brand"><img src="icons/icon-192.png" alt="" width="30" height="30" />LesvosGo</h1>
          }
          <button class="lang" (click)="state.toggleLang()" [attr.aria-label]="state.t('language')">
            {{ state.lang() === 'el' ? 'EN' : 'ΕΛ' }}
          </button>
        </div>
      </ion-toolbar>
      <ng-content />
    </ion-header>
  `,
  styles: [`
    .bar { display: flex; align-items: center; justify-content: space-between; padding: 6px 16px 2px; }
    h1 { margin: 0; color: var(--lg-ink); }
    .brand { display: flex; align-items: center; gap: 9px; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .brand img { border-radius: 8px; }
    .title { font-size: 24px; font-weight: 750; letter-spacing: -0.015em; }
    .lang {
      font: inherit; font-size: 13px; font-weight: 700; color: var(--lg-sea);
      background: var(--lg-surface); border: 1px solid var(--lg-line); border-radius: 999px;
      min-width: 44px; height: 32px; padding: 0 12px;
    }
    .lang:focus-visible { outline: 2px solid var(--lg-sea); outline-offset: 2px; }
  `],
})
export class AppHeaderComponent {
  state = inject(AppState);
  title = input<string | null>(null);
}
