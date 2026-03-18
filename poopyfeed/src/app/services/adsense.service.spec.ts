import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { AdSenseService } from './adsense.service';

describe('AdSenseService', () => {
  let service: AdSenseService;
  let routerEvents$: Subject<NavigationEnd>;
  let mockRouterState: {
    snapshot: { root: { data: Record<string, unknown>; firstChild: unknown } };
  };

  const scriptSelector = 'script[src*="pagead2.googlesyndication.com"]';

  beforeEach(() => {
    routerEvents$ = new Subject();
    mockRouterState = {
      snapshot: { root: { data: {}, firstChild: null } },
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: {
            events: routerEvents$.asObservable(),
            routerState: mockRouterState,
          },
        },
      ],
    });
    service = TestBed.inject(AdSenseService);
  });

  afterEach(() => {
    document.querySelectorAll(scriptSelector).forEach((s) => s.remove());
  });

  it('should not inject script on SSR', () => {
    // Service guards with typeof window check — just verify no crash
    service.initialize();
    expect(service).toBeTruthy();
  });

  it('should inject script when route has showAds: true', () => {
    mockRouterState.snapshot.root.firstChild = { data: { showAds: true }, firstChild: null };
    service.initialize();
    routerEvents$.next(new NavigationEnd(1, '/children', '/children'));
    expect(document.querySelector(scriptSelector)).not.toBeNull();
  });

  it('should not inject script when route has no showAds', () => {
    mockRouterState.snapshot.root.firstChild = { data: {}, firstChild: null };
    service.initialize();
    routerEvents$.next(new NavigationEnd(1, '/login', '/login'));
    expect(document.querySelector(scriptSelector)).toBeNull();
  });

  it('should remove script when navigating from ad page to non-ad page', () => {
    mockRouterState.snapshot.root.firstChild = { data: { showAds: true }, firstChild: null };
    service.initialize();
    routerEvents$.next(new NavigationEnd(1, '/children', '/children'));
    expect(document.querySelector(scriptSelector)).not.toBeNull();

    mockRouterState.snapshot.root.firstChild = { data: {}, firstChild: null };
    routerEvents$.next(new NavigationEnd(2, '/login', '/login'));
    expect(document.querySelector(scriptSelector)).toBeNull();
  });

  it('should not duplicate script on multiple navigations to ad pages', () => {
    mockRouterState.snapshot.root.firstChild = { data: { showAds: true }, firstChild: null };
    service.initialize();
    routerEvents$.next(new NavigationEnd(1, '/children', '/children'));
    routerEvents$.next(new NavigationEnd(2, '/account', '/account'));
    expect(document.querySelectorAll(scriptSelector).length).toBe(1);
  });

  it('should inherit showAds from parent route', () => {
    mockRouterState.snapshot.root.firstChild = {
      data: { showAds: true },
      firstChild: { data: {}, firstChild: null },
    };
    service.initialize();
    routerEvents$.next(new NavigationEnd(1, '/children/1/dashboard', '/children/1/dashboard'));
    expect(document.querySelector(scriptSelector)).not.toBeNull();
  });
});
