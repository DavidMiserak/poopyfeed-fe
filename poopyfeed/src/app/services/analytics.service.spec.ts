/**
 * Analytics service unit tests.
 *
 * Tests all HTTP methods and error handling patterns.
 * Uses HttpTestingController for request mocking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  ExportJobResponse,
  JobStatusResponse,
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
    feedings: {
      count: 35,
      total_oz: 280,
      bottle: 35,
      breast: 0,
      avg_duration: 12.5,
    },
    diapers: {
      count: 42,
      wet: 28,
      dirty: 7,
      both: 7,
    },
    sleep: {
      naps: 14,
      total_minutes: 1260,
      avg_duration: 90,
    },
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

  describe('exportCSV', () => {
    it('should export CSV and trigger download', () => {
      const mockCSVBlob = new Blob(['Date,Count\n2024-01-01,5'], {
        type: 'text/csv',
      });

      service.exportCSV(1, 30).subscribe({
        next: (blob) => {
          expect(blob).toEqual(mockCSVBlob);
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-csv/?days=30'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.responseType).toBe('blob');
      req.flush(mockCSVBlob);
    });

    it('should use default 30 days if not specified', () => {
      const mockCSVBlob = new Blob(['test'], { type: 'text/csv' });

      service.exportCSV(1).subscribe();

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-csv/?days=30'
      );
      expect(req.request.body).toEqual({});
      req.flush(mockCSVBlob);
    });

    it('should support custom days parameter', () => {
      const mockCSVBlob = new Blob(['test'], { type: 'text/csv' });

      service.exportCSV(1, 60).subscribe();

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-csv/?days=60'
      );
      expect(req.request.body).toEqual({});
      req.flush(mockCSVBlob);
    });

    it('should handle 404 error for non-existent child', () => {
      let errorCaught = false;

      service.exportCSV(999, 30).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/999/export-csv/?days=30'
      );
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 403 unauthorized error', () => {
      let errorCaught = false;

      service.exportCSV(1, 30).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-csv/?days=30'
      );
      req.flush(null, { status: 403, statusText: 'Forbidden' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('exportPDFAsync', () => {
    const mockExportJobResponse: ExportJobResponse = {
      task_id: 'abc123def456',
      status: 'pending',
      created_at: '2026-02-12T10:00:00Z',
      expires_at: '2026-02-13T10:00:00Z',
    };

    it('should initiate async PDF export and return task ID', () => {
      service.exportPDFAsync(1, 30).subscribe({
        next: (response) => {
          expect(response.task_id).toBe('abc123def456');
          expect(response.status).toBe('pending');
          expect(response.created_at).toBeDefined();
          expect(response.expires_at).toBeDefined();
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-pdf/'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ days: 30 });
      req.flush(mockExportJobResponse);
    });

    it('should use default 30 days if not specified', () => {
      service.exportPDFAsync(1).subscribe();

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-pdf/'
      );
      expect(req.request.body).toEqual({ days: 30 });
      req.flush(mockExportJobResponse);
    });

    it('should support custom days parameter', () => {
      service.exportPDFAsync(1, 60).subscribe();

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-pdf/'
      );
      expect(req.request.body).toEqual({ days: 60 });
      req.flush(mockExportJobResponse);
    });

    it('should handle export job queue failure', () => {
      let errorCaught = false;

      service.exportPDFAsync(1, 30).subscribe({
        error: (error: Error) => {
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-pdf/'
      );
      req.flush(
        { detail: 'Export service unavailable' },
        { status: 503, statusText: 'Service Unavailable' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('getPDFJobStatus', () => {
    it('should poll pending job status', () => {
      const mockPendingStatus: JobStatusResponse = {
        task_id: 'abc123def456',
        status: 'pending',
        progress: 0,
      };

      service.getPDFJobStatus(1, 'abc123def456').subscribe({
        next: (response) => {
          expect(response.status).toBe('pending');
          expect(response.progress).toBe(0);
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-status/abc123def456/'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPendingStatus);
    });

    it('should poll processing job status with progress', () => {
      const mockProcessingStatus: JobStatusResponse = {
        task_id: 'abc123def456',
        status: 'processing',
        progress: 45,
      };

      service.getPDFJobStatus(1, 'abc123def456').subscribe({
        next: (response) => {
          expect(response.status).toBe('processing');
          expect(response.progress).toBe(45);
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-status/abc123def456/'
      );
      req.flush(mockProcessingStatus);
    });

    it('should return completed job with download URL', () => {
      const mockCompletedStatus: JobStatusResponse = {
        task_id: 'abc123def456',
        status: 'completed',
        progress: 100,
        result: {
          download_url: '/api/v1/analytics/download/abc123def456.pdf',
          filename: 'analytics-1-2026-02-12.pdf',
          created_at: '2026-02-12T10:05:00Z',
          expires_at: '2026-02-13T10:05:00Z',
        },
      };

      service.getPDFJobStatus(1, 'abc123def456').subscribe({
        next: (response) => {
          expect(response.status).toBe('completed');
          expect(response.progress).toBe(100);
          expect(response.result?.download_url).toBeDefined();
          expect(response.result?.filename).toBeDefined();
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-status/abc123def456/'
      );
      req.flush(mockCompletedStatus);
    });

    it('should return failed job with error message', () => {
      const mockFailedStatus: JobStatusResponse = {
        task_id: 'abc123def456',
        status: 'failed',
        error: 'PDF generation failed due to invalid data',
      };

      service.getPDFJobStatus(1, 'abc123def456').subscribe({
        next: (response) => {
          expect(response.status).toBe('failed');
          expect(response.error).toBe(
            'PDF generation failed due to invalid data'
          );
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-status/abc123def456/'
      );
      req.flush(mockFailedStatus);
    });

    it('should handle job polling timeout (404 expired task)', () => {
      let errorCaught = false;

      service.getPDFJobStatus(1, 'expired-task-id').subscribe({
        error: (error: Error) => {
          expect(error.message).toBeTruthy();
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne(
        '/api/v1/analytics/children/1/export-status/expired-task-id/'
      );
      req.flush(
        { detail: 'Task not found (expired)' },
        { status: 404, statusText: 'Not Found' }
      );

      expect(errorCaught).toBe(true);
    });
  });

  describe('downloadPDF', () => {
    it('should trigger browser download with correct filename', () => {
      const mockPDFBlob = new Blob(['pdf data'], { type: 'application/pdf' });
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      service.downloadPDF('/api/v1/analytics/download/analytics-1-2026-02-12.pdf').subscribe();

      const req = httpMock.expectOne('/api/v1/analytics/download/analytics-1-2026-02-12.pdf');
      req.flush(mockPDFBlob);

      // Verify anchor element was created
      expect(createElementSpy).toHaveBeenCalledWith('a');

      // Verify child was appended and removed
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should fallback to default filename if URL has no path component', () => {
      const mockPDFBlob = new Blob(['pdf data'], { type: 'application/pdf' });
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      service.downloadPDF('http://example.com').subscribe();

      const req = httpMock.expectOne('http://example.com');
      req.flush(mockPDFBlob);

      expect(createElementSpy).toHaveBeenCalledWith('a');

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
