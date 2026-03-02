import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, map, merge } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService {
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  private online = signal(true);

  readonly isOnline = this.online.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR: avoid showing offline banners during server render.
      return;
    }

    this.online.set(navigator.onLine);

    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isOnline) => this.online.set(isOnline));
  }
}
