import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChildTimeline, ActivityItem } from './child-timeline';
import { ChildrenService } from '../../services/children.service';
import { FeedingsService } from '../../services/feedings.service';
import { DiapersService } from '../../services/diapers.service';
import { NapsService } from '../../services/naps.service';
import { ToastService } from '../../services/toast.service';
import { DateTimeService } from '../../services/datetime.service';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { Child } from '../../models/child.model';
import { Feeding } from '../../models/feeding.model';
import { DiaperChange } from '../../models/diaper.model';
import { Nap } from '../../models/nap.model';

describe('ChildTimeline', () => {
  let component: ChildTimeline;
  let fixture: ComponentFixture<ChildTimeline>;

  const mockChild: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-01-15T14:30:00Z',
    last_nap: '2024-01-15T13:00:00Z',
    last_feeding: '2024-01-15T12:00:00Z',
    custom_bottle_low_oz: null,
    custom_bottle_mid_oz: null,
    custom_bottle_high_oz: null,
  };

  const today = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(yesterday);

  const mockFeedings: Feeding[] = [
    {
      id: 1,
      child: 1,
      feeding_type: 'bottle',
      amount_oz: 5,
      duration_minutes: undefined,
      side: undefined,
      fed_at: `${todayStr}T08:00:00Z`,
      created_at: `${todayStr}T08:05:00Z`,
      updated_at: `${todayStr}T08:05:00Z`,
    },
    {
      id: 2,
      child: 1,
      feeding_type: 'bottle',
      amount_oz: 4,
      duration_minutes: undefined,
      side: undefined,
      fed_at: `${yesterdayStr}T10:00:00Z`,
      created_at: `${yesterdayStr}T10:05:00Z`,
      updated_at: `${yesterdayStr}T10:05:00Z`,
    },
  ];

  const mockDiapers: DiaperChange[] = [
    {
      id: 1,
      child: 1,
      change_type: 'wet',
      changed_at: `${todayStr}T10:30:00Z`,
      created_at: `${todayStr}T10:35:00Z`,
      updated_at: `${todayStr}T10:35:00Z`,
    },
  ];

  const mockNaps: Nap[] = [
    {
      id: 1,
      child: 1,
      duration_minutes: 45,
      napped_at: `${todayStr}T13:00:00Z`,
      ended_at: `${todayStr}T13:45:00Z`,
      created_at: `${todayStr}T14:00:00Z`,
      updated_at: `${todayStr}T14:00:00Z`,
    },
  ];

  beforeEach(async () => {
    const childrenServiceMock = {
      get: vi.fn(() => of(mockChild)),
    };
    const feedingsServiceMock = {
      list: vi.fn(() => of(mockFeedings)),
    };
    const diapersServiceMock = {
      list: vi.fn(() => of(mockDiapers)),
    };
    const napsServiceMock = {
      list: vi.fn(() => of(mockNaps)),
      create: vi.fn(),
    };
    const routerMock = {
      navigate: vi.fn(),
    };
    const toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    const dateTimeServiceMock = {
      toUTC: vi.fn((date: Date) => date.toISOString()),
      toLocal: vi.fn(),
      toInputFormat: vi.fn(),
      formatTimeHHmm: vi.fn((utcString: string) => {
        const d = new Date(utcString);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }),
      get userTimezone() {
        return 'UTC';
      },
      getDateInUserTimezone: vi.fn((date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(d);
      }),
      getTodayInUserTimezone: vi.fn(() => {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date());
      }),
      getDateNDaysAgoInUserTimezone: vi.fn((daysAgo: number) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(date);
      }),
      getTomorrowInUserTimezone: vi.fn(() => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(date);
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ChildTimeline, ErrorCardComponent],
      providers: [
        provideRouter([]),
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: FeedingsService, useValue: feedingsServiceMock },
        { provide: DiapersService, useValue: diapersServiceMock },
        { provide: NapsService, useValue: napsServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: DateTimeService, useValue: dateTimeServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChildTimeline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load child and timeline data on init', () => {
      component.ngOnInit();

      expect(component.child()).toEqual(mockChild);
      expect(component.isLoading()).toBeFalsy();
    });

    it('should default to today on load', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.dayOffset()).toBe(0);
      expect(component.dayHeader()).toBe('Today');
    });

    it('should handle API errors gracefully', async () => {
      const childrenService = TestBed.inject(ChildrenService) as any;
      childrenService.get.mockReturnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(component.error()).toBeTruthy();
      expect(component.isLoading()).toBeFalsy();
    });
  });

  describe('day header', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should show "Today" for current day', () => {
      component.dayOffset.set(0);
      expect(component.dayHeader()).toBe('Today');
    });

    it('should show "Yesterday" for one day back', () => {
      component.dayOffset.set(1);
      expect(component.dayHeader()).toBe('Yesterday');
    });

    it('should show formatted date for older days', () => {
      component.dayOffset.set(2);
      const header = component.dayHeader();
      expect(header).toMatch(/\w+, \w{3} \d{1,2}/);
    });
  });

  describe('day navigation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should navigate to previous day', () => {
      component.dayOffset.set(0);
      component.goToPreviousDay();
      expect(component.dayOffset()).toBe(1);
    });

    it('should navigate to next day', () => {
      component.dayOffset.set(1);
      component.goToNextDay();
      expect(component.dayOffset()).toBe(0);
    });

    it('should not allow navigation beyond 7 days', () => {
      component.dayOffset.set(6);
      component.goToPreviousDay();
      expect(component.dayOffset()).toBe(6);
    });

    it('should not allow navigation past today', () => {
      component.dayOffset.set(0);
      component.goToNextDay();
      expect(component.dayOffset()).toBe(0);
    });

    it('should enable Previous button when not at limit', () => {
      component.dayOffset.set(0);
      expect(component.canGoPrevious()).toBeTruthy();
    });

    it('should disable Previous button at 7-day limit', () => {
      component.dayOffset.set(6);
      expect(component.canGoPrevious()).toBeFalsy();
    });

    it('should enable Next button when not at today', () => {
      component.dayOffset.set(1);
      expect(component.canGoNext()).toBeTruthy();
    });

    it('should disable Next button when viewing today', () => {
      component.dayOffset.set(0);
      expect(component.canGoNext()).toBeFalsy();
    });
  });

  describe('event display', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display events for today in reverse chronological order', () => {
      component.dayOffset.set(0);
      fixture.detectChanges();

      const activitiesWithGap = component.dayActivities();
      expect(activitiesWithGap.length).toBe(3);
      // Newest first (13:00), then 10:30, then oldest (08:00)
      expect(activitiesWithGap[0].activity.timestamp).toBe(`${todayStr}T13:00:00Z`);
      expect(activitiesWithGap[1].activity.timestamp).toBe(`${todayStr}T10:30:00Z`);
      expect(activitiesWithGap[2].activity.timestamp).toBe(`${todayStr}T08:00:00Z`);
    });

    it('should display events for yesterday', () => {
      component.dayOffset.set(1);
      fixture.detectChanges();

      const activitiesWithGap = component.dayActivities();
      expect(activitiesWithGap.length).toBe(1);
      expect(activitiesWithGap[0].activity.type).toBe('feeding');
    });

    it('should show empty state when no events on day', () => {
      component.dayOffset.set(3);
      fixture.detectChanges();

      const activitiesWithGap = component.dayActivities();
      expect(activitiesWithGap.length).toBe(0);
    });
  });

  describe('activity title generation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should format bottle feeding title', () => {
      const item: ActivityItem = {
        id: 1,
        type: 'feeding' as const,
        timestamp: mockFeedings[0].fed_at,
        data: mockFeedings[0],
      };
      expect(component.getActivityTitle(item)).toBe('Bottle: 5 oz');
    });

    it('should format breast feeding title', () => {
      const breastFeeding: Feeding = {
        id: 3,
        child: 1,
        feeding_type: 'breast',
        amount_oz: undefined,
        duration_minutes: 7,
        side: 'left',
        fed_at: `${todayStr}T12:00:00Z`,
        created_at: `${todayStr}T12:05:00Z`,
        updated_at: `${todayStr}T12:05:00Z`,
      };
      const item: ActivityItem = {
        id: 3,
        type: 'feeding' as const,
        timestamp: breastFeeding.fed_at,
        data: breastFeeding,
      };
      expect(component.getActivityTitle(item)).toBe('Breast: 7m (left)');
    });

    it('should format diaper change title for wet', () => {
      const item: ActivityItem = {
        id: 1,
        type: 'diaper' as const,
        timestamp: mockDiapers[0].changed_at,
        data: mockDiapers[0],
      };
      expect(component.getActivityTitle(item)).toBe('Wet');
    });

    it('should format diaper change title for dirty', () => {
      const dirtyDiaper: DiaperChange = {
        id: 2,
        child: 1,
        change_type: 'dirty',
        changed_at: `${todayStr}T14:00:00Z`,
        created_at: `${todayStr}T14:05:00Z`,
        updated_at: `${todayStr}T14:05:00Z`,
      };
      const item: ActivityItem = {
        id: 2,
        type: 'diaper' as const,
        timestamp: dirtyDiaper.changed_at,
        data: dirtyDiaper,
      };
      expect(component.getActivityTitle(item)).toBe('Dirty');
    });

    it('should format nap title', () => {
      const item: ActivityItem = {
        id: 1,
        type: 'nap' as const,
        timestamp: mockNaps[0].napped_at,
        data: mockNaps[0],
      };
      expect(component.getActivityTitle(item)).toBe('Nap: 45m');
    });
  });

  describe('utility functions', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should expose getActivityIcon to template', () => {
      expect(component.getActivityIcon('feeding')).toBe('🍼');
      expect(component.getActivityIcon('diaper')).toBe('🧷');
      expect(component.getActivityIcon('nap')).toBe('😴');
    });

    it('should expose getGenderIcon to template', () => {
      expect(component.getGenderIcon('M')).toBe('👦');
      expect(component.getGenderIcon('F')).toBe('👧');
      expect(component.getGenderIcon('O')).toBe('👶');
    });

    it('should expose getChildAge to template', () => {
      const age = component.getChildAge(mockChild.date_of_birth);
      expect(typeof age).toBe('string');
      expect(age.length).toBeGreaterThan(0);
    });

    it('should expose formatTimestamp to template', () => {
      const formatted = component.formatTimestamp(`${todayStr}T12:00:00Z`);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('gap detection', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should not show gap for last activity (oldest)', () => {
      component.dayOffset.set(0);
      const activitiesWithGap = component.dayActivities();

      // Last activity in reverse chronological order is the oldest (08:00 feeding) with no gap
      expect(activitiesWithGap[2].gapMinutes).toBeNull();
    });

    it('should detect gap between feeding at 08:00 and diaper at 10:30', () => {
      component.dayOffset.set(0);
      const activitiesWithGap = component.dayActivities();

      // In reverse chronological order: diaper at 10:30 is at index 1
      // Gap = 10:30 - 08:00 = 150 minutes = 2h 30m
      expect(activitiesWithGap[1].gapMinutes).toBe(150);
      expect(activitiesWithGap[1].gapStartTime).toBe('08:00');
      expect(activitiesWithGap[1].gapEndTime).toBe('10:30');
    });

    it('should not show gap if less than 5 minutes', () => {
      // Add a feeding 3 minutes after another
      const newFeeding: Feeding = {
        id: 99,
        child: 1,
        feeding_type: 'bottle',
        amount_oz: 2,
        fed_at: `${todayStr}T08:03:00Z`,
        created_at: `${todayStr}T08:03:00Z`,
        updated_at: `${todayStr}T08:03:00Z`,
      };

      component.allActivities.set([
        ...component.allActivities(),
        {
          id: 99,
          type: 'feeding',
          timestamp: newFeeding.fed_at,
          data: newFeeding,
        },
      ]);

      component.dayOffset.set(0);
      const activitiesWithGap = component.dayActivities();

      // Find the new feeding (should be second after 08:00 feeding)
      const newFeedingActivity = activitiesWithGap.find(
        (a) => a.activity.id === 99
      );
      expect(newFeedingActivity?.gapMinutes).toBeNull();
      expect(newFeedingActivity?.gapStartTime).toBeNull();
      expect(newFeedingActivity?.gapEndTime).toBeNull();
    });

    it('should format gap time in minutes only', () => {
      expect(component.formatGapTime(30)).toBe('30m');
      expect(component.formatGapTime(45)).toBe('45m');
    });

    it('should format gap time in hours only', () => {
      expect(component.formatGapTime(60)).toBe('1h');
      expect(component.formatGapTime(120)).toBe('2h');
    });

    it('should format gap time in hours and minutes', () => {
      expect(component.formatGapTime(90)).toBe('1h 30m');
      expect(component.formatGapTime(150)).toBe('2h 30m');
      expect(component.formatGapTime(125)).toBe('2h 5m');
    });

    it('should calculate gap from nap end time, not start time', () => {
      // Nap: 13:00 - 13:45 (45 minutes)
      // Feeding: 14:30
      // Gap should be 13:45 - 14:30 = 45 minutes, not 13:00 - 14:30 = 90 minutes
      const napWithFeeding: Feeding = {
        id: 100,
        child: 1,
        feeding_type: 'bottle',
        amount_oz: 5,
        fed_at: `${todayStr}T14:30:00Z`,
        created_at: `${todayStr}T14:30:00Z`,
        updated_at: `${todayStr}T14:30:00Z`,
      };

      component.allActivities.set([
        ...component.allActivities(),
        {
          id: 100,
          type: 'feeding',
          timestamp: napWithFeeding.fed_at,
          data: napWithFeeding,
        },
      ]);

      component.dayOffset.set(0);
      const activitiesWithGap = component.dayActivities();

      // Find the feeding that comes after the nap
      const feedingAfterNap = activitiesWithGap.find(
        (a) => a.activity.id === 100
      );

      // Gap from nap end (13:45) to feeding (14:30) = 45 minutes
      expect(feedingAfterNap?.gapMinutes).toBe(45);
      expect(feedingAfterNap?.gapStartTime).toBe('13:45');
      expect(feedingAfterNap?.gapEndTime).toBe('14:30');
    });

    it('should handle nap with null ended_at by falling back to timestamp', () => {
      // Create a nap with null ended_at (edge case) at different time to avoid conflicts
      const napWithoutEndTime: Nap = {
        id: 101,
        child: 1,
        duration_minutes: 45,
        napped_at: `${todayStr}T11:30:00Z`,
        ended_at: null,
        created_at: `${todayStr}T12:15:00Z`,
        updated_at: `${todayStr}T12:15:00Z`,
      };

      const feedingAfterNap: Feeding = {
        id: 102,
        child: 1,
        feeding_type: 'bottle',
        amount_oz: 5,
        fed_at: `${todayStr}T12:30:00Z`,
        created_at: `${todayStr}T12:30:00Z`,
        updated_at: `${todayStr}T12:30:00Z`,
      };

      component.allActivities.set([
        ...component.allActivities(),
        {
          id: 101,
          type: 'nap',
          timestamp: napWithoutEndTime.napped_at,
          data: napWithoutEndTime,
        },
        {
          id: 102,
          type: 'feeding',
          timestamp: feedingAfterNap.fed_at,
          data: feedingAfterNap,
        },
      ]);

      component.dayOffset.set(0);
      const activitiesWithGap = component.dayActivities();

      // Find the feeding that comes after the nap
      const feedingActivity = activitiesWithGap.find(
        (a) => a.activity.id === 102
      );

      // Should fall back to nap start time (11:30 - 12:30 = 60 minutes)
      expect(feedingActivity?.gapMinutes).toBe(60);
      expect(feedingActivity?.gapStartTime).toBe('11:30');
      expect(feedingActivity?.gapEndTime).toBe('12:30');
    });
  });

  describe('mixed event types on same day', () => {
    it('should display all event types in reverse chronological order', () => {
      component.ngOnInit();
      fixture.detectChanges();
      component.dayOffset.set(0);

      const activitiesWithGap = component.dayActivities();
      expect(activitiesWithGap.length).toBe(3);
      // Newest first: nap (13:00), diaper (10:30), feeding (08:00)
      expect(activitiesWithGap[0].activity.type).toBe('nap');
      expect(activitiesWithGap[1].activity.type).toBe('diaper');
      expect(activitiesWithGap[2].activity.type).toBe('feeding');
    });

    it('should calculate gaps between different activity types', () => {
      component.ngOnInit();
      fixture.detectChanges();
      component.dayOffset.set(0);

      const activitiesWithGap = component.dayActivities();
      // First activity (nap): has gap from previous activity in time (diaper)
      expect(activitiesWithGap[0].gapMinutes).toBe(150);
      expect(activitiesWithGap[0].gapStartTime).toBe('10:30');
      expect(activitiesWithGap[0].gapEndTime).toBe('13:00');
      // Second activity (diaper): should have gap from feeding
      expect(activitiesWithGap[1].gapMinutes).toBe(150);
      expect(activitiesWithGap[1].gapStartTime).toBe('08:00');
      expect(activitiesWithGap[1].gapEndTime).toBe('10:30');
      // Third activity (feeding): no gap (last/oldest)
      expect(activitiesWithGap[2].gapMinutes).toBeNull();
    });
  });

  describe('add nap for gaps', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return true for owner role', () => {
      expect(component.canAddNap()).toBeTruthy();
    });

    it('should return false for caregiver role', () => {
      component.child.set({
        ...mockChild,
        user_role: 'caregiver',
      });
      expect(component.canAddNap()).toBeFalsy();
    });

    it('should return true for co-parent role', () => {
      component.child.set({
        ...mockChild,
        user_role: 'co-parent',
      });
      expect(component.canAddNap()).toBeTruthy();
    });

    it('should create nap with gap timestamps adjusted by ±1 minute', () => {
      const napsServiceMock = TestBed.inject(NapsService) as any;
      const toastServiceMock = TestBed.inject(ToastService) as any;

      const newNap = {
        ...mockNaps[0],
        id: 99,
        napped_at: `${todayStr}T08:01:00Z`,
        ended_at: `${todayStr}T10:29:00Z`,
      };

      vi.mocked(napsServiceMock.create).mockReturnValue(of(newNap));

      component.childId.set(1);
      component.dayOffset.set(0);

      const startTimestamp = `${todayStr}T08:00:00Z`;
      const endTimestamp = `${todayStr}T10:30:00Z`;
      component.addNapForGap(startTimestamp, endTimestamp);

      // Verify napsService.create was called with adjusted times (±1 minute)
      const callArgs = napsServiceMock.create.mock.calls[0][1];
      expect(callArgs.napped_at).toContain(`${todayStr}T08:01:00`); // +1 minute
      expect(callArgs.ended_at).toContain(`${todayStr}T10:29:00`); // -1 minute
      expect(callArgs.notes).toBeUndefined();

      expect(toastServiceMock.success).toHaveBeenCalledWith('Nap recorded');

      // Verify nap was added to timeline
      const activities = component.allActivities();
      const addedNap = activities.find((a) => a.id === 99);
      expect(addedNap).toBeTruthy();
      expect(addedNap?.type).toBe('nap');
    });
  });

  describe('timezone day boundary filtering', () => {
    /**
     * These tests verify that dayActivities correctly filters activities
     * when the user's timezone shifts day boundaries relative to UTC.
     *
     * Uses fixed dates (not new Date()) and controls selectedDateString
     * via dayOffset + mock to ensure deterministic results.
     */

    it('should place 4:30 AM UTC activity on Jan 15 in EST (11:30 PM EST)', () => {
      const dateTimeServiceMock = TestBed.inject(DateTimeService) as any;
      vi.mocked(dateTimeServiceMock.getDateInUserTimezone).mockImplementation(
        (date: Date | string) => {
          const d = typeof date === 'string' ? new Date(date) : date;
          return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d);
        }
      );
      vi.mocked(
        dateTimeServiceMock.getDateNDaysAgoInUserTimezone
      ).mockReturnValue('2024-01-15');

      // 4:30 AM UTC Jan 16 = 11:30 PM EST Jan 15
      component.allActivities.set([
        {
          id: 50,
          type: 'feeding',
          timestamp: '2024-01-16T04:30:00Z',
          data: {
            id: 50, child: 1, feeding_type: 'bottle', amount_oz: 5,
            fed_at: '2024-01-16T04:30:00Z',
            created_at: '2024-01-16T04:30:00Z',
            updated_at: '2024-01-16T04:30:00Z',
          } as Feeding,
        },
      ]);

      // dayOffset=1 triggers selectedDateString recomputation → '2024-01-15'
      component.dayOffset.set(1);

      const activities = component.dayActivities();
      expect(activities.length).toBe(1);
      expect(activities[0].activity.id).toBe(50);
    });

    it('should place 5:01 AM UTC activity on Jan 16 in EST (12:01 AM EST)', () => {
      const dateTimeServiceMock = TestBed.inject(DateTimeService) as any;
      vi.mocked(dateTimeServiceMock.getDateInUserTimezone).mockImplementation(
        (date: Date | string) => {
          const d = typeof date === 'string' ? new Date(date) : date;
          return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d);
        }
      );
      vi.mocked(
        dateTimeServiceMock.getDateNDaysAgoInUserTimezone
      ).mockReturnValue('2024-01-16');

      // 5:01 AM UTC Jan 16 = 12:01 AM EST Jan 16
      component.allActivities.set([
        {
          id: 51,
          type: 'diaper',
          timestamp: '2024-01-16T05:01:00Z',
          data: {
            id: 51, child: 1, change_type: 'wet',
            changed_at: '2024-01-16T05:01:00Z',
            created_at: '2024-01-16T05:01:00Z',
            updated_at: '2024-01-16T05:01:00Z',
          } as DiaperChange,
        },
      ]);

      // dayOffset=2 triggers selectedDateString recomputation → '2024-01-16'
      component.dayOffset.set(2);

      const activities = component.dayActivities();
      expect(activities.length).toBe(1);
      expect(activities[0].activity.id).toBe(51);
    });

    it('should split activities at EST midnight into correct days', () => {
      const dateTimeServiceMock = TestBed.inject(DateTimeService) as any;
      vi.mocked(dateTimeServiceMock.getDateInUserTimezone).mockImplementation(
        (date: Date | string) => {
          const d = typeof date === 'string' ? new Date(date) : date;
          return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d);
        }
      );

      // 4:00 AM UTC Jan 16 = 11:00 PM EST Jan 15 (previous day)
      // 5:00 AM UTC Jan 16 = 12:00 AM EST Jan 16 (current day)
      component.allActivities.set([
        {
          id: 60,
          type: 'feeding',
          timestamp: '2024-01-16T04:00:00Z',
          data: {
            id: 60, child: 1, feeding_type: 'bottle', amount_oz: 5,
            fed_at: '2024-01-16T04:00:00Z',
            created_at: '2024-01-16T04:00:00Z',
            updated_at: '2024-01-16T04:00:00Z',
          } as Feeding,
        },
        {
          id: 61,
          type: 'diaper',
          timestamp: '2024-01-16T05:00:00Z',
          data: {
            id: 61, child: 1, change_type: 'wet',
            changed_at: '2024-01-16T05:00:00Z',
            created_at: '2024-01-16T05:00:00Z',
            updated_at: '2024-01-16T05:00:00Z',
          } as DiaperChange,
        },
      ]);

      // View Jan 15 in EST — should only show the 11 PM feeding
      vi.mocked(
        dateTimeServiceMock.getDateNDaysAgoInUserTimezone
      ).mockReturnValue('2024-01-15');
      component.dayOffset.set(1);

      let dayActs = component.dayActivities();
      expect(dayActs.length).toBe(1);
      expect(dayActs[0].activity.id).toBe(60);

      // View Jan 16 in EST — should only show the midnight diaper
      vi.mocked(
        dateTimeServiceMock.getDateNDaysAgoInUserTimezone
      ).mockReturnValue('2024-01-16');
      component.dayOffset.set(2);

      dayActs = component.dayActivities();
      expect(dayActs.length).toBe(1);
      expect(dayActs[0].activity.id).toBe(61);
    });

    it('should correctly filter with positive timezone offset (Asia/Tokyo)', () => {
      const dateTimeServiceMock = TestBed.inject(DateTimeService) as any;
      vi.mocked(dateTimeServiceMock.getDateInUserTimezone).mockImplementation(
        (date: Date | string) => {
          const d = typeof date === 'string' ? new Date(date) : date;
          return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(d);
        }
      );

      // 11 PM UTC Jan 15 = 8 AM Tokyo Jan 16
      component.allActivities.set([
        {
          id: 70,
          type: 'nap',
          timestamp: '2024-01-15T23:00:00Z',
          data: {
            id: 70, child: 1, duration_minutes: 30,
            napped_at: '2024-01-15T23:00:00Z',
            ended_at: '2024-01-15T23:30:00Z',
            created_at: '2024-01-15T23:00:00Z',
            updated_at: '2024-01-15T23:00:00Z',
          } as Nap,
        },
      ]);

      // In Tokyo, this activity is on Jan 16
      vi.mocked(
        dateTimeServiceMock.getDateNDaysAgoInUserTimezone
      ).mockReturnValue('2024-01-16');
      component.dayOffset.set(1);

      let dayActs = component.dayActivities();
      expect(dayActs.length).toBe(1);
      expect(dayActs[0].activity.id).toBe(70);

      // Viewing Jan 15 in Tokyo should NOT show this activity
      vi.mocked(
        dateTimeServiceMock.getDateNDaysAgoInUserTimezone
      ).mockReturnValue('2024-01-15');
      component.dayOffset.set(2);

      dayActs = component.dayActivities();
      expect(dayActs.length).toBe(0);
    });
  });

  describe('Branch coverage - null/edge cases', () => {
    it('canAddNap should return false when child is null', () => {
      component.child.set(null);
      expect(component.canAddNap()).toBe(false);
    });

    it('canAddNap should return false for caregiver', () => {
      component.child.set({ ...mockChild, user_role: 'caregiver' });
      expect(component.canAddNap()).toBe(false);
    });

    it('canAddNap should return true for co-parent', () => {
      component.child.set({ ...mockChild, user_role: 'co-parent' });
      expect(component.canAddNap()).toBe(true);
    });

    it('addNapForGap should bail when childId is null', () => {
      component.childId.set(null);
      component.addNapForGap('2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z');
      // If it didn't bail, isAddingNap would be true
      expect(component.isAddingNap()).toBe(false);
    });

    it('addNapForGap should bail when isAddingNap is already true', () => {
      component.childId.set(1);
      component.isAddingNap.set(true);
      component.addNapForGap('2024-01-15T10:00:00Z', '2024-01-15T12:00:00Z');
      // isAddingNap should still be true (didn't change state)
      expect(component.isAddingNap()).toBe(true);
    });

    it('formatGapTime should format hours only when no remaining minutes', () => {
      expect(component.formatGapTime(120)).toBe('2h');
    });

    it('formatGapTime should format hours and minutes', () => {
      expect(component.formatGapTime(90)).toBe('1h 30m');
    });

    it('formatGapTime should format minutes only when less than 60', () => {
      expect(component.formatGapTime(45)).toBe('45m');
    });
  });
});
