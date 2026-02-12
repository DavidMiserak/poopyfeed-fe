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
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';
import { FeedingTrendsChart } from './feeding-trends-chart';
import { DiaperPatternsChart } from './diaper-patterns-chart';
import { SleepSummaryChart } from './sleep-summary-chart';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FeedingTrendsChart,
    DiaperPatternsChart,
    SleepSummaryChart,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-['Fredoka',sans-serif] text-4xl font-bold text-gray-900 mb-2">
          Analytics Dashboard
        </h1>
        <p class="text-lg text-gray-600">
          View trends and insights for your baby's activities
        </p>
      </div>

      @if (isLoading()) {
        <!-- Loading State -->
        <div class="flex flex-col items-center justify-center py-20">
          <svg
            class="w-16 h-16 animate-spin text-orange-500 mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="text-gray-600 font-['Fredoka',sans-serif]">Loading analytics...</p>
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <h3 class="font-['Fredoka',sans-serif] font-semibold text-red-800 mb-2">
            Unable to Load Analytics
          </h3>
          <p class="text-red-700">{{ error() }}</p>
        </div>
      } @else {
        <!-- Content -->

        <!-- Quick Stats Cards -->
        @if (todaySummary(); as today) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Feedings Card -->
            <div
              class="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-6 border-2 border-amber-200 shadow-md"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-amber-700 mb-1">Feedings Today</p>
                  <p class="font-['Fredoka',sans-serif] text-4xl font-bold text-amber-800">
                    {{ today.feedings.count }}
                  </p>
                  <p class="text-xs text-amber-600 mt-1">
                    {{ today.feedings.total_oz }} oz total
                  </p>
                </div>
                <div class="text-4xl">🍼</div>
              </div>
            </div>

            <!-- Diapers Card -->
            <div
              class="bg-gradient-to-br from-rose-50 to-rose-100 rounded-3xl p-6 border-2 border-rose-200 shadow-md"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-rose-700 mb-1">Diapers Today</p>
                  <p class="font-['Fredoka',sans-serif] text-4xl font-bold text-rose-800">
                    {{ today.diapers.count }}
                  </p>
                  <p class="text-xs text-rose-600 mt-1">
                    {{ today.diapers.wet }} wet, {{ today.diapers.dirty }} dirty
                  </p>
                </div>
                <div class="text-4xl">💩</div>
              </div>
            </div>

            <!-- Sleep Card -->
            <div
              class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border-2 border-blue-200 shadow-md"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-blue-700 mb-1">Naps Today</p>
                  <p class="font-['Fredoka',sans-serif] text-4xl font-bold text-blue-800">
                    {{ today.sleep.naps }}
                  </p>
                  <p class="text-xs text-blue-600 mt-1">
                    {{ formatMinutes(today.sleep.total_minutes) }} total
                  </p>
                </div>
                <div class="text-4xl">😴</div>
              </div>
            </div>
          </div>
        }

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <app-feeding-trends-chart
            [data]="feedingTrends()"
            [isLoading]="isLoading()"
          />
          <app-diaper-patterns-chart
            [data]="diaperPatterns()"
            [isLoading]="isLoading()"
          />
        </div>

        <!-- Full-width sleep chart -->
        <app-sleep-summary-chart [data]="sleepSummary()" [isLoading]="isLoading()" />
      }
    </div>
  `,
})
export class AnalyticsDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private analyticsService = inject(AnalyticsService);
  private toast = inject(ToastService);

  childId = signal<number | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Computed signals from service (reactive references)
  feedingTrends = computed(() => this.analyticsService.feedingTrends());
  diaperPatterns = computed(() => this.analyticsService.diaperPatterns());
  sleepSummary = computed(() => this.analyticsService.sleepSummary());
  todaySummary = computed(() => this.analyticsService.todaySummary());

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
   * Format minutes into human-readable duration string.
   *
   * @param minutes Total minutes
   * @returns Formatted string (e.g., "2h 30m")
   */
  formatMinutes(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
  }
}
