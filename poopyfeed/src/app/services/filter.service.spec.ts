import { TestBed } from '@angular/core/testing';
import { FilterService, FilterCriteria } from './filter.service';
import { DateTimeService } from './datetime.service';
import { AccountService } from './account.service';
import { signal } from '@angular/core';
import { Feeding } from '../models/feeding.model';
import { DiaperChange } from '../models/diaper.model';

describe('FilterService', () => {
  let service: FilterService;
  let profileSignal: ReturnType<typeof signal>;

  beforeEach(() => {
    profileSignal = signal(null);

    TestBed.configureTestingModule({
      providers: [
        DateTimeService,
        {
          provide: AccountService,
          useValue: { profile: profileSignal },
        },
      ],
    });
    service = TestBed.inject(FilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('filter()', () => {
    const mockFeedings: Feeding[] = [
      {
        id: 1,
        child: 1,
        feeding_type: 'bottle',
        fed_at: '2024-01-15T10:00:00Z',
        amount_oz: 5.5,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 2,
        child: 1,
        feeding_type: 'breast',
        fed_at: '2024-01-20T14:30:00Z',
        duration_minutes: 15,
        side: 'left',
        created_at: '2024-01-20T14:30:00Z',
        updated_at: '2024-01-20T14:30:00Z',
      },
      {
        id: 3,
        child: 1,
        feeding_type: 'bottle',
        fed_at: '2024-02-05T09:00:00Z',
        amount_oz: 6,
        created_at: '2024-02-05T09:00:00Z',
        updated_at: '2024-02-05T09:00:00Z',
      },
    ];

    describe('with date range filtering', () => {
      it('should filter by dateFrom', () => {
        const criteria: FilterCriteria = { dateFrom: '2024-01-20' };
        const result = service.filter(mockFeedings, criteria, 'fed_at');

        expect(result.length).toBe(2);
        expect(result[0].id).toBe(2);
        expect(result[1].id).toBe(3);
      });

      it('should filter by dateTo', () => {
        const criteria: FilterCriteria = { dateTo: '2024-01-25' };
        const result = service.filter(mockFeedings, criteria, 'fed_at');

        expect(result.length).toBe(2);
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(2);
      });

      it('should filter by dateFrom and dateTo', () => {
        const criteria: FilterCriteria = {
          dateFrom: '2024-01-15',
          dateTo: '2024-01-31',
        };
        const result = service.filter(mockFeedings, criteria, 'fed_at');

        expect(result.length).toBe(2);
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(2);
      });

      it('should return all items when no date filters', () => {
        const criteria: FilterCriteria = {};
        const result = service.filter(mockFeedings, criteria, 'fed_at');

        expect(result.length).toBe(3);
      });

      it('should return empty array when date range excludes all items', () => {
        const criteria: FilterCriteria = {
          dateFrom: '2024-03-01',
          dateTo: '2024-03-31',
        };
        const result = service.filter(mockFeedings, criteria, 'fed_at');

        expect(result.length).toBe(0);
      });

      it('should use user timezone for date boundary comparison', () => {
        profileSignal.set({
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          timezone: 'America/New_York',
        });

        // 2024-01-16T04:30:00Z = 2024-01-15T23:30:00 EST (previous day in NY)
        const items: Feeding[] = [
          {
            id: 10,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-16T04:30:00Z',
            amount_oz: 5,
            created_at: '2024-01-16T04:30:00Z',
            updated_at: '2024-01-16T04:30:00Z',
          },
        ];

        // In NY timezone, this is Jan 15 — should be included when filtering for Jan 15
        const criteria: FilterCriteria = {
          dateFrom: '2024-01-15',
          dateTo: '2024-01-15',
        };
        const result = service.filter(items, criteria, 'fed_at');

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(10);
      });
    });

    describe('with type filtering', () => {
      it('should filter by feeding type', () => {
        const criteria: FilterCriteria = { type: 'bottle' };
        const result = service.filter(
          mockFeedings,
          criteria,
          'fed_at',
          'feeding_type'
        );

        expect(result.length).toBe(2);
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(3);
      });

      it('should filter by different feeding type', () => {
        const criteria: FilterCriteria = { type: 'breast' };
        const result = service.filter(
          mockFeedings,
          criteria,
          'fed_at',
          'feeding_type'
        );

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(2);
      });

      it('should not filter by type when typeField is not provided', () => {
        const criteria: FilterCriteria = { type: 'bottle' };
        const result = service.filter(mockFeedings, criteria, 'fed_at');

        expect(result.length).toBe(3);
      });
    });

    describe('with combined filtering', () => {
      it('should filter by date range and type', () => {
        const criteria: FilterCriteria = {
          dateFrom: '2024-01-15',
          dateTo: '2024-02-01',
          type: 'bottle',
        };
        const result = service.filter(
          mockFeedings,
          criteria,
          'fed_at',
          'feeding_type'
        );

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(1);
      });

      it('should return empty when combined filters exclude all items', () => {
        const criteria: FilterCriteria = {
          dateFrom: '2024-01-15',
          dateTo: '2024-01-19',
          type: 'breast',
        };
        const result = service.filter(
          mockFeedings,
          criteria,
          'fed_at',
          'feeding_type'
        );

        expect(result.length).toBe(0);
      });
    });

    describe('with different timestamp fields', () => {
      const mockDiapers: DiaperChange[] = [
        {
          id: 1,
          child: 1,
          change_type: 'wet',
          changed_at: '2024-01-15T10:00:00Z',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          child: 1,
          change_type: 'dirty',
          changed_at: '2024-01-20T14:30:00Z',
          created_at: '2024-01-20T14:30:00Z',
          updated_at: '2024-01-20T14:30:00Z',
        },
      ];

      it('should filter diapers by changed_at', () => {
        const criteria: FilterCriteria = { dateFrom: '2024-01-20' };
        const result = service.filter(mockDiapers, criteria, 'changed_at');

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(2);
      });

      it('should filter diapers by change_type', () => {
        const criteria: FilterCriteria = { type: 'wet' };
        const result = service.filter(
          mockDiapers,
          criteria,
          'changed_at',
          'change_type'
        );

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(1);
      });
    });

    describe('with empty arrays', () => {
      it('should handle empty items array', () => {
        const criteria: FilterCriteria = { dateFrom: '2024-01-15' };
        const result = service.filter([], criteria, 'fed_at');

        expect(result.length).toBe(0);
      });
    });
  });

  describe('timezone boundary filtering', () => {
    const setTimezone = (tz: string) => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: tz,
      });
    };

    describe('late-night activity in negative offset timezone (America/New_York)', () => {
      beforeEach(() => setTimezone('America/New_York'));

      it('should include 11 PM EST feeding when filtering for that EST date', () => {
        // 11 PM EST Jan 15 = 4 AM UTC Jan 16
        const items: Feeding[] = [
          {
            id: 1,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-16T04:00:00Z', // 11 PM EST Jan 15
            amount_oz: 5,
            created_at: '2024-01-16T04:00:00Z',
            updated_at: '2024-01-16T04:00:00Z',
          },
        ];

        const criteria: FilterCriteria = {
          dateFrom: '2024-01-15',
          dateTo: '2024-01-15',
        };
        const result = service.filter(items, criteria, 'fed_at');

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(1);
      });

      it('should exclude 11 PM EST feeding when filtering for the UTC date', () => {
        // 11 PM EST Jan 15 = 4 AM UTC Jan 16
        const items: Feeding[] = [
          {
            id: 1,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-16T04:00:00Z', // 11 PM EST Jan 15
            amount_oz: 5,
            created_at: '2024-01-16T04:00:00Z',
            updated_at: '2024-01-16T04:00:00Z',
          },
        ];

        // Filtering for Jan 16 (UTC date) should NOT include this in EST
        const criteria: FilterCriteria = {
          dateFrom: '2024-01-16',
          dateTo: '2024-01-16',
        };
        const result = service.filter(items, criteria, 'fed_at');

        expect(result.length).toBe(0);
      });
    });

    describe('early-morning activity in positive offset timezone (Asia/Tokyo)', () => {
      beforeEach(() => setTimezone('Asia/Tokyo'));

      it('should include 1 AM Tokyo feeding when filtering for the Tokyo date', () => {
        // 1 AM Tokyo Jan 16 = 4 PM UTC Jan 15
        const items: Feeding[] = [
          {
            id: 1,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-15T16:00:00Z', // 1 AM Tokyo Jan 16
            amount_oz: 5,
            created_at: '2024-01-15T16:00:00Z',
            updated_at: '2024-01-15T16:00:00Z',
          },
        ];

        const criteria: FilterCriteria = {
          dateFrom: '2024-01-16',
          dateTo: '2024-01-16',
        };
        const result = service.filter(items, criteria, 'fed_at');

        expect(result.length).toBe(1);
        expect(result[0].id).toBe(1);
      });

      it('should exclude 1 AM Tokyo feeding when filtering for the UTC date', () => {
        // 1 AM Tokyo Jan 16 = 4 PM UTC Jan 15
        const items: Feeding[] = [
          {
            id: 1,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-15T16:00:00Z', // 1 AM Tokyo Jan 16
            amount_oz: 5,
            created_at: '2024-01-15T16:00:00Z',
            updated_at: '2024-01-15T16:00:00Z',
          },
        ];

        // Filtering for Jan 15 (UTC date) should NOT include this in Tokyo
        const criteria: FilterCriteria = {
          dateFrom: '2024-01-15',
          dateTo: '2024-01-15',
        };
        const result = service.filter(items, criteria, 'fed_at');

        expect(result.length).toBe(0);
      });
    });

    describe('activities spanning midnight in user timezone', () => {
      beforeEach(() => setTimezone('America/New_York'));

      it('should split activities across midnight boundary into correct days', () => {
        const items: Feeding[] = [
          {
            id: 1,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-16T04:50:00Z', // 11:50 PM EST Jan 15
            amount_oz: 5,
            created_at: '2024-01-16T04:50:00Z',
            updated_at: '2024-01-16T04:50:00Z',
          },
          {
            id: 2,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-16T05:10:00Z', // 12:10 AM EST Jan 16
            amount_oz: 4,
            created_at: '2024-01-16T05:10:00Z',
            updated_at: '2024-01-16T05:10:00Z',
          },
        ];

        // Filter for Jan 15 (EST) — should only include the 11:50 PM feeding
        const jan15Criteria: FilterCriteria = {
          dateFrom: '2024-01-15',
          dateTo: '2024-01-15',
        };
        const jan15Result = service.filter(items, jan15Criteria, 'fed_at');
        expect(jan15Result.length).toBe(1);
        expect(jan15Result[0].id).toBe(1);

        // Filter for Jan 16 (EST) — should only include the 12:10 AM feeding
        const jan16Criteria: FilterCriteria = {
          dateFrom: '2024-01-16',
          dateTo: '2024-01-16',
        };
        const jan16Result = service.filter(items, jan16Criteria, 'fed_at');
        expect(jan16Result.length).toBe(1);
        expect(jan16Result[0].id).toBe(2);
      });
    });

    describe('single-day filter with dateFrom = dateTo', () => {
      beforeEach(() => setTimezone('Asia/Tokyo'));

      it('should include only activities on that local day', () => {
        const items: Feeding[] = [
          {
            id: 1,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-15T14:59:00Z', // 11:59 PM Tokyo Jan 15
            amount_oz: 5,
            created_at: '2024-01-15T14:59:00Z',
            updated_at: '2024-01-15T14:59:00Z',
          },
          {
            id: 2,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-15T15:00:00Z', // 12:00 AM Tokyo Jan 16
            amount_oz: 4,
            created_at: '2024-01-15T15:00:00Z',
            updated_at: '2024-01-15T15:00:00Z',
          },
          {
            id: 3,
            child: 1,
            feeding_type: 'bottle',
            fed_at: '2024-01-14T15:00:00Z', // 12:00 AM Tokyo Jan 15
            amount_oz: 3,
            created_at: '2024-01-14T15:00:00Z',
            updated_at: '2024-01-14T15:00:00Z',
          },
        ];

        // Filter for exactly Jan 15 in Tokyo
        const criteria: FilterCriteria = {
          dateFrom: '2024-01-15',
          dateTo: '2024-01-15',
        };
        const result = service.filter(items, criteria, 'fed_at');

        // Should include items 1 (11:59 PM Tokyo Jan 15) and 3 (12:00 AM Tokyo Jan 15)
        expect(result.length).toBe(2);
        expect(result.map((r) => r.id).sort()).toEqual([1, 3]);
      });
    });
  });

  describe('date utility methods', () => {
    describe('getTodayAsIsoString()', () => {
      it('should return today date in ISO format', () => {
        const today = service.getTodayAsIsoString();
        const regex = /^\d{4}-\d{2}-\d{2}$/;

        expect(today).toMatch(regex);
      });
    });

    describe('getDateNDaysAgoAsIsoString()', () => {
      it('should return date 7 days ago', () => {
        const sevenDaysAgo = service.getDateNDaysAgoAsIsoString(7);
        expect(sevenDaysAgo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it('should return date 1 day ago', () => {
        const yesterday = service.getDateNDaysAgoAsIsoString(1);
        expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it('should handle 0 days ago', () => {
        const today = service.getDateNDaysAgoAsIsoString(0);
        const expectedToday = service.getTodayAsIsoString();

        expect(today).toBe(expectedToday);
      });
    });

    describe('formatDateForDisplay()', () => {
      it('should format ISO date string for display', () => {
        const formatted = service.formatDateForDisplay('2024-01-15');
        const regex = /^[A-Z][a-z]{2},\s[A-Z][a-z]{2}\s\d{1,2}$/;

        expect(formatted).toMatch(regex);
      });

      it('should handle different dates correctly', () => {
        const formatted = service.formatDateForDisplay('2024-12-25');

        expect(formatted).toContain('Dec');
        expect(formatted).toContain('25');
      });
    });
  });
});
