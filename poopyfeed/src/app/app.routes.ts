import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

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
  {
    path: 'children',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./children/list/children-list').then((m) => m.ChildrenList),
        title: 'My Children - PoopyFeed',
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./children/form/child-form').then((m) => m.ChildForm),
        title: 'Add Baby - PoopyFeed',
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./children/form/child-form').then((m) => m.ChildForm),
        title: 'Edit Baby - PoopyFeed',
      },
      {
        path: ':id/delete',
        loadComponent: () =>
          import('./children/delete/child-delete').then((m) => m.ChildDelete),
        title: 'Delete Baby - PoopyFeed',
      },
      {
        path: ':childId/dashboard',
        loadComponent: () =>
          import('./children/dashboard/child-dashboard').then(
            (m) => m.ChildDashboard
          ),
        title: 'Dashboard - PoopyFeed',
      },
    ],
  },
];
