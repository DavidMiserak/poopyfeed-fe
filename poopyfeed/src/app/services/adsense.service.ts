import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdSenseService {
  private router = inject(Router);
  private readonly publisherId = 'ca-pub-6269498301275945';
  private scriptElement: HTMLScriptElement | null = null;

  initialize(): void {
    if (typeof window === 'undefined') return;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.onRouteChange());
  }

  private onRouteChange(): void {
    const showAds = this.getShowAds(this.router.routerState.snapshot.root);
    if (showAds) {
      this.injectScript();
    } else {
      this.removeScript();
    }
  }

  private getShowAds(route: ActivatedRouteSnapshot | null): boolean {
    while (route) {
      if (route.data['showAds']) {
        return true;
      }
      route = route.firstChild;
    }
    return false;
  }

  private injectScript(): void {
    if (this.scriptElement) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.publisherId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    this.scriptElement = script;
  }

  private removeScript(): void {
    if (!this.scriptElement) return;
    this.scriptElement.remove();
    this.scriptElement = null;
  }
}
