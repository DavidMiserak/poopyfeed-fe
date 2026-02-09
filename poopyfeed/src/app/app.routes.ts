import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing').then((m) => m.Landing),
    title: 'PoopyFeed - Simple Baby Care Tracking',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
    title: 'Login - PoopyFeed',
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup').then((m) => m.Signup),
    title: 'Sign Up - PoopyFeed',
  },
];
