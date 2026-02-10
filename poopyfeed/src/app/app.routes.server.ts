import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static public routes - these can be safely prerendered
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'login',
    renderMode: RenderMode.Prerender,
  },
  {
    path: 'signup',
    renderMode: RenderMode.Prerender,
  },
  // Protected routes with dynamic parameters - use SSR without prerendering
  // These routes require authentication and contain dynamic parameters
  // that cannot be prerendered without knowing all possible parameter values
  {
    path: 'account',
    renderMode: RenderMode.Server,
  },
  {
    path: 'children/**',
    renderMode: RenderMode.Server,
  },
  {
    path: 'invites/**',
    renderMode: RenderMode.Server,
  },
];
