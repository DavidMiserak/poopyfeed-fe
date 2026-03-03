/**
 * Print view for pediatrician summary.
 *
 * Dedicated full-page layout that does not clip content when printing.
 * Route: /children/:childId/pediatrician-summary/print
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ChildrenService } from '../../../services/children.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { Child } from '../../../models/child.model';
import { WeeklySummaryData } from '../../../models/analytics.model';
import { ErrorCardComponent } from '../../../components/error-card/error-card.component';
import { formatMinutes, getGenderIconDetailed } from '../../../utils/date.utils';

const DAYS_IN_PERIOD = 7;

@Component({
  selector: 'app-pediatrician-summary-print',
  imports: [DecimalPipe, ErrorCardComponent, RouterLink],
  templateUrl: './pediatrician-summary-print.html',
  styleUrl: './pediatrician-summary-print.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PediatricianSummaryPrintComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);
  private childrenService = inject(ChildrenService);
  private analyticsService = inject(AnalyticsService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  summary = signal<WeeklySummaryData | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  isEmpty = computed(() => {
    const s = this.summary();
    if (!s) return false;
    return (
      s.feedings.count === 0 &&
      s.diapers.count === 0 &&
      s.sleep.naps === 0
    );
  });

  feedingsPerDay = computed(() => {
    const s = this.summary();
    return s ? s.feedings.count / DAYS_IN_PERIOD : 0;
  });
  ozPerDay = computed(() => {
    const s = this.summary();
    return s ? s.feedings.total_oz / DAYS_IN_PERIOD : 0;
  });
  diapersPerDay = computed(() => {
    const s = this.summary();
    return s ? s.diapers.count / DAYS_IN_PERIOD : 0;
  });
  napsPerDay = computed(() => {
    const s = this.summary();
    return s ? s.sleep.naps / DAYS_IN_PERIOD : 0;
  });
  sleepMinutesPerDay = computed(() => {
    const s = this.summary();
    return s ? s.sleep.total_minutes / DAYS_IN_PERIOD : 0;
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
        this.titleService.setTitle(`Print summary – ${child.name} – PoopyFeed`);
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

  onPrint(): void {
    window.print();
  }

  formatDuration(minutes: number): string {
    const safe = Number.isFinite(minutes) ? Math.round(minutes) : 0;
    return formatMinutes(Math.max(0, safe));
  }

  getGenderIcon = (gender: 'M' | 'F' | 'O') => getGenderIconDetailed(gender);
}
