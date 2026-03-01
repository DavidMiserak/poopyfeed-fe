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
  input,
  output,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ExportOptions } from '../../models/analytics.model';

@Component({
  selector: 'app-export-dialog',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './export-dialog.html',
})
export class ExportDialogComponent implements OnInit {
  isSubmitting = input(false);

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
