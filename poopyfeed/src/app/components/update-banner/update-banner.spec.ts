import { TestBed } from '@angular/core/testing';
import { ErrorHandler, PLATFORM_ID } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { UpdateBanner } from './update-banner';

describe('UpdateBanner', () => {
  let versionUpdates$: Subject<VersionReadyEvent>;

  function createComponent(options: { enabled?: boolean; platform?: string } = {}) {
    const { enabled = true, platform = 'browser' } = options;
    versionUpdates$ = new Subject();

    const swUpdateMock = {
      isEnabled: enabled,
      versionUpdates: versionUpdates$.asObservable(),
      activateUpdate: vi.fn().mockResolvedValue(undefined),
      checkForUpdate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      imports: [UpdateBanner],
      providers: [
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: PLATFORM_ID, useValue: platform },
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    });

    const fixture = TestBed.createComponent(UpdateBanner);
    fixture.detectChanges();
    return { fixture, swUpdateMock };
  }

  it('should create', () => {
    const { fixture } = createComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show banner initially', () => {
    const { fixture } = createComponent();
    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner).toBeNull();
  });

  it('should show banner when VERSION_READY event fires', () => {
    const { fixture } = createComponent();

    versionUpdates$.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'abc' },
      latestVersion: { hash: 'def' },
    });
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('A new version is available');
  });

  it('should dismiss banner when dismiss button clicked', () => {
    const { fixture } = createComponent();

    versionUpdates$.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'abc' },
      latestVersion: { hash: 'def' },
    });
    fixture.detectChanges();

    const dismissButton = fixture.nativeElement.querySelector(
      'button[aria-label="Dismiss update notification"]',
    );
    dismissButton.click();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner).toBeNull();
  });

  it('should activate update and reload when update button clicked', async () => {
    const { fixture, swUpdateMock } = createComponent();

    versionUpdates$.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'abc' },
      latestVersion: { hash: 'def' },
    });
    fixture.detectChanges();

    const updateButton = fixture.nativeElement.querySelector('button:not([aria-label])');
    updateButton.click();
    await fixture.whenStable();

    expect(swUpdateMock.activateUpdate).toHaveBeenCalled();
  });

  it('should not subscribe when service worker is disabled', () => {
    const { fixture } = createComponent({ enabled: false });

    versionUpdates$.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'abc' },
      latestVersion: { hash: 'def' },
    });
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner).toBeNull();
  });

  it('should not subscribe during SSR', () => {
    const { fixture } = createComponent({ platform: 'server' });

    versionUpdates$.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'abc' },
      latestVersion: { hash: 'def' },
    });
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner).toBeNull();
  });
});
