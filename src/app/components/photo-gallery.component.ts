import { Component, effect, inject, input, signal } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { Beach, Photo } from '../models';
import { PhotoService } from '../services/photo.service';
import { AppState } from '../services/app-state.service';

/**
 * Φωτογραφίες παραλίας από το Wikimedia Commons, με δημιουργό και άδεια κάτω από κάθε μία.
 * mode="gallery": οριζόντια λωρίδα (σελίδα παραλίας) · mode="thumb": μία μικρογραφία (κάρτα χάρτη).
 */
@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [IonSpinner],
  template: `
    @if (mode() === 'thumb') {
      @if (photos()[0]; as p) {
        <img class="thumb" [src]="p.thumb" [alt]="p.title" loading="lazy" (error)="hide(p)" />
      }
    } @else {
      @if (loading()) {
        <div class="ph"><ion-spinner name="dots" /></div>
      } @else if (photos().length) {
        <div class="strip">
          @for (p of photos(); track p.page) {
            <figure>
              <a [href]="p.page" target="_blank" rel="noopener">
                <img [src]="p.thumb" [alt]="p.description || p.title" loading="lazy" (error)="hide(p)" />
              </a>
              <figcaption>
                📷 {{ p.author }} ·
                @if (p.licenseUrl) {
                  <a [href]="p.licenseUrl" target="_blank" rel="noopener">{{ p.license }}</a>
                } @else { {{ p.license }} }
                · <a [href]="p.page" target="_blank" rel="noopener">Wikimedia Commons</a>
              </figcaption>
            </figure>
          }
        </div>
      } @else {
        <div class="ph empty">{{ state.lang() === 'el' ? 'Δεν βρέθηκαν ακόμα φωτογραφίες για αυτή την παραλία.' : 'No photos found for this beach yet.' }}</div>
      }
    }
  `,
  styles: [`
    .strip { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; margin: 0 -16px; padding: 0 16px 4px; }
    figure { margin: 0; flex: none; width: 82%; max-width: 420px; scroll-snap-align: start; }
    figure img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; display: block; background: var(--ion-color-light); }
    figcaption { font-size: 11px; color: var(--ion-color-medium); margin-top: 4px; line-height: 1.35;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    figcaption a { color: inherit; }
    .ph { height: 120px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--ion-color-light); }
    .ph.empty { height: auto; padding: 12px; font-size: 13px; color: var(--ion-color-medium); }
    .thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; display: block; flex: none; }
  `],
})
export class PhotoGalleryComponent {
  state = inject(AppState);
  private service = inject(PhotoService);

  beach = input.required<Beach>();
  mode = input<'gallery' | 'thumb'>('gallery');

  photos = signal<Photo[]>([]);
  loading = signal(true);

  constructor() {
    effect(() => {
      const b = this.beach();
      this.loading.set(true);
      this.photos.set([]);
      this.service.photosFor(b).then((list) => {
        if (this.beach() !== b) return; // άλλαξε παραλία στο μεταξύ
        this.photos.set(list);
        this.loading.set(false);
      });
    });
  }

  /** Αν μια εικόνα δεν φορτώσει, τη βγάζουμε από τη λίστα. */
  hide(p: Photo) {
    this.photos.set(this.photos().filter((x) => x !== p));
  }
}
