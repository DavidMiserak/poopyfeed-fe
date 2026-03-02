import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { NoPreloading, provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
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
