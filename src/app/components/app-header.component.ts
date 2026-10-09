import { Component, inject, input } from '@angular/core';
import { ActionSheetController, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { LANGUAGES } from '../services/i18n';
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
          <button class="lang" (click)="pickLang()" [attr.aria-label]="state.t('language')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>
            {{ current() }}
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
      min-width: 44px; height: 32px; padding: 0 12px 0 10px; display: inline-flex; align-items: center; gap: 6px;
    }
    .lang:focus-visible { outline: 2px solid var(--lg-sea); outline-offset: 2px; }
  `],
})
export class AppHeaderComponent {
  state = inject(AppState);
  private sheets = inject(ActionSheetController);
  title = input<string | null>(null);

  current() {
    return LANGUAGES.find((l) => l.code === this.state.lang())?.short ?? '';
  }

  async pickLang() {
    const sheet = await this.sheets.create({
      header: this.state.t('language'),
      buttons: LANGUAGES.map((l) => ({
        text: (l.code === this.state.lang() ? '✓ ' : '') + l.label,
        handler: () => this.state.setLang(l.code),
      })),
    });
    await sheet.present();
  }
}
