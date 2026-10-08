import { Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonToolbar, IonContent, IonIcon, IonFab, IonFabButton, IonSpinner } from '@ionic/angular/standalone';
import { DomSanitizer } from '@angular/platform-browser';
import * as L from 'leaflet';
import { AppState, BeachView } from '../services/app-state.service';
import { waveGlyph } from '../services/waterline';
import { SeaLevel } from '../models';
import { TimePickerComponent } from '../components/time-picker.component';
import { BeachSummaryComponent } from '../components/beach-summary.component';
import { AppHeaderComponent } from '../components/app-header.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    IonToolbar, IonContent, IonIcon, IonFab, IonFabButton, IonSpinner,
    TimePickerComponent, BeachSummaryComponent, AppHeaderComponent,
  ],
  template: `
    <app-header>
      <ion-toolbar><app-time-picker /></ion-toolbar>
    </app-header>

    <ion-content [scrollY]="false">
      <div #map class="map"></div>

      <div class="legend" aria-hidden="true">
        @for (l of levels; track l) {
          <span class="lg"><i [style.background]="'var(--lv' + l + ')'" [innerHTML]="glyph(l)"></i>{{ state.t($any('legend' + l)) }}</span>
        }
      </div>

      @if (state.loading()) {
        <div class="status"><ion-spinner name="crescent" /> {{ state.t('loading') }}</div>
      }
      @if (state.error()) {
        <div class="status error">
          <span>{{ state.t('offline') }}</span>
          <button (click)="state.loadWeather()">{{ state.t('retry') }}</button>
        </div>
      }

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" [class.raised]="!!card()">
        <ion-fab-button size="small" color="light" (click)="locate()" [attr.aria-label]="state.t('locate')">
          <ion-icon name="locate" />
        </ion-fab-button>
      </ion-fab>

      @if (card(); as v) {
        <div class="sheet" #sheet>
          <div class="grab" aria-hidden="true"></div>
          @if (selectedId()) {
            <button class="close" (click)="selectedId.set(null)" aria-label="close">✕</button>
          }
          <app-beach-summary [view]="v" [compact]="true" [kicker]="selectedId() ? null : kicker(v)" (open)="openBeach(v.beach.id)" />
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .map { position: absolute; inset: 0; }
    .legend {
      position: absolute; top: 34px; left: 10px; right: 10px; z-index: 500; display: flex; gap: 12px; flex-wrap: wrap;
      width: fit-content; background: rgba(255,255,255,.94); border-radius: 999px; padding: 6px 12px;
      font-size: 12px; font-weight: 600; color: var(--lg-ink); box-shadow: 0 1px 6px rgba(10,53,80,.18);
    }
    .lg { display: inline-flex; align-items: center; gap: 5px; }
    .lg i { width: 16px; height: 16px; border-radius: 50%; display: grid; place-items: center; }
    .status {
      position: absolute; top: 52px; left: 10px; z-index: 600; background: var(--lg-surface); color: var(--lg-ink);
      padding: 8px 12px; border-radius: 14px; display: flex; gap: 8px; align-items: center; max-width: calc(100% - 20px);
      font-size: 14px; box-shadow: 0 1px 6px rgba(10,53,80,.18);
    }
    .status ion-spinner { width: 18px; height: 18px; color: var(--lg-sea); }
    .status.error { flex-direction: column; align-items: flex-start; }
    .status button {
      font: inherit; font-weight: 700; color: #fff; background: var(--lg-sea); border: 0; border-radius: 10px; padding: 6px 14px;
    }
    .sheet {
      position: absolute; left: 0; right: 0; bottom: 0; z-index: 700; max-height: 62%; overflow-y: auto;
      background: var(--lg-surface); border-radius: 24px 24px 0 0; padding: 8px 16px 16px;
      box-shadow: 0 -6px 24px rgba(10,53,80,.18);
    }
    .grab { width: 40px; height: 4px; border-radius: 2px; background: var(--lg-line); margin: 0 auto 10px; }
    .close {
      position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 50%;
      background: var(--lg-foam); border: 0; font-size: 15px; color: var(--lg-muted);
    }
    ion-fab-button { --box-shadow: 0 2px 8px rgba(10,53,80,.25); --color: var(--lg-sea); }
    ion-fab.raised { bottom: calc(var(--sheet-h, 0px) + 10px); }
  `],
})
export class MapPage implements OnDestroy {
  state = inject(AppState);
  private router = inject(Router);
  @ViewChild('map', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @ViewChild('sheet') sheetEl?: ElementRef<HTMLDivElement>;
  private fitted = false;

  levels = [0, 1, 2, 3] as const;
  private sanitizer = inject(DomSanitizer);
  glyph = (l: SeaLevel) => this.sanitizer.bypassSecurityTrustHtml(waveGlyph(l, 12));

  kicker(v: BeachView) {
    return this.state.t('bestNowSub') + (v.distanceKm != null ? ' ' + this.state.t('near') : '');
  }
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
    effect(() => this.drawMarkers(this.state.views(), this.card()?.beach.id ?? null));
    effect(() => {
      this.card();
      this.state.lang();
      setTimeout(() => {
        this.updateSheetHeight();
        if (this.selectedId()) this.keepSelectedVisible();
      }, 0);
    });
    effect(() => {
      const p = this.state.position();
      this.meLayer.clearLayers();
      if (p) L.circleMarker([p.lat, p.lon], { radius: 7, color: '#fff', weight: 3, fillColor: '#1e6fff', fillOpacity: 1 }).addTo(this.meLayer);
    });
  }

  ionViewDidEnter() {
    if (!this.map) {
      this.map = L.map(this.mapEl.nativeElement, { zoomControl: false, attributionControl: false })
        .setView([39.17, 26.25], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap',
      }).addTo(this.map);
      // Η αναφορά στο OpenStreetMap πάνω δεξιά, για να μην την κρύβει η κάρτα.
      L.control.attribution({ position: 'topright', prefix: false }).addTo(this.map);
      this.layer.addTo(this.map);
      this.meLayer.addTo(this.map);
      this.map.on('click', () => this.selectedId.set(null));
      this.drawMarkers(this.state.views(), this.card()?.beach.id ?? null);
    }
    setTimeout(() => {
      this.map?.invalidateSize();
      this.fitIsland();
    }, 80);
  }

  /** Δείχνει όλο το νησί στο κομμάτι του χάρτη που δεν κρύβει η κάρτα. */
  private fitIsland() {
    if (!this.map) return;
    const sheetH = this.updateSheetHeight();
    if (this.fitted) return;
    this.fitted = true;
    this.map.fitBounds([[38.96, 25.84], [39.40, 26.62]], { paddingTopLeft: [16, 56], paddingBottomRight: [16, sheetH + 12] });
  }

  /** Το κουμπί «η θέση μου» μένει πάντα πάνω από την κάρτα. */
  private updateSheetHeight() {
    const h = this.sheetEl?.nativeElement.offsetHeight ?? 0;
    this.mapEl.nativeElement.parentElement?.style.setProperty('--sheet-h', h + 'px');
    return h;
  }

  /** Αν η επιλεγμένη παραλία κρύβεται κάτω από την κάρτα (ή στις άκρες), μετακινεί λίγο τον χάρτη. */
  private keepSelectedVisible() {
    const v = this.card();
    if (!this.map || !v) return;
    const size = this.map.getSize();
    const sheetH = this.sheetEl?.nativeElement.offsetHeight ?? 0;
    const pt = this.map.latLngToContainerPoint([v.beach.lat, v.beach.lon]);
    const top = 80, bottom = size.y - sheetH - 40, side = 30;
    let dx = 0, dy = 0;
    if (pt.y > bottom) dy = pt.y - bottom;
    else if (pt.y < top) dy = pt.y - top;
    if (pt.x < side) dx = pt.x - side;
    else if (pt.x > size.x - side) dx = pt.x - (size.x - side);
    if (dx || dy) this.map.panBy([dx, dy], { animate: true });
  }

  async locate() {
    await this.state.locate(true);
    const p = this.state.position();
    if (p && this.map) this.map.setView([p.lat, p.lon], 11);
  }

  openBeach(id: string) {
    this.router.navigate(['/beach', id]);
  }

  private drawMarkers(views: BeachView[], selected: string | null) {
    if (!this.map) return;
    this.layer.clearLayers();
    const best = this.state.bestPick()?.beach.id;
    for (const v of views) {
      const isSel = v.beach.id === selected;
      const fill = v.sea ? `var(--lv${v.sea.level})` : '#7a8794';
      const size = isSel ? 40 : 28;
      const inner = v.sea ? waveGlyph(v.sea.level, isSel ? 22 : 16) : '';
      const cls = 'pin' + (isSel ? ' sel' : v.beach.id === best ? ' best' : '');
      const icon = L.divIcon({
        className: 'beach-marker',
        html: `<div class="${cls}" style="background:${fill}">${inner}</div>${v.favorite ? '<span class="fav">★</span>' : ''}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker([v.beach.lat, v.beach.lon], { icon, title: v.beach.name[this.state.lang()], zIndexOffset: isSel ? 1000 : 0 })
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
