import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { GaTrackingService } from './ga-tracking.service';

describe('GaTrackingService', () => {
  let service: GaTrackingService;
  let routerEvents$: Subject<NavigationEnd>;

  beforeEach(() => {
    routerEvents$ = new Subject();
    (window as unknown as Record<string, unknown>)['gtag'] = vi.fn();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { events: routerEvents$.asObservable() },
        },
      ],
    });
    service = TestBed.inject(GaTrackingService);
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)['gtag'];
    document.querySelectorAll('script[src*="gtag"]').forEach((s) => s.remove());
  });

  describe('initialization', () => {
    it('should not inject script when ga4Id is empty', () => {
      service.initialize();
      expect(document.querySelector('script[src*="gtag"]')).toBeNull();
    });

    it('should not inject script when consent is denied', () => {
      localStorage.setItem('analytics_consent', 'denied');
      service.initialize();
      expect(document.querySelector('script[src*="gtag"]')).toBeNull();
    });
  });

  describe('trackEvent', () => {
    it('should no-op when not initialized', () => {
      service.trackEvent('login');
      expect(window.gtag).not.toHaveBeenCalled();
    });
  });

  describe('setUserProperties', () => {
    it('should no-op when not initialized', () => {
      service.setUserProperties({ role: 'owner', child_count: 1 });
      expect(window.gtag).not.toHaveBeenCalled();
    });
  });

  describe('consent flow', () => {
    it('should track events after enableTracking is called with valid ga4Id', () => {
      service['ga4Id'] = 'G-TEST123';
      service.enableTracking();
      window.gtag = vi.fn();
      service.trackEvent('login');
      expect(window.gtag).toHaveBeenCalledWith('event', 'login', undefined);
    });
  });

  describe('page view tracking', () => {
    it('should send page_view on NavigationEnd when active', () => {
      service['ga4Id'] = 'G-TEST123';
      service.enableTracking();
      window.gtag = vi.fn();
      routerEvents$.next(new NavigationEnd(1, '/children', '/children'));
      expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', {
        page_path: '/children',
        page_title: document.title,
      });
    });
  });
});
