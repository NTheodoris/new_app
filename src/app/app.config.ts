import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bulb, list, locate, map, navigate, star, starOutline } from 'ionicons/icons';

import { routes } from './app.routes';
import { SkipAdminPreloading } from './preload';

addIcons({ bulb, list, locate, map, navigate, star, 'star-outline': starOutline });

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes, withPreloading(SkipAdminPreloading), withComponentInputBinding()),
  ],
};
