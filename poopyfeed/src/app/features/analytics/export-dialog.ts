/**
 * Export analytics data dialog component.
 *
 * Modal dialog for selecting export format (CSV/PDF) and date range.
 * Users can choose to export data for 7, 30, 60, or 90 days.
 *
 * Format Options:
 * - **CSV**: Instant download, no waiting required
 * - **PDF**: Async generation with charts and summaries, requires polling
 *
 * Date Range:
 * - 7, 30, 60, or 90 days (default: 30)
 *
 * Usage in parent component:
 * ```typescript
 * export class ExportPage {
 *   childId = signal<number | null>(null);
 *   showExportDialog = signal(true);
 *
 *   onExportDialogSubmit(options: ExportOptions) {
 *     const childIdValue = this.childId();
 *     if (options.format === 'csv') {
 *       this.handleCSVExport(childIdValue, options.days);
 *     } else {
 *       this.handlePDFExport(childIdValue, options.days);
 *     }
 *   }
 *
 *   onExportDialogCancel() {
 *     this.goBack();
 *   }
 * }
 * ```
 *
 * ```html
 * <app-export-dialog
 *   (submitEvent)="onExportDialogSubmit($event)"
 *   (cancelEvent)="onExportDialogCancel()"
 * />
 * ```
 *
 * @component
 * Selector: app-export-dialog
 * Outputs:
 * - submitEvent: ExportOptions - Emitted when user submits export options (format and days)
 * - cancelEvent: void - Emitted when user cancels the dialog
 */

import {
  Component,
  inject,
  signal,
  output,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ExportOptions } from '../../models/analytics.model';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="font-['Fredoka',sans-serif] text-2xl font-bold text-gray-900">
          Export Analytics
        </h2>
        <p class="text-sm text-gray-600 mt-1">
          Download your baby's activity data in CSV or PDF format
        </p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Format Selection -->
        <fieldset class="mb-8">
          <legend class="font-['Fredoka',sans-serif] font-semibold text-gray-900 mb-4">
            Export Format
          </legend>

          <div class="space-y-3">
            <!-- CSV Option -->
            <label
              class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              [class.border-orange-500]="form.get('format')?.value === 'csv'"
              [class.bg-orange-50]="form.get('format')?.value === 'csv'"
            >
              <input
                type="radio"
                formControlName="format"
                value="csv"
                class="w-4 h-4 text-orange-500 accent-orange-500"
                aria-label="Export as CSV for instant download"
              />
              <div class="ml-4 flex-1">
                <p class="font-medium text-gray-900">CSV (Instant)</p>
                <p class="text-sm text-gray-600">Download immediately</p>
              </div>
              <span class="text-2xl">📄</span>
            </label>

            <!-- PDF Option -->
            <label
              class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              [class.border-orange-500]="form.get('format')?.value === 'pdf'"
              [class.bg-orange-50]="form.get('format')?.value === 'pdf'"
            >
              <input
                type="radio"
                formControlName="format"
                value="pdf"
                class="w-4 h-4 text-orange-500 accent-orange-500"
                aria-label="Export as PDF with charts and summaries"
              />
              <div class="ml-4 flex-1">
                <p class="font-medium text-gray-900">PDF (Formatted)</p>
                <p class="text-sm text-gray-600">Includes charts & summaries</p>
              </div>
              <span class="text-2xl">📊</span>
            </label>
          </div>
        </fieldset>

        <!-- Date Range Selection -->
        <fieldset class="mb-8">
          <legend class="font-['Fredoka',sans-serif] font-semibold text-gray-900 mb-4">
            Time Period
          </legend>

          <select
            id="days-select"
            formControlName="days"
            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors bg-white text-gray-900 font-medium"
            aria-label="Select time period for export"
          >
            <option value="7">Last 7 days</option>
            <option value="30" selected>Last 30 days (Default)</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </fieldset>

        <!-- Info Box -->
        <div
          class="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded text-sm text-blue-800"
          role="status"
        >
          @switch (form.get('format')?.value) {
            @case ('csv') {
              <p>
                <span class="font-semibold">CSV files</span> can be opened in Excel or
                Google Sheets for analysis
              </p>
            }
            @case ('pdf') {
              <p>
                <span class="font-semibold">PDF generation</span> may take 1-2 minutes.
                You'll get a download link via notification.
              </p>
            }
          }
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            (click)="onCancel()"
            [disabled]="isSubmitting()"
            class="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel export dialog"
          >
            Cancel
          </button>

          <button
            type="submit"
            [disabled]="!form.valid || isSubmitting()"
            class="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            [attr.aria-busy]="isSubmitting()"
            aria-label="Confirm and start export"
          >
            @if (isSubmitting()) {
              <svg
                class="w-4 h-4 animate-spin"
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
              <span>Exporting...</span>
            } @else {
              <span>📥 Export Data</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ExportDialogComponent implements OnInit {
  isSubmitting = signal(false);

  // Output events for parent component
  submitEvent = output<ExportOptions>();
  cancelEvent = output<void>();

  form = new FormGroup({
    format: new FormControl<'csv' | 'pdf'>('csv', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    days: new FormControl(30, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(90)],
    }),
  });

  ngOnInit(): void {
    this.form.patchValue({
      format: 'csv',
      days: 30,
    });
  }

  /**
   * Handle form submission.
   *
   * Validates form state, then emits export options to parent component.
   * Parent component listens to submitEvent output to receive the options.
   */
  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    const formValue = this.form.getRawValue();

    // Create export options object to emit to parent
    const options: ExportOptions = {
      format: formValue.format,
      days: formValue.days,
    };

    // Emit options to parent component
    this.submitEvent.emit(options);
  }

  /**
   * Handle cancel button click.
   *
   * Emits cancel event to parent component.
   * Parent component listens to cancelEvent output to handle dismissal.
   */
  onCancel(): void {
    this.cancelEvent.emit();
  }
}
