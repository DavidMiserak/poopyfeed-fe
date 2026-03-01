/**
 * Export data page component.
 *
 * Full-page wrapper for the export dialog, allowing users to export analytics
 * data as CSV (immediate download) or PDF (async with polling).
 *
 * Replaces the modal overlay with a dedicated page route:
 * /children/:childId/analytics/export
 *
 * Route parameters:
 * - childId: Child's unique identifier (required)
 */

import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { ExportDialogComponent } from './export-dialog';
import { ExportJobStatusComponent } from './export-job-status';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';
import { ExportOptions } from '../../models/analytics.model';

@Component({
  selector: 'app-export-page',
  imports: [ExportDialogComponent, ExportJobStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './export-page.html',
})
export class ExportPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private analyticsService = inject(AnalyticsService);
  private toast = inject(ToastService);

  private destroy$ = new Subject<void>();

  childId = signal<number | null>(null);
  showJobStatus = signal(false);
  jobTaskId = signal<string | null>(null);
  isExporting = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('childId');

    if (!idParam) {
      this.toast.error('Child ID is required');
      this.router.navigate(['/children']);
      return;
    }

    const id = Number(idParam);
    if (isNaN(id)) {
      this.toast.error('Invalid child ID');
      this.router.navigate(['/children']);
      return;
    }

    this.childId.set(id);
  }

  /**
   * Handle export dialog submit event.
   *
   * Processes export based on format:
   * - CSV: Triggers immediate download and navigates back
   * - PDF: Initiates async job and shows polling status
   *
   * @param options Export options (format and days)
   */
  onExportDialogSubmit(options: ExportOptions): void {
    const childIdValue = this.childId();
    if (!childIdValue) {
      this.toast.error('Child ID is missing');
      return;
    }

    if (options.format === 'csv') {
      this.handleCSVExport(childIdValue, options.days);
    } else if (options.format === 'pdf') {
      this.handlePDFExport(childIdValue, options.days);
    }
  }

  /**
   * Handle export dialog cancel event.
   */
  onExportDialogCancel(): void {
    this.goBack();
  }

  /**
   * Handle CSV export (immediate download).
   *
   * @param childId Child's unique identifier
   * @param days Number of days to export
   */
  private handleCSVExport(childId: number, days: number): void {
    this.isExporting.set(true);
    this.analyticsService
      .exportCSV(childId, days)
      .pipe(
        finalize(() => this.isExporting.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.toast.success('CSV downloaded successfully');
          this.goBack();
        },
        error: (err: Error) => {
          this.toast.error(err.message);
        },
      });
  }

  /**
   * Handle PDF export (async with polling).
   *
   * Initiates a background job and shows polling status on the page.
   *
   * @param childId Child's unique identifier
   * @param days Number of days to export
   */
  private handlePDFExport(childId: number, days: number): void {
    this.isExporting.set(true);
    this.analyticsService
      .exportPDFAsync(childId, days)
      .pipe(
        finalize(() => this.isExporting.set(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.jobTaskId.set(response.task_id);
          this.showJobStatus.set(true);
        },
        error: (err: Error) => {
          this.toast.error(err.message);
        },
      });
  }

  /**
   * Handle job status polling modal dismiss.
   */
  onJobStatusDismiss(): void {
    this.goBack();
  }

  goBack(): void {
    const childIdValue = this.childId();
    if (childIdValue) {
      this.router.navigate(['/children', childIdValue, 'advanced']);
    } else {
      this.router.navigate(['/children']);
    }
  }

  /**
   * Cleanup on component destroy.
   *
   * Unsubscribes from all pending subscriptions.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
