import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
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

describe('TimezoneCheckService', () => {
  let service: TimezoneCheckService;
  let profileSignal: ReturnType<typeof signal<UserProfile | null>>;
  let accountServiceMock: { profile: typeof profileSignal; updateProfile: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionStorage.clear();
    profileSignal = signal<UserProfile | null>(null);
    accountServiceMock = {
      profile: profileSignal,
      updateProfile: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
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
      const browserTz = DateTimeService.getBrowserTimezone();
      const differentTz = browserTz === 'America/New_York' ? 'America/Chicago' : 'America/New_York';
      profileSignal.set({ ...mockProfile, timezone: differentTz });
      expect(service.showBanner()).toBe(true);
    });

    it('should not show after dismiss', () => {
      const browserTz = DateTimeService.getBrowserTimezone();
      const differentTz = browserTz === 'America/New_York' ? 'America/Chicago' : 'America/New_York';
      profileSignal.set({ ...mockProfile, timezone: differentTz });
      expect(service.showBanner()).toBe(true);

      service.dismiss();
      expect(service.showBanner()).toBe(false);
    });

    it('should not show while timezone update is in progress', () => {
      const browserTz = DateTimeService.getBrowserTimezone();
      const differentTz = browserTz === 'America/New_York' ? 'America/Chicago' : 'America/New_York';
      profileSignal.set({ ...mockProfile, timezone: differentTz });
      expect(service.showBanner()).toBe(true);

      // updateToDetectedTimezone sets updating=true synchronously
      accountServiceMock.updateProfile.mockReturnValue(of({ ...mockProfile, timezone: browserTz! }));
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
      const browserTz = DateTimeService.getBrowserTimezone();
      const differentTz = browserTz === 'America/New_York' ? 'America/Chicago' : 'America/New_York';
      profileSignal.set({ ...mockProfile, timezone: differentTz });

      service.dismiss();
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
      const browserTz = DateTimeService.getBrowserTimezone();
      const differentTz = browserTz === 'America/New_York' ? 'America/Chicago' : 'America/New_York';
      profileSignal.set({ ...mockProfile, timezone: differentTz });

      accountServiceMock.updateProfile.mockReturnValue(of({ ...mockProfile }));
      service.updateToDetectedTimezone();
      expect(service.showBanner()).toBe(false);

      service.finishUpdate();
      // Profile still has differentTz so mismatch is still present
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
});

describe('TimezoneCheckService (pre-dismissed session)', () => {
  let service: TimezoneCheckService;
  let profileSignal: ReturnType<typeof signal<UserProfile | null>>;

  beforeEach(() => {
    sessionStorage.setItem('tz-banner-dismissed', 'true');

    profileSignal = signal<UserProfile | null>(null);

    TestBed.configureTestingModule({
      providers: [
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
    const browserTz = DateTimeService.getBrowserTimezone();
    const differentTz = browserTz === 'America/New_York' ? 'America/Chicago' : 'America/New_York';
    profileSignal.set({ ...mockProfile, timezone: differentTz });

    expect(service.showBanner()).toBe(false);
  });
});
