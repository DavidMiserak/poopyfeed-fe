/**
 * Pediatrician summary component.
 *
 * Displays the last 7 days' aggregated feeding, diaper, and sleep data for a child
 * in a doctor-visit-friendly layout. Uses existing weekly-summary API.
 * Supports print via browser print dialog (print stylesheet; content flows to multiple pages as needed).
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
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ChildrenService } from '../../services/children.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Child } from '../../models/child.model';
import { WeeklySummaryData } from '../../models/analytics.model';
import { ErrorCardComponent } from '../../components/error-card/error-card.component';
import { formatMinutes } from '../../utils/date.utils';
import { SummaryNavComponent } from './summary-nav/summary-nav';
import { SummaryEmptyStateComponent } from './summary-empty-state/summary-empty-state';

@Component({
  selector: 'app-pediatrician-summary',
  imports: [
    DecimalPipe,
    ErrorCardComponent,
    SummaryNavComponent,
    SummaryEmptyStateComponent,
  ],
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
    const childData = this.child();
    const summaryData = this.summary();
    if (!childData || !summaryData || this.isEmpty()) {
      return;
    }
    const html = this.buildPrintDocumentHtml(childData.name, summaryData);
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      URL.revokeObjectURL(url);
      return;
    }
    printWindow.focus();
    printWindow.addEventListener('load', () => {
      printWindow.print();
      printWindow.addEventListener('afterprint', () => {
        printWindow.close();
        URL.revokeObjectURL(url);
      });
    });
  }

  /**
   * Build a minimal HTML document for printing so the full summary is never clipped
   * by the app layout, viewport, or Tailwind utilities.
   */
  private buildPrintDocumentHtml(childName: string, data: WeeklySummaryData): string {
    const escape = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const name = escape(childName);
    const period = escape(data.period);
    const fmt = (n: number) => this.formatDuration(n);
    const feedings = data.feedings;
    const diapers = data.diapers;
    const sleep = data.sleep;
    const feedingsPerDay = feedings.count / this.DAYS_IN_PERIOD;
    const ozPerDay = feedings.total_oz / this.DAYS_IN_PERIOD;
    const diapersPerDay = diapers.count / this.DAYS_IN_PERIOD;
    const napsPerDay = sleep.naps / this.DAYS_IN_PERIOD;
    const sleepMinPerDay = sleep.total_minutes / this.DAYS_IN_PERIOD;
    const avgDurationRow =
      feedings.avg_duration != null
        ? `<tr><td class="label">Avg duration</td><td class="value">${fmt(feedings.avg_duration)}</td></tr>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Pediatrician summary – ${name} – PoopyFeed</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0.5in; font-family: system-ui, sans-serif; font-size: 14px; color: #334155; line-height: 1.5; }
    h1 { font-size: 1.25rem; margin: 0 0 0.25rem; color: #0f172a; }
    .period { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; }
    h2 { font-size: 1rem; margin: 0.75rem 0 0.25rem; color: #1e293b; }
    section { margin-bottom: 0.75rem; }
    .per-day { font-weight: 600; margin-bottom: 0.25rem; }
    table { width: 100%; border-collapse: collapse; }
    .label { color: #64748b; }
    .value { font-weight: 600; text-align: right; }
  </style>
</head>
<body>
  <h1>${name}</h1>
  <p class="period">${period}</p>
  <section>
    <h2>🍼 Feedings</h2>
    <p class="per-day">Per day: ${feedingsPerDay.toFixed(1)} feedings, ${ozPerDay.toFixed(1)} oz</p>
    <table>
      <tr><td class="label">Total sessions</td><td class="value">${feedings.count}</td></tr>
      <tr><td class="label">Total oz</td><td class="value">${feedings.total_oz.toFixed(1)}</td></tr>
      <tr><td class="label">Bottle</td><td class="value">${feedings.bottle}</td></tr>
      <tr><td class="label">Breast</td><td class="value">${feedings.breast}</td></tr>
      ${avgDurationRow}
    </table>
  </section>
  <section>
    <h2>🧷 Diapers</h2>
    <p class="per-day">Per day: ${diapersPerDay.toFixed(1)} changes</p>
    <table>
      <tr><td class="label">Total changes</td><td class="value">${diapers.count}</td></tr>
      <tr><td class="label">Wet</td><td class="value">${diapers.wet}</td></tr>
      <tr><td class="label">Dirty</td><td class="value">${diapers.dirty}</td></tr>
      <tr><td class="label">Both</td><td class="value">${diapers.both}</td></tr>
    </table>
  </section>
  <section>
    <h2>😴 Sleep</h2>
    <p class="per-day">Per day: ${napsPerDay.toFixed(1)} naps, ${fmt(Math.round(sleepMinPerDay))} sleep</p>
    <table>
      <tr><td class="label">Naps</td><td class="value">${sleep.naps}</td></tr>
      <tr><td class="label">Total sleep</td><td class="value">${fmt(sleep.total_minutes)}</td></tr>
      <tr><td class="label">Avg nap</td><td class="value">${fmt(sleep.avg_duration)}</td></tr>
    </table>
  </section>
</body>
</html>`;
  }

  /** Format minutes for display (e.g. sleep total, avg duration). */
  formatDuration(minutes: number): string {
    return formatMinutes(Math.round(minutes));
  }
}
