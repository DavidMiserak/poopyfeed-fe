/**
 * Analytics service unit tests.
 *
 * Tests all HTTP methods and error handling patterns.
 * Uses HttpTestingController for request mocking.
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AnalyticsService } from './analytics.service';
import {
  FeedingTrends,
  DiaperPatterns,
  SleepSummary,
  TodaySummaryData,
  WeeklySummaryData,
} from '../models/analytics.model';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;

  const mockFeedingTrends: FeedingTrends = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [
      { date: '2024-01-01', count: 5, average_duration: 12.5, total_oz: 20 },
      { date: '2024-01-02', count: 6, average_duration: 13.0, total_oz: 24 },
    ],
    weekly_summary: {
      avg_per_day: 5.4,
      trend: 'stable',
      variance: 0.5,
    },
    last_updated: '2024-01-30T12:00:00Z',
  };

  const mockDiaperPatterns: DiaperPatterns = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [
      { date: '2024-01-01', count: 8, average_duration: null, total_oz: null },
      { date: '2024-01-02', count: 7, average_duration: null, total_oz: null },
    ],
    weekly_summary: {
      avg_per_day: 7.5,
      trend: 'decreasing',
      variance: 0.8,
    },
    breakdown: {
      wet: 80,
      dirty: 40,
      both: 25,
    },
    last_updated: '2024-01-30T12:00:00Z',
  };

  const mockSleepSummary: SleepSummary = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [
      { date: '2024-01-01', count: 3, average_duration: 45.0, total_oz: null },
      { date: '2024-01-02', count: 2, average_duration: 50.0, total_oz: null },
    ],
    weekly_summary: {
      avg_per_day: 2.8,
      trend: 'increasing',
      variance: 0.6,
    },
    last_updated: '2024-01-30T12:00:00Z',
  };

  const mockTodaySummary: TodaySummaryData = {
    child_id: 1,
    period: 'Today',
    feedings: {
      count: 4,
      total_oz: 16,
      bottle: 3,
      breast: 1,
    },
    diapers: {
      count: 6,
      wet: 4,
      dirty: 1,
      both: 1,
    },
    sleep: {
      naps: 2,
      total_minutes: 120,
      avg_duration: 60,
    },
    last_updated: '2024-01-30T12:00:00Z',
  };

  const mockWeeklySummary: WeeklySummaryData = {
    child_id: 1,
    period: 'Last 7 days',
    feedings: {},
    diapers: {},
    sleep: {},
    last_updated: '2024-01-30T12:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getFeedingTrends', () => {
    it('should fetch feeding trends and update signal', () => {
      service.getFeedingTrends(1, 30).subscribe({
        next: (trends) => {
          expect(trends).toEqual(mockFeedingTrends);
          expect(service.feedingTrends()).toEqual(mockFeedingTrends);
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/feeding-trends/?days=30'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockFeedingTrends);
    });

    it('should use default 30 days if not specified', () => {
      service.getFeedingTrends(1).subscribe();

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/feeding-trends/?days=30'
      );
      req.flush(mockFeedingTrends);
    });

    it('should handle 404 error for non-existent child', () => {
      let errorCaught = false;

      service.getFeedingTrends(999, 30).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/999/feeding-trends/?days=30'
      );
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 unauthorized error', () => {
      let errorCaught = false;

      service.getFeedingTrends(1, 30).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/feeding-trends/?days=30'
      );
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('getDiaperPatterns', () => {
    it('should fetch diaper patterns and update signal', () => {
      service.getDiaperPatterns(1, 30).subscribe({
        next: (patterns) => {
          expect(patterns).toEqual(mockDiaperPatterns);
          expect(service.diaperPatterns()).toEqual(mockDiaperPatterns);
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/diaper-patterns/?days=30'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockDiaperPatterns);
    });

    it('should handle errors gracefully', () => {
      let errorCaught = false;

      service.getDiaperPatterns(1, 30).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/diaper-patterns/?days=30'
      );
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('getSleepSummary', () => {
    it('should fetch sleep summary and update signal', () => {
      service.getSleepSummary(1, 30).subscribe({
        next: (summary) => {
          expect(summary).toEqual(mockSleepSummary);
          expect(service.sleepSummary()).toEqual(mockSleepSummary);
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/sleep-summary/?days=30'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockSleepSummary);
    });

    it('should support custom day parameters', () => {
      service.getSleepSummary(1, 60).subscribe();

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/sleep-summary/?days=60'
      );
      req.flush(mockSleepSummary);
    });
  });

  describe('getTodaySummary', () => {
    it('should fetch today summary and update signal', () => {
      service.getTodaySummary(1).subscribe({
        next: (summary) => {
          expect(summary).toEqual(mockTodaySummary);
          expect(service.todaySummary()).toEqual(mockTodaySummary);
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/today-summary/'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTodaySummary);
    });

    it('should not include query parameters', () => {
      service.getTodaySummary(1).subscribe();

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/today-summary/'
      );
      expect(req.request.url).not.toContain('?');
      req.flush(mockTodaySummary);
    });
  });

  describe('getWeeklySummary', () => {
    it('should fetch weekly summary and update signal', () => {
      service.getWeeklySummary(1).subscribe({
        next: (summary) => {
          expect(summary).toEqual(mockWeeklySummary);
          expect(service.weeklySummary()).toEqual(mockWeeklySummary);
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/weekly-summary/'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockWeeklySummary);
    });
  });

  describe('Signal updates', () => {
    it('should update all signals from parallel requests', () => {
      expect(service.feedingTrends()).toBeNull();
      expect(service.diaperPatterns()).toBeNull();
      expect(service.sleepSummary()).toBeNull();

      service.getFeedingTrends(1, 30).subscribe();
      service.getDiaperPatterns(1, 30).subscribe();
      service.getSleepSummary(1, 30).subscribe();

      const feedingReq = httpMock.expectOne(
        '/api/v1/analytics/children/1/feeding-trends/?days=30'
      );
      const diaperReq = httpMock.expectOne(
        '/api/v1/analytics/children/1/diaper-patterns/?days=30'
      );
      const sleepReq = httpMock.expectOne(
        '/api/v1/analytics/children/1/sleep-summary/?days=30'
      );

      feedingReq.flush(mockFeedingTrends);
      diaperReq.flush(mockDiaperPatterns);
      sleepReq.flush(mockSleepSummary);

      expect(service.feedingTrends()).toEqual(mockFeedingTrends);
      expect(service.diaperPatterns()).toEqual(mockDiaperPatterns);
      expect(service.sleepSummary()).toEqual(mockSleepSummary);
    });
  });
});
