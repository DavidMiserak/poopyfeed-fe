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
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';
import { FeedingTrendsChart } from './feeding-trends-chart';
import { DiaperPatternsChart } from './diaper-patterns-chart';
import { SleepSummaryChart } from './sleep-summary-chart';
import { TodaySummaryCards } from '../../components/today-summary-cards';

@Component({
  selector: 'app-analytics-dashboard',
  imports: [
    CommonModule,
    FeedingTrendsChart,
    DiaperPatternsChart,
    SleepSummaryChart,
    TodaySummaryCards,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics-dashboard.html',
})
export class AnalyticsDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private toast = inject(ToastService);

  childId = signal<number | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isNavigatingToExport = signal(false);

  // Computed signals from service (reactive references)
  feedingTrends = computed(() => this.analyticsService.feedingTrends());
  diaperPatterns = computed(() => this.analyticsService.diaperPatterns());
  sleepSummary = computed(() => this.analyticsService.sleepSummary());
  todaySummary = computed(() => this.analyticsService.todaySummary());

  hasAnyData = computed(() => {
    const feeding = this.feedingTrends();
    const diaper = this.diaperPatterns();
    const sleep = this.sleepSummary();
    const feedingHasData = feeding?.daily_data?.some((d) => d.count > 0) ?? false;
    const diaperHasData = diaper?.daily_data?.some((d) => d.count > 0) ?? false;
    const sleepHasData = sleep?.daily_data?.some((d) => d.count > 0) ?? false;
    return feedingHasData || diaperHasData || sleepHasData;
  });

  ngOnInit(): void {
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
