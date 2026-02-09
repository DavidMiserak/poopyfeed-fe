import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing').then((m) => m.Landing),
    title: 'PoopyFeed - Simple Baby Care Tracking',
  },
];
