import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/** Προφορτώνει τις σελίδες του τουρίστα, αλλά ΟΧΙ τη σελίδα διαχείρισης (είναι μεγάλη και δεν τη χρειάζονται). */
@Injectable({ providedIn: 'root' })
export class SkipAdminPreloading implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.data?.['noPreload'] ? of(null) : load();
  }
}
