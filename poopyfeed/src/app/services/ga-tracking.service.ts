import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../environments/environment';

export type GaEventName =
  | 'sign_up'
  | 'login'
  | 'log_feeding'
  | 'log_diaper'
  | 'log_nap'
  | 'edit_entry'
  | 'delete_entry'
  | 'add_child'
  | 'edit_child'
  | 'delete_child'
  | 'share_child'
  | 'accept_invite'
  | 'remove_member'
  | 'export_csv'
  | 'export_pdf'
  | 'view_analytics_dashboard'
  | 'enable_notifications';

export interface GaUserProperties {
  role?: string;
  child_count?: number;
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

@Injectable({ providedIn: 'root' })
export class GaTrackingService {
  private router = inject(Router);
  private ga4Id = environment.ga4Id;
  private active = false;

  initialize(): void {
    if (typeof window === 'undefined' || !this.ga4Id) return;
    const consent = localStorage.getItem('analytics_consent');
    if (consent === 'granted') {
      this.activate();
    }
  }

  enableTracking(): void {
    if (typeof window === 'undefined' || !this.ga4Id) return;
    localStorage.setItem('analytics_consent', 'granted');
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    this.activate();
  }

  disableTracking(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('analytics_consent', 'denied');
    this.active = false;
  }

  trackEvent(eventName: GaEventName, params?: Record<string, unknown>): void {
    if (!this.active) return;
    window.gtag('event', eventName, params);
  }

  setUserProperties(props: GaUserProperties): void {
    if (!this.active) return;
    window.gtag('set', 'user_properties', props);
  }

  private activate(): void {
    if (this.active) return;
    this.injectScript();
    this.active = true;
    this.listenToRouteChanges();
  }

  private injectScript(): void {
    if (document.querySelector('script[src*="gtag/js"]')) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('consent', 'default', { analytics_storage: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('config', this.ga4Id, { send_page_view: false });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.ga4Id}`;
    document.head.appendChild(script);
  }

  private listenToRouteChanges(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        window.gtag('event', 'page_view', {
          page_path: e.urlAfterRedirects,
          page_title: document.title,
        });
      });
  }
}
