import { Component, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { AppState } from '../services/app-state.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="map">
          <ion-icon name="map" /><ion-label>{{ state.t('tabMap') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="list">
          <ion-icon name="list" /><ion-label>{{ state.t('tabList') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tips">
          <ion-icon name="bulb" /><ion-label>{{ state.t('tabTips') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  state = inject(AppState);
}
