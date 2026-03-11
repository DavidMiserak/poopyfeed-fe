import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookieConsentBanner } from './cookie-consent-banner';
import { GaTrackingService } from '../../services/ga-tracking.service';

describe('CookieConsentBanner', () => {
  let component: CookieConsentBanner;
  let fixture: ComponentFixture<CookieConsentBanner>;
  let gaService: { enableTracking: ReturnType<typeof vi.fn>; disableTracking: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    gaService = { enableTracking: vi.fn(), disableTracking: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: GaTrackingService, useValue: gaService }],
    });

    fixture = TestBed.createComponent(CookieConsentBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show banner when no consent stored', () => {
    expect(component.visible()).toBe(true);
  });

  it('should hide banner when consent already granted', () => {
    localStorage.setItem('analytics_consent', 'granted');
    fixture = TestBed.createComponent(CookieConsentBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.visible()).toBe(false);
  });

  it('should hide banner when consent already denied', () => {
    localStorage.setItem('analytics_consent', 'denied');
    fixture = TestBed.createComponent(CookieConsentBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.visible()).toBe(false);
  });

  it('should call enableTracking and hide on accept', () => {
    component.accept();
    expect(gaService.enableTracking).toHaveBeenCalled();
    expect(component.visible()).toBe(false);
  });

  it('should call disableTracking and hide on decline', () => {
    component.decline();
    expect(gaService.disableTracking).toHaveBeenCalled();
    expect(component.visible()).toBe(false);
  });
});
