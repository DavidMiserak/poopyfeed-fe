import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import {
  NoPreloading,
  provideRouter,
  withPreloading,
  TitleStrategy,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { PoopyFeedTitleStrategy } from './seo/title-strategy.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: TitleStrategy, useClass: PoopyFeedTitleStrategy },
    // NoPreloading: load route chunks only when navigating. Keeps initial bundle smaller and TTI lower.
    provideRouter(routes, withPreloading(NoPreloading)),
    provideClientHydration(withEventReplay(), withHttpTransferCacheOptions({})),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
