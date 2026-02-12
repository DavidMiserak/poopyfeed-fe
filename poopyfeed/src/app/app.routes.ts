import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicOnlyGuard } from './guards/public-only.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [publicOnlyGuard],
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
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./account/settings/account-settings').then(
        (m) => m.AccountSettings
      ),
    title: 'Account Settings - PoopyFeed',
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
      {
        path: ':childId/analytics',
        loadComponent: () =>
          import('./features/analytics/analytics-dashboard').then(
            (m) => m.AnalyticsDashboard
          ),
        title: 'Analytics - PoopyFeed',
      },
      {
        path: ':childId/feedings',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./children/feedings/list/feedings-list').then(
                (m) => m.FeedingsList
              ),
            title: 'Feedings - PoopyFeed',
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./children/feedings/form/feeding-form').then(
                (m) => m.FeedingForm
              ),
            title: 'Add Feeding - PoopyFeed',
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./children/feedings/form/feeding-form').then(
                (m) => m.FeedingForm
              ),
            title: 'Edit Feeding - PoopyFeed',
          },
          {
            path: ':id/delete',
            loadComponent: () =>
              import('./children/feedings/delete/feeding-delete').then(
                (m) => m.FeedingDelete
              ),
            title: 'Delete Feeding - PoopyFeed',
          },
        ],
      },
      {
        path: ':childId/diapers',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./children/diapers/list/diapers-list').then(
                (m) => m.DiapersList
              ),
            title: 'Diaper Changes - PoopyFeed',
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./children/diapers/form/diaper-form').then(
                (m) => m.DiaperForm
              ),
            title: 'Add Diaper Change - PoopyFeed',
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./children/diapers/form/diaper-form').then(
                (m) => m.DiaperForm
              ),
            title: 'Edit Diaper Change - PoopyFeed',
          },
          {
            path: ':id/delete',
            loadComponent: () =>
              import('./children/diapers/delete/diaper-delete').then(
                (m) => m.DiaperDelete
              ),
            title: 'Delete Diaper Change - PoopyFeed',
          },
        ],
      },
      {
        path: ':childId/naps',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./children/naps/list/naps-list').then((m) => m.NapsList),
            title: 'Naps - PoopyFeed',
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./children/naps/form/nap-form').then((m) => m.NapForm),
            title: 'Add Nap - PoopyFeed',
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./children/naps/form/nap-form').then((m) => m.NapForm),
            title: 'Edit Nap - PoopyFeed',
          },
          {
            path: ':id/delete',
            loadComponent: () =>
              import('./children/naps/delete/nap-delete').then(
                (m) => m.NapDelete
              ),
            title: 'Delete Nap - PoopyFeed',
          },
        ],
      },
      {
        path: ':childId/sharing',
        loadComponent: () =>
          import('./children/sharing/sharing-manage').then(
            (m) => m.SharingManage
          ),
        title: 'Manage Sharing - PoopyFeed',
      },
    ],
  },
  {
    path: 'invites/accept/:token',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./invites/accept/invite-accept').then((m) => m.InviteAccept),
    title: 'Accept Invite - PoopyFeed',
  },
];
