/**
 * Pediatrician summary component.
 *
 * Displays the last 7 days' aggregated feeding, diaper, and sleep data for a child
 * in a doctor-visit-friendly layout. Uses existing weekly-summary API.
 * Supports print via browser print dialog (print stylesheet for one-page output).
 *
 * Route: /children/:childId/pediatrician-summary
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ChildrenService } from '../../services/children.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Child } from '../../models/child.model';
import { WeeklySummaryData } from '../../models/analytics.model';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { formatMinutes } from '../../utils/date.utils';

@Component({
  selector: 'app-pediatrician-summary',
  imports: [CommonModule, RouterLink, ErrorCardComponent],
  templateUrl: './pediatrician-summary.html',
  styleUrl: './pediatrician-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PediatricianSummaryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);
  private childrenService = inject(ChildrenService);
  private analyticsService = inject(AnalyticsService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  summary = signal<WeeklySummaryData | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  /** Number of days in the summary period (for per-day averages). */
  private readonly DAYS_IN_PERIOD = 7;

  /** True when all activity counts are zero (empty state, not error). */
  isEmpty = computed(() => {
    const s = this.summary();
    if (!s) return false;
    return (
      s.feedings.count === 0 &&
      s.diapers.count === 0 &&
      s.sleep.naps === 0
    );
  });

  /** Daily averages for doctor-friendly "how many per day" answers. */
  feedingsPerDay = computed(() => {
    const s = this.summary();
    return s ? s.feedings.count / this.DAYS_IN_PERIOD : 0;
  });
  ozPerDay = computed(() => {
    const s = this.summary();
    return s ? s.feedings.total_oz / this.DAYS_IN_PERIOD : 0;
  });
  diapersPerDay = computed(() => {
    const s = this.summary();
    return s ? s.diapers.count / this.DAYS_IN_PERIOD : 0;
  });
  napsPerDay = computed(() => {
    const s = this.summary();
    return s ? s.sleep.naps / this.DAYS_IN_PERIOD : 0;
  });
  sleepMinutesPerDay = computed(() => {
    const s = this.summary();
    return s ? s.sleep.total_minutes / this.DAYS_IN_PERIOD : 0;
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('childId');
    if (!idParam) {
      this.error.set('Child not found.');
      this.isLoading.set(false);
      return;
    }

    const numericId = Number(idParam);
    if (Number.isNaN(numericId)) {
      this.error.set('Invalid child.');
      this.isLoading.set(false);
      return;
    }

    this.childId.set(numericId);
    this.loadData();
  }

  loadData(): void {
    const id = this.childId();
    if (!id) return;

    this.error.set(null);
    this.isLoading.set(true);

    this.childrenService.get(id).subscribe({
      next: (child) => {
        this.child.set(child);
        this.titleService.setTitle(`Pediatrician summary – ${child.name} – PoopyFeed`);
        this.analyticsService.getWeeklySummary(id).subscribe({
          next: (data) => {
            this.summary.set(data);
            this.isLoading.set(false);
          },
          error: (err: Error) => {
            this.error.set(err.message);
            this.isLoading.set(false);
          },
        });
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  onRetry(): void {
    this.loadData();
  }

  onPrint(): void {
    window.print();
  }

  /** Format minutes for display (e.g. sleep total, avg duration). */
  formatDuration(minutes: number): string {
    return formatMinutes(Math.round(minutes));
  }
}
