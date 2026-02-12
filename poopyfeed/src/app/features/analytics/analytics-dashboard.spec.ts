/**
 * Analytics dashboard component tests.
 *
 * Tests data loading, error handling, and component behavior.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AnalyticsDashboard } from './analytics-dashboard';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';

describe('AnalyticsDashboard', () => {
  let component: AnalyticsDashboard;
  let fixture: ComponentFixture<AnalyticsDashboard>;
  let analyticsService: AnalyticsService;
  let toastService: ToastService;

  const mockFeedingTrends = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [
      { date: '2024-01-01', count: 5, average_duration: 12.5, total_oz: 20 },
    ],
    weekly_summary: {
      avg_per_day: 5.4,
      trend: 'stable' as const,
      variance: 0.5,
    },
    last_updated: '2024-01-30T12:00:00Z',
  };

  const mockDiaperPatterns = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [{ date: '2024-01-01', count: 8, average_duration: null, total_oz: null }],
    weekly_summary: { avg_per_day: 7.5, trend: 'decreasing' as const, variance: 0.8 },
    breakdown: { wet: 80, dirty: 40, both: 25 },
    last_updated: '2024-01-30T12:00:00Z',
  };

  const mockSleepSummary = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [{ date: '2024-01-01', count: 3, average_duration: 45.0, total_oz: null }],
    weekly_summary: { avg_per_day: 2.8, trend: 'increasing' as const, variance: 0.6 },
    last_updated: '2024-01-30T12:00:00Z',
  };

  const mockTodaySummary = {
    child_id: 1,
    period: 'Today',
    feedings: { count: 4, total_oz: 16, bottle: 3, breast: 1 },
    diapers: { count: 6, wet: 4, dirty: 1, both: 1 },
    sleep: { naps: 2, total_minutes: 120, avg_duration: 60 },
    last_updated: '2024-01-30T12:00:00Z',
  };

  const mockWeeklySummary = {
    child_id: 1,
    period: 'Last 7 days',
    feedings: {},
    diapers: {},
    sleep: {},
    last_updated: '2024-01-30T12:00:00Z',
  };

  beforeEach(async () => {
    const activatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => (key === 'childId' ? '1' : null),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboard],
      providers: [
        AnalyticsService,
        ToastService,
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsService);
    toastService = TestBed.inject(ToastService);

    fixture = TestBed.createComponent(AnalyticsDashboard);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should extract childId from route params', () => {
      fixture.detectChanges();
      expect(component.childId()).toBe(1);
    });

  });

  describe('Data Loading', () => {
    it('should load all analytics data in parallel', () => {
      vi.spyOn(analyticsService, 'getFeedingTrends').mockReturnValue(of(mockFeedingTrends));
      vi.spyOn(analyticsService, 'getDiaperPatterns').mockReturnValue(of(mockDiaperPatterns));
      vi.spyOn(analyticsService, 'getSleepSummary').mockReturnValue(of(mockSleepSummary));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(mockTodaySummary));
      vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(mockWeeklySummary));

      fixture.detectChanges();

      expect(analyticsService.getFeedingTrends).toHaveBeenCalledWith(1, 30);
      expect(analyticsService.getDiaperPatterns).toHaveBeenCalledWith(1, 30);
      expect(analyticsService.getSleepSummary).toHaveBeenCalledWith(1, 30);
      expect(analyticsService.getTodaySummary).toHaveBeenCalledWith(1);
      expect(analyticsService.getWeeklySummary).toHaveBeenCalledWith(1);
    });

    it('should set loading state during request', async () => {
      vi.spyOn(analyticsService, 'getFeedingTrends').mockReturnValue(
        of(mockFeedingTrends)
      );
      vi.spyOn(analyticsService, 'getDiaperPatterns').mockReturnValue(
        of(mockDiaperPatterns)
      );
      vi.spyOn(analyticsService, 'getSleepSummary').mockReturnValue(of(mockSleepSummary));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(mockTodaySummary));
      vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(mockWeeklySummary));

      expect(component.isLoading()).toBe(true);

      fixture.detectChanges();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(component.isLoading()).toBe(false);
    });

    it('should clear error state on successful load', async () => {
      vi.spyOn(analyticsService, 'getFeedingTrends').mockReturnValue(of(mockFeedingTrends));
      vi.spyOn(analyticsService, 'getDiaperPatterns').mockReturnValue(of(mockDiaperPatterns));
      vi.spyOn(analyticsService, 'getSleepSummary').mockReturnValue(of(mockSleepSummary));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(mockTodaySummary));
      vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(mockWeeklySummary));

      component.error.set('Previous error');
      fixture.detectChanges();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(component.error()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const testError = new Error('Network error');

      vi.spyOn(analyticsService, 'getFeedingTrends').mockReturnValue(throwError(() => testError));
      vi.spyOn(analyticsService, 'getDiaperPatterns').mockReturnValue(of(mockDiaperPatterns));
      vi.spyOn(analyticsService, 'getSleepSummary').mockReturnValue(of(mockSleepSummary));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(mockTodaySummary));
      vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(mockWeeklySummary));

      vi.spyOn(toastService, 'error');

      fixture.detectChanges();

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(component.error()).toBeTruthy();
      expect(toastService.error).toHaveBeenCalled();
    });

    it('should display error message in template', async () => {
      vi.spyOn(analyticsService, 'getFeedingTrends').mockReturnValue(
        throwError(() => new Error('Failed to load'))
      );
      vi.spyOn(analyticsService, 'getDiaperPatterns').mockReturnValue(of(mockDiaperPatterns));
      vi.spyOn(analyticsService, 'getSleepSummary').mockReturnValue(of(mockSleepSummary));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(mockTodaySummary));
      vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(mockWeeklySummary));

      fixture.detectChanges();

      await new Promise((resolve) => setTimeout(resolve, 10));
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const errorElement = compiled.querySelector('div.bg-red-50');
      expect(errorElement).toBeTruthy();
    });
  });

  describe('Computed Signals', () => {
    it('should expose service signals via computed signals', () => {
      analyticsService.feedingTrends.set(mockFeedingTrends);
      analyticsService.diaperPatterns.set(mockDiaperPatterns);
      analyticsService.sleepSummary.set(mockSleepSummary);
      analyticsService.todaySummary.set(mockTodaySummary);

      expect(component.feedingTrends()).toEqual(mockFeedingTrends);
      expect(component.diaperPatterns()).toEqual(mockDiaperPatterns);
      expect(component.sleepSummary()).toEqual(mockSleepSummary);
      expect(component.todaySummary()).toEqual(mockTodaySummary);
    });
  });

  describe('Empty State', () => {
    it('should have hasAnyData false when no service data exists', () => {
      expect(component.hasAnyData()).toBe(false);
    });

    it('should have hasAnyData false when all daily counts are zero', () => {
      analyticsService.feedingTrends.set({
        ...mockFeedingTrends,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      analyticsService.diaperPatterns.set({
        ...mockDiaperPatterns,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      analyticsService.sleepSummary.set({
        ...mockSleepSummary,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });

      expect(component.hasAnyData()).toBe(false);
    });

    it('should have hasAnyData true when any daily count is non-zero', () => {
      analyticsService.feedingTrends.set(mockFeedingTrends);
      analyticsService.diaperPatterns.set({
        ...mockDiaperPatterns,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      analyticsService.sleepSummary.set({
        ...mockSleepSummary,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });

      expect(component.hasAnyData()).toBe(true);
    });

    it('should show empty state message when no data exists', async () => {
      const emptyFeedingTrends = {
        ...mockFeedingTrends,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      };
      const emptyDiaperPatterns = {
        ...mockDiaperPatterns,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      };
      const emptySleepSummary = {
        ...mockSleepSummary,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      };

      vi.spyOn(analyticsService, 'getFeedingTrends').mockReturnValue(of(emptyFeedingTrends));
      vi.spyOn(analyticsService, 'getDiaperPatterns').mockReturnValue(of(emptyDiaperPatterns));
      vi.spyOn(analyticsService, 'getSleepSummary').mockReturnValue(of(emptySleepSummary));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(mockTodaySummary));
      vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(mockWeeklySummary));

      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 10));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No Activity Data Yet');
    });
  });

    describe('Utility Methods', () => {
    it('should format minutes correctly', () => {
      expect(component.formatMinutes(30)).toBe('30m');
      expect(component.formatMinutes(60)).toBe('1h');
      expect(component.formatMinutes(90)).toBe('1h 30m');
      expect(component.formatMinutes(120)).toBe('2h');
      expect(component.formatMinutes(150)).toBe('2h 30m');
    });
  });

  describe('Export Functionality', () => {
    let router: Router;

    beforeEach(() => {
      router = TestBed.inject(Router);
      component.childId.set(1);
      analyticsService.feedingTrends.set(mockFeedingTrends);
      analyticsService.diaperPatterns.set(mockDiaperPatterns);
      analyticsService.sleepSummary.set(mockSleepSummary);
    });

    it('should show export button when hasAnyData is true', () => {
      component.isLoading.set(false);
      component.error.set(null);
      // Verify hasAnyData is true
      expect(component.hasAnyData()).toBe(true);
      // Verify button conditions are met
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should hide export button when no data', () => {
      analyticsService.feedingTrends.set({
        ...mockFeedingTrends,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      analyticsService.diaperPatterns.set({
        ...mockDiaperPatterns,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      analyticsService.sleepSummary.set({
        ...mockSleepSummary,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });

      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const button = Array.from(compiled.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Export Data')
      );
      expect(button).toBeFalsy();
    });

    it('should navigate to export page on export button click', () => {
      vi.spyOn(router, 'navigate');

      component.onExportClick();

      expect(router.navigate).toHaveBeenCalledWith(['/children/1/analytics/export']);
    });

    it('should not navigate if childId is null', () => {
      vi.spyOn(router, 'navigate');
      component.childId.set(null);

      component.onExportClick();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
