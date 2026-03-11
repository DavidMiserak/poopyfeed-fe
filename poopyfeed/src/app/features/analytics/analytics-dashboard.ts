/**
 * Analytics dashboard container component.
 *
 * Displays trend visualizations and summary statistics for a child's activities.
 * Loads data from the analytics API in parallel using forkJoin for performance.
 *
 * Features:
 * - Parallel loading of 5 analytics endpoints
 * - Quick stat cards showing today's counts
 * - 3 interactive charts (feeding, diaper, sleep trends)
 * - Loading state and error handling
 * - Responsive design (mobile/tablet/desktop)
 *
 * Route parameters:
 * - childId: Child's unique identifier (required)
 */

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AnalyticsService } from '../../services/analytics.service';
import type { DailyData } from '../../models/analytics.model';
import { ToastService } from '../../services/toast.service';
import { FeedingTrendsChart } from './feeding-trends-chart';
import { FeedingOzChart } from './feeding-oz-chart';
import { CHART_FACTORY } from './chart.token';
import { DiaperPatternsChart } from './diaper-patterns-chart';
import { SleepSummaryChart } from './sleep-summary-chart';
import { TodaySummaryCards } from '../../components/today-summary-cards';
import { ChartFactoryService } from './chart-factory.service';
import { GaTrackingService } from '../../services/ga-tracking.service';

@Component({
  selector: 'app-analytics-dashboard',
  imports: [
    RouterLink,
    FeedingTrendsChart,
    FeedingOzChart,
    DiaperPatternsChart,
    SleepSummaryChart,
    TodaySummaryCards,
  ],
  providers: [
    {
      provide: CHART_FACTORY,
      useFactory: () => {
        const service = inject(ChartFactoryService);
        return service.getCachedChart();
      },
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics-dashboard.html',
})
export class AnalyticsDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private toast = inject(ToastService);
  private chartFactory = inject(ChartFactoryService);
  private gaTracking = inject(GaTrackingService);

  childId = signal<number | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isNavigatingToExport = signal(false);

  // Computed signals from service (reactive references)
  feedingTrends = computed(() => this.analyticsService.feedingTrends());
  diaperPatterns = computed(() => this.analyticsService.diaperPatterns());
  sleepSummary = computed(() => this.analyticsService.sleepSummary());
  todaySummary = computed(() => this.analyticsService.todaySummary());

  /** True if at least one of feeding, diaper, or sleep trend datasets has any daily count > 0. */
  hasAnyData = computed(() => {
    return (
      this.hasDailyCounts(this.feedingTrends()) ||
      this.hasDailyCounts(this.diaperPatterns()) ||
      this.hasDailyCounts(this.sleepSummary())
    );
  });

  private hasDailyCounts(
    data: { daily_data?: DailyData[] } | null | undefined,
  ): boolean {
    return data?.daily_data?.some((d) => d.count > 0) ?? false;
  }

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('childId');

    if (!idParam) {
      this.error.set('Child ID is required');
      this.isLoading.set(false);
      return;
    }

    const id = Number(idParam);
    if (isNaN(id)) {
      this.error.set('Invalid child ID');
      this.isLoading.set(false);
      return;
    }

    this.childId.set(id);
    this.gaTracking.trackEvent('view_analytics_dashboard');

    // Lazy-load Chart.js before rendering charts
    try {
      await this.chartFactory.getChart();
    } catch {
      this.error.set('Failed to load chart library');
      this.isLoading.set(false);
      return;
    }

    this.loadAnalytics(id);
  }

  /**
   * Load all analytics data in parallel.
   *
   * Uses forkJoin to request all 5 endpoints simultaneously for performance.
   * Data is stored in service signals for reactive component updates.
   */
  private loadAnalytics(childId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load all analytics in parallel (30-day trends + today/weekly summaries)
    forkJoin({
      feeding: this.analyticsService.getFeedingTrends(childId, 30),
      diapers: this.analyticsService.getDiaperPatterns(childId, 30),
      sleep: this.analyticsService.getSleepSummary(childId, 30),
      today: this.analyticsService.getTodaySummary(childId),
      weekly: this.analyticsService.getWeeklySummary(childId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          // Data automatically stored in service signals
        },
        error: (err: Error) => {
          this.error.set(err.message);
          this.toast.error(err.message);
        },
      });
  }

  /**
   * Navigate to the export page.
   */
  onExportClick(): void {
    const childIdValue = this.childId();
    if (childIdValue) {
      this.isNavigatingToExport.set(true);
      this.router.navigate([`/children/${childIdValue}/analytics/export`]);
    }
  }
}
