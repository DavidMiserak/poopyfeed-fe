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
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';

import { ExportDialogComponent } from './export-dialog';
import { ExportJobStatusComponent } from './export-job-status';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';
import { ExportOptions } from '../../models/analytics.model';

@Component({
  selector: 'app-export-page',
  standalone: true,
  imports: [CommonModule, ExportDialogComponent, ExportJobStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Back link -->
      <div class="mb-6">
        <a
          (click)="goBack()"
          class="text-orange-600 hover:text-orange-700 font-medium cursor-pointer flex items-center gap-2"
        >
          ← Back to Analytics
        </a>
      </div>

      <!-- Export dialog or job status -->
      @if (!showJobStatus()) {
        <!-- Export Dialog (full page) -->
        <div class="flex justify-center">
          <app-export-dialog
            (submitEvent)="onExportDialogSubmit($event)"
            (cancelEvent)="onExportDialogCancel()"
          />
        </div>
      } @else if (jobTaskId(); as taskId) {
        <!-- Job Status Polling (full page) -->
        <div class="flex justify-center">
          <app-export-job-status
            [taskId]="taskId"
            [childId]="childId()!"
            (dismissEvent)="onJobStatusDismiss()"
          />
        </div>
      }
    </div>
  `,
})
export class ExportPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private analyticsService = inject(AnalyticsService);
  private toast = inject(ToastService);

  childId = signal<number | null>(null);
  showJobStatus = signal(false);
  jobTaskId = signal<string | null>(null);

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
    this.analyticsService.exportCSV(childId, days).subscribe({
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
    this.analyticsService.exportPDFAsync(childId, days).subscribe({
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

  /**
   * Navigate back to the analytics dashboard.
   */
  goBack(): void {
    const childIdValue = this.childId();
    if (childIdValue) {
      this.router.navigate([`/children/${childIdValue}/analytics`]);
    } else {
      this.router.navigate(['/children']);
    }
  }
}
