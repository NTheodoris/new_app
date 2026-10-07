import { Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonFab, IonFabButton, IonSpinner,
} from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { AppState, BeachView } from '../services/app-state.service';
import { LEVEL_COLORS } from '../services/sea';
import { TimePickerComponent } from '../components/time-picker.component';
import { BeachSummaryComponent } from '../components/beach-summary.component';
import { PhotoGalleryComponent } from '../components/photo-gallery.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonFab, IonFabButton, IonSpinner,
    TimePickerComponent, BeachSummaryComponent, PhotoGalleryComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ state.t('appTitle') }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="state.toggleLang()">{{ state.t('language') }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar><app-time-picker /></ion-toolbar>
    </ion-header>

    <ion-content [scrollY]="false">
      <div #map class="map"></div>

      <div class="legend">
        @for (l of levels; track l) {
          <span><i [style.background]="colors[l]"></i>{{ state.t($any('level' + l)) }}</span>
        }
      </div>

      @if (state.loading()) {
        <div class="overlay"><ion-spinner /> {{ state.t('loading') }}</div>
      }
      @if (state.error()) {
        <div class="overlay error">
          {{ state.t('offline') }}
          <ion-button size="small" (click)="state.loadWeather()">{{ state.t('retry') }}</ion-button>
        </div>
      }

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" [class.raised]="!!card()">
        <ion-fab-button size="small" color="light" (click)="locate()" [attr.aria-label]="state.t('locate')">
          <ion-icon name="locate" />
        </ion-fab-button>
      </ion-fab>

      @if (card(); as v) {
        <div class="card">
          @if (!selectedId()) {
            <div class="pick">⭐ {{ state.t('bestNow') }} · {{ state.t('bestNowSub') }}
              @if (v.distanceKm != null) { {{ state.t('near') }} }</div>
          } @else {
            <button class="close" (click)="selectedId.set(null)" aria-label="close">✕</button>
          }
          <div class="card-row">
            <app-photo-gallery [beach]="v.beach" mode="thumb" (click)="openBeach(v.beach.id)" />
            <app-beach-summary class="grow" [view]="v" (open)="openBeach(v.beach.id)" />
          </div>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .map { position: absolute; inset: 0; }
    .legend {
      position: absolute; top: 8px; left: 8px; z-index: 500; background: rgba(255,255,255,.92);
      border-radius: 10px; padding: 6px 8px; font-size: 11px; display: grid; gap: 2px; color: #222;
      box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }
    .overlay {
      position: absolute; top: 8px; right: 8px; z-index: 600; background: #fff; color: #222; padding: 8px 12px;
      border-radius: 10px; display: flex; gap: 8px; align-items: center; max-width: 70%; font-size: 13px;
      box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    .overlay.error { flex-direction: column; align-items: flex-start; }
    .card {
      position: absolute; left: 8px; right: 8px; bottom: 8px; z-index: 700;
      background: var(--ion-background-color, #fff); border-radius: 16px; padding: 12px 14px;
      box-shadow: 0 4px 18px rgba(0,0,0,.25);
    }
    .card-row { display: flex; gap: 10px; align-items: flex-start; }
    .grow { flex: 1; min-width: 0; }
    .pick { font-size: 12px; font-weight: 600; color: var(--ion-color-primary); margin-bottom: 4px; }
    .close { position: absolute; top: 6px; right: 8px; background: none; border: 0; font-size: 18px; color: var(--ion-color-medium); }
    ion-fab.raised { bottom: 190px; }
  `],
})
export class MapPage implements OnDestroy {
  state = inject(AppState);
  private router = inject(Router);
  @ViewChild('map', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  levels = [0, 1, 2, 3] as const;
  colors = LEVEL_COLORS;
  selectedId = signal<string | null>(null);

  card = computed<BeachView | null>(() => {
    const id = this.selectedId();
    if (id) return this.state.views().find((v) => v.beach.id === id) ?? null;
    return this.state.bestPick();
  });

  private map?: L.Map;
  private layer = L.layerGroup();
  private meLayer = L.layerGroup();

  constructor() {
    effect(() => this.drawMarkers(this.state.views()));
    effect(() => {
      const p = this.state.position();
      this.meLayer.clearLayers();
      if (p) L.circleMarker([p.lat, p.lon], { radius: 7, color: '#fff', weight: 3, fillColor: '#1e6fff', fillOpacity: 1 }).addTo(this.meLayer);
    });
  }

  ionViewDidEnter() {
    if (!this.map) {
      this.map = L.map(this.mapEl.nativeElement, { zoomControl: false, attributionControl: true })
        .setView([39.17, 26.25], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap',
      }).addTo(this.map);
      this.layer.addTo(this.map);
      this.meLayer.addTo(this.map);
      this.map.on('click', () => this.selectedId.set(null));
      this.drawMarkers(this.state.views());
    }
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  async locate() {
    await this.state.locate(true);
    const p = this.state.position();
    if (p && this.map) this.map.setView([p.lat, p.lon], 11);
  }

  openBeach(id: string) {
    this.router.navigate(['/beach', id]);
  }

  private drawMarkers(views: BeachView[]) {
    if (!this.map) return;
    this.layer.clearLayers();
    for (const v of views) {
      const color = v.sea ? LEVEL_COLORS[v.sea.level] : '#7a8794';
      // Το βελάκι δείχνει προς τα πού πηγαίνει ο αέρας (αντίθετα από το "από πού φυσάει").
      // Το ➤ κοιτάει ανατολικά (90°), άρα περιστροφή = (windDir + 180) − 90.
      const arrow = v.weather
        ? `<span class="wind-arrow" style="transform:rotate(${(v.weather.windDir + 90) % 360}deg)">➤</span>`
        : '';
      const icon = L.divIcon({
        className: 'beach-marker',
        html: `<div class="dot" style="background:${color}">${v.favorite ? '★' : ''}</div>${arrow}`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker([v.beach.lat, v.beach.lon], { icon, title: v.beach.name[this.state.lang()] })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          this.selectedId.set(v.beach.id);
        })
        .addTo(this.layer);
    }
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
