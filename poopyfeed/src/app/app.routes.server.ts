import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static public routes - prerendered at build time for fast initial loads
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
  // Protected/dynamic routes - client-only rendering
  // No SEO value and auth guard bypasses SSR anyway, so server-rendering
  // these just produces an empty shell that gets replaced on hydration
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
