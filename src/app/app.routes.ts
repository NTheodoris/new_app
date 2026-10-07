import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'map', loadComponent: () => import('./pages/map.page').then((m) => m.MapPage) },
      { path: 'list', loadComponent: () => import('./pages/list.page').then((m) => m.ListPage) },
      { path: 'tips', loadComponent: () => import('./pages/tips.page').then((m) => m.TipsPage) },
      { path: '', redirectTo: 'map', pathMatch: 'full' },
    ],
  },
  { path: 'beach/:id', loadComponent: () => import('./pages/beach.page').then((m) => m.BeachPage) },
  { path: '', redirectTo: 'tabs/map', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/map' },
];
