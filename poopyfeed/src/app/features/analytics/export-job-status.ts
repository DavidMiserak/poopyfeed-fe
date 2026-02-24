/**
 * PDF export job status polling component.
 *
 * Monitors the progress of asynchronous PDF export generation.
 * Polls job status every 2 seconds until completion or failure.
 *
 * Features:
 * - Real-time progress tracking (0-100%)
 * - Status display (pending → processing → completed/failed)
 * - Auto-polling with interval (2 seconds)
 * - Download link when ready
 * - Expiration countdown
 * - Error handling and cleanup
 *
 * Lifecycle:
 * 1. Component initialized with taskId
 * 2. Start polling job status immediately
 * 3. Display progress bar and status message
 * 4. On completion: Show download button with expiry time
 * 5. On failure: Show error message
 * 6. Stop polling when complete/failed or on destroy
 *
 * Usage:
 * ```typescript
 * showJobStatus = signal(false);
 * jobTaskId = signal<string | null>(null);
 *
 * onPDFExportStart(response: ExportJobResponse) {
 *   this.jobTaskId.set(response.task_id);
 *   this.showJobStatus.set(true);
 * }
 *
 * onJobComplete() {
 *   this.showJobStatus.set(false);
 *   this.toast.success('PDF ready for download');
 * }
 * ```
 *
 * ```html
 * @if (showJobStatus(); as taskId) {
 *   <app-export-job-status
 *     [taskId]="taskId"
 *     [childId]="selectedChildId()!"
 *     (dismiss)="onJobComplete()"
 *   />
 * }
 * ```
 *
 * @component
 * Selector: app-export-job-status
 * Inputs:
 * - taskId: string - Unique task identifier for polling
 * - childId: number - Child ID for context (not used in API call)
 * Outputs:
 * - dismiss: void - Emitted when user dismisses the component
 */

import {
  Component,
  input,
  output,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { timer, Subject, takeUntil, switchMap, finalize } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';
import { JobStatusResponse } from '../../models/analytics.model';

@Component({
  selector: 'app-export-job-status',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './export-job-status.html',
})
export class ExportJobStatusComponent implements OnInit, OnDestroy {
  // Component inputs
  taskId = input.required<string>();
  childId = input.required<number>();

  // Component output
  dismissEvent = output<void>();

  // Injected services
  private analyticsService = inject(AnalyticsService);
  private toast = inject(ToastService);

  // State signals
  status = signal<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  progress = signal(0);
  downloadUrl = signal<string | null>(null);
  expiresAt = signal<Date | null>(null);
  error = signal<string | null>(null);
  isPolling = signal(true);

  // Computed signals
  isComplete = computed(
    () =>
      this.status() === 'completed' ||
      this.status() === 'failed' ||
      !this.isPolling()
  );

  // Cleanup subjects for subscriptions
  private destroy$ = new Subject<void>();
  private stopPolling$ = new Subject<void>();

  // Polling configuration
  private readonly POLL_INTERVAL_MS = 2000;
  private readonly MAX_POLL_TIME_MS = 30 * 60 * 1000; // 30 minutes
  private startTime: number = 0;

  ngOnInit(): void {
    this.startTime = Date.now();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling$.next();
    this.stopPolling$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Start polling job status at regular intervals.
   *
   * Polls immediately and then every 2 seconds until:
   * - Job completes (completed/failed)
   * - 30-minute timeout is reached
   * - Component is destroyed
   */
  private startPolling(): void {
    timer(0, this.POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.analyticsService.getPDFJobStatus(this.childId(), this.taskId())),
        finalize(() => this.isPolling.set(false)),
        takeUntil(this.stopPolling$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: JobStatusResponse) => {
          // Update status and progress
          this.status.set(response.status);
          if (response.progress !== undefined) {
            this.progress.set(response.progress);
          }

          // Handle completion
          if (response.status === 'completed' && response.result) {
            this.progress.set(100);
            this.downloadUrl.set(response.result.download_url);
            this.expiresAt.set(new Date(response.result.expires_at));
            this.toast.success('PDF export ready for download!');
            this.stopPolling();
            return;
          }

          // Handle failure
          if (response.status === 'failed') {
            this.error.set(response.error || 'PDF export failed');
            this.toast.error(response.error || 'PDF export failed');
            this.stopPolling();
            return;
          }

          // Check for timeout
          if (Date.now() - this.startTime > this.MAX_POLL_TIME_MS) {
            this.error.set('Job timed out after 30 minutes');
            this.status.set('failed');
            this.toast.error('PDF export took too long, please try again');
            this.stopPolling();
          }
        },
        error: (err: Error) => {
          this.error.set(err.message);
          this.status.set('failed');
          this.toast.error(`Job status check failed: ${err.message}`);
          this.stopPolling();
        },
      });
  }

  /**
   * Stop polling and cleanup.
   *
   * Called when job completes, fails, or times out.
   * Emits to stopPolling$ subject to unsubscribe from timer.
   */
  private stopPolling(): void {
    this.isPolling.set(false);
    this.stopPolling$.next();
  }

  /**
   * Handle download button click.
   *
   * Triggers browser download of PDF file via AnalyticsService.
   *
   * @param downloadUrl URL of the PDF file to download
   */
  onDownloadClick(downloadUrl: string): void {
    this.analyticsService
      .downloadPDF(downloadUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err: Error) => {
          this.toast.error(`Download failed: ${err.message}`);
        },
      });
  }

  /**
   * Handle dismiss button click.
   *
   * Emits dismiss event to parent component and stops polling.
   */
  onDismiss(): void {
    this.stopPolling();
    this.dismissEvent.emit();
  }
}
