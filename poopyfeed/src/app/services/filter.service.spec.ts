import { TestBed } from '@angular/core/testing';
import { FilterService, FilterCriteria } from './filter.service';
import { Feeding } from '../models/feeding.model';
import { DiaperChange } from '../models/diaper.model';
import { Nap } from '../models/nap.model';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
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

;
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
        const today = new Date();
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - 7);
        const expected = expectedDate.toISOString().split('T')[0];

        expect(sevenDaysAgo).toBe(expected);
      });

      it('should return date 1 day ago', () => {
        const yesterday = service.getDateNDaysAgoAsIsoString(1);
        const today = new Date();
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - 1);
        const expected = expectedDate.toISOString().split('T')[0];

        expect(yesterday).toBe(expected);
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
