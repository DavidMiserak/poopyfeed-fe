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
    data: {
      description:
        'PoopyFeed helps families and caregivers track feedings, diapers, and naps in one simple app. Stay coordinated and reduce guesswork.',
    },
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
    title: 'Login - PoopyFeed',
    data: { description: 'Log in to PoopyFeed to track feedings, diapers, and naps for your baby.' },
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup').then((m) => m.Signup),
    title: 'Sign Up - PoopyFeed',
    data: { description: 'Create a free PoopyFeed account to start tracking your baby’s feedings, diapers, and naps.' },
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword
      ),
    title: 'Forgot Password - PoopyFeed',
    data: { description: 'Reset your PoopyFeed password.' },
  },
  {
    path: 'auth/reset-password/:key',
    loadComponent: () =>
      import('./auth/reset-password/reset-password').then(
        (m) => m.ResetPassword
      ),
    title: 'Reset Password - PoopyFeed',
    data: { description: 'Set a new password for your PoopyFeed account.' },
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./account/settings/account-settings').then(
        (m) => m.AccountSettings
      ),
    title: 'Account Settings - PoopyFeed',
    data: { description: 'Manage your PoopyFeed account, password, and notification preferences.' },
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./notifications/notifications-page').then(
        (m) => m.NotificationsPage
      ),
    title: 'Notifications - PoopyFeed',
    data: { description: 'View and manage your PoopyFeed activity notifications.' },
  },
  {
    path: 'quick-log/:type',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./quick-log/quick-log-redirect').then(
        (m) => m.QuickLogRedirect
      ),
    title: 'Quick Log - PoopyFeed',
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
        data: { description: 'View and manage your baby profiles in PoopyFeed.' },
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
        data: { description: 'Baby dashboard: today’s summary, quick log, and recent activity.' },
      },
      {
        path: ':childId/advanced',
        loadComponent: () =>
          import('./children/advanced/child-advanced').then(
            (m) => m.ChildAdvanced
          ),
        title: 'Advanced - PoopyFeed',
      },
      {
        path: ':childId/pediatrician-summary',
        loadComponent: () =>
          import('./children/pediatrician-summary/pediatrician-summary').then(
            (m) => m.PediatricianSummaryComponent
          ),
        title: 'Pediatrician Summary - PoopyFeed',
      },
      {
        path: ':childId/pediatrician-summary/print',
        loadComponent: () =>
          import(
            './children/pediatrician-summary/pediatrician-summary-print/pediatrician-summary-print'
          ).then((m) => m.PediatricianSummaryPrintComponent),
        title: 'Print Summary - PoopyFeed',
      },
      {
        path: ':childId/analytics',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/analytics/analytics-dashboard').then(
                (m) => m.AnalyticsDashboard
              ),
            title: 'Analytics - PoopyFeed',
          },
          {
            path: 'export',
            loadComponent: () =>
              import('./features/analytics/export-page').then(
                (m) => m.ExportPage
              ),
            title: 'Export Data - PoopyFeed',
          },
        ],
      },
      {
        path: ':childId/catch-up',
        loadComponent: () =>
          import('./features/catch-up/catch-up').then(
            (m) => m.CatchUp
          ),
        title: 'Catch-Up Mode - PoopyFeed',
      },
      {
        path: ':childId/timeline',
        loadComponent: () =>
          import('./children/timeline/child-timeline').then(
            (m) => m.ChildTimeline
          ),
        title: 'Timeline - PoopyFeed',
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
  {
    path: 'privacy',
    loadComponent: () =>
      import('./legal/privacy-policy/privacy-policy').then(
        (m) => m.PrivacyPolicy
      ),
    title: 'Privacy Policy - PoopyFeed',
    data: { description: 'PoopyFeed privacy policy: how we collect, use, and protect your data.' },
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./legal/terms-of-service/terms-of-service').then(
        (m) => m.TermsOfService
      ),
    title: 'Terms of Service - PoopyFeed',
    data: { description: 'PoopyFeed terms of service and acceptable use.' },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./contact/contact').then((m) => m.Contact),
    title: 'Contact Us - PoopyFeed',
    data: { description: 'Contact the PoopyFeed team with questions or feedback.' },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found').then((m) => m.NotFound),
    title: 'Page Not Found - PoopyFeed',
    data: { description: 'This page could not be found.' },
  },
];
