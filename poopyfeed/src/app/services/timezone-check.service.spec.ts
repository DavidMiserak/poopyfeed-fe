import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimezoneCheckService } from './timezone-check.service';
import { AccountService } from './account.service';
import { DateTimeService } from './datetime.service';
import { UserProfile } from '../models/user.model';

const mockProfile: UserProfile = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  timezone: 'America/New_York',
};

function getDifferentTz(): string {
  const browserTz = DateTimeService.getBrowserTimezone();
  return browserTz === 'America/New_York'
    ? 'America/Chicago'
    : 'America/New_York';
}

describe('TimezoneCheckService', () => {
  let service: TimezoneCheckService;
  let profileSignal: ReturnType<typeof signal<UserProfile | null>>;
  let accountServiceMock: {
    profile: typeof profileSignal;
    updateProfile: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sessionStorage.clear();
    profileSignal = signal<UserProfile | null>(null);
    accountServiceMock = {
      profile: profileSignal,
      updateProfile: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        TimezoneCheckService,
        { provide: AccountService, useValue: accountServiceMock },
      ],
    });

    service = TestBed.inject(TimezoneCheckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showBanner', () => {
    it('should not show when profile is null', () => {
      expect(service.showBanner()).toBe(false);
    });

    it('should not show when timezones match', () => {
      const browserTz = DateTimeService.getBrowserTimezone();
      profileSignal.set({ ...mockProfile, timezone: browserTz! });
      expect(service.showBanner()).toBe(false);
    });

    it('should show when timezones differ', () => {
      profileSignal.set({ ...mockProfile, timezone: getDifferentTz() });
      expect(service.showBanner()).toBe(true);
    });

    it('should not show after dismiss', () => {
      profileSignal.set({ ...mockProfile, timezone: getDifferentTz() });
      expect(service.showBanner()).toBe(true);

      service.dismiss();
      expect(service.showBanner()).toBe(false);
    });

    it('should not show while timezone update is in progress', () => {
      const browserTz = DateTimeService.getBrowserTimezone();
      profileSignal.set({ ...mockProfile, timezone: getDifferentTz() });
      expect(service.showBanner()).toBe(true);

      accountServiceMock.updateProfile.mockReturnValue(
        of({ ...mockProfile, timezone: browserTz! })
      );
      service.updateToDetectedTimezone();
      expect(service.showBanner()).toBe(false);
    });
  });

  describe('dismiss', () => {
    it('should persist to sessionStorage', () => {
      service.dismiss();
      expect(sessionStorage.getItem('tz-banner-dismissed')).toBe('true');
    });

    it('should hide the banner', () => {
      profileSignal.set({ ...mockProfile, timezone: getDifferentTz() });

      service.dismiss();
      expect(service.showBanner()).toBe(false);
    });
  });

  describe('clearDismissal', () => {
    it('should re-show banner after it was dismissed', () => {
      profileSignal.set({ ...mockProfile, timezone: getDifferentTz() });
      service.dismiss();
      expect(service.showBanner()).toBe(false);

      service.clearDismissal();
      expect(service.showBanner()).toBe(true);
    });

    it('should remove sessionStorage key', () => {
      service.dismiss();
      expect(sessionStorage.getItem('tz-banner-dismissed')).toBe('true');

      service.clearDismissal();
      expect(sessionStorage.getItem('tz-banner-dismissed')).toBeNull();
    });

    it('should not show banner if timezones match after clearing', () => {
      const browserTz = DateTimeService.getBrowserTimezone();
      profileSignal.set({ ...mockProfile, timezone: getDifferentTz() });
      service.dismiss();

      profileSignal.set({ ...mockProfile, timezone: browserTz! });
      service.clearDismissal();
      expect(service.showBanner()).toBe(false);
    });
  });

  describe('profileTimezone', () => {
    it('should return UTC when no profile', () => {
      expect(service.profileTimezone()).toBe('UTC');
    });

    it('should return profile timezone', () => {
      profileSignal.set(mockProfile);
      expect(service.profileTimezone()).toBe('America/New_York');
    });
  });

  describe('finishUpdate', () => {
    it('should re-enable banner after update completes', () => {
      profileSignal.set({ ...mockProfile, timezone: getDifferentTz() });

      accountServiceMock.updateProfile.mockReturnValue(of({ ...mockProfile }));
      service.updateToDetectedTimezone();
      expect(service.showBanner()).toBe(false);

      service.finishUpdate();
      expect(service.showBanner()).toBe(true);
    });
  });

  describe('updateToDetectedTimezone', () => {
    it('should call updateProfile with browser timezone', () => {
      const browserTz = DateTimeService.getBrowserTimezone()!;
      const updatedProfile = { ...mockProfile, timezone: browserTz };
      accountServiceMock.updateProfile.mockReturnValue(of(updatedProfile));

      const obs = service.updateToDetectedTimezone();
      expect(obs).toBeTruthy();

      obs!.subscribe();
      expect(accountServiceMock.updateProfile).toHaveBeenCalledWith({
        timezone: browserTz,
      });
    });

    it('should return undefined when no browser timezone', () => {
      service.browserTimezone.set(null);
      const result = service.updateToDetectedTimezone();
      expect(result).toBeUndefined();
    });
  });

  describe('navigation refresh', () => {
    it('should refresh browserTimezone on route navigation', async () => {
      const router = TestBed.inject(Router);

      service.browserTimezone.set('Old/Zone');
      expect(service.browserTimezone()).toBe('Old/Zone');

      await router.navigateByUrl('/');

      const expected = DateTimeService.getBrowserTimezone();
      expect(service.browserTimezone()).toBe(expected);
    });

    it('should re-evaluate banner after navigation refreshes timezone', async () => {
      const router = TestBed.inject(Router);
      const browserTz = DateTimeService.getBrowserTimezone()!;

      profileSignal.set({ ...mockProfile, timezone: browserTz });
      expect(service.showBanner()).toBe(false);

      service.browserTimezone.set('Different/Zone');
      expect(service.showBanner()).toBe(true);

      await router.navigateByUrl('/');
      // Navigation refreshes browserTimezone back to real value, which matches profile
      expect(service.showBanner()).toBe(false);
    });
  });
});

describe('TimezoneCheckService (pre-dismissed session)', () => {
  let service: TimezoneCheckService;
  let profileSignal: ReturnType<typeof signal<UserProfile | null>>;

  beforeEach(() => {
    sessionStorage.setItem('tz-banner-dismissed', 'true');

    profileSignal = signal<UserProfile | null>(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        TimezoneCheckService,
        {
          provide: AccountService,
          useValue: { profile: profileSignal, updateProfile: vi.fn() },
        },
      ],
    });

    service = TestBed.inject(TimezoneCheckService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should not show banner when sessionStorage already has dismissed flag', () => {
    profileSignal.set({ ...mockProfile, timezone: getDifferentTz() });

    expect(service.showBanner()).toBe(false);
  });
});
