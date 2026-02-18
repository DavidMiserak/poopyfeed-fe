/**
 * TimeWindowSelector Component
 *
 * Allows caregivers to select/adjust the catch-up time window with validation.
 * Features:
 * - Datetime input fields (start/end)
 * - Preset buttons (Last 4h, 8h, 24h, Custom)
 * - Real-time duration display
 * - Validation using TimeEstimationService
 * - Disable future end times
 * - Mobile-friendly responsive layout
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TimeWindow } from '../../models';
import { DateTimeService } from '../../services/datetime.service';
import { TimeEstimationService } from '../../services/time-estimation.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-time-window-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="time-window-selector space-y-4">
      <!-- Preset Buttons -->
      <div class="flex flex-wrap gap-2">
        <button
          (click)="applyPreset('4h')"
          [class.ring-2]="selectedPreset() === '4h'"
          class="px-4 py-2 border rounded-lg font-medium transition-all ring-rose-500"
          [class.bg-rose-50]="selectedPreset() === '4h'"
          [class.border-rose-300]="selectedPreset() === '4h'"
          [class.border-gray-300]="selectedPreset() !== '4h'"
          aria-label="Last 4 hours"
        >
          Last 4h
        </button>
        <button
          (click)="applyPreset('8h')"
          [class.ring-2]="selectedPreset() === '8h'"
          class="px-4 py-2 border rounded-lg font-medium transition-all ring-rose-500"
          [class.bg-rose-50]="selectedPreset() === '8h'"
          [class.border-rose-300]="selectedPreset() === '8h'"
          [class.border-gray-300]="selectedPreset() !== '8h'"
          aria-label="Last 8 hours"
        >
          Last 8h
        </button>
        <button
          (click)="applyPreset('24h')"
          [class.ring-2]="selectedPreset() === '24h'"
          class="px-4 py-2 border rounded-lg font-medium transition-all ring-rose-500"
          [class.bg-rose-50]="selectedPreset() === '24h'"
          [class.border-rose-300]="selectedPreset() === '24h'"
          [class.border-gray-300]="selectedPreset() !== '24h'"
          aria-label="Last 24 hours"
        >
          Last 24h
        </button>
        <button
          (click)="applyPreset('custom')"
          [class.ring-2]="selectedPreset() === 'custom'"
          class="px-4 py-2 border rounded-lg font-medium transition-all ring-rose-500"
          [class.bg-rose-50]="selectedPreset() === 'custom'"
          [class.border-rose-300]="selectedPreset() === 'custom'"
          [class.border-gray-300]="selectedPreset() !== 'custom'"
          aria-label="Custom time range"
        >
          Custom
        </button>
      </div>

      <!-- Time Inputs -->
      <form [formGroup]="timeForm" class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Start Time -->
          <div class="flex flex-col">
            <label for="startTime" class="text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              id="startTime"
              type="datetime-local"
              formControlName="startTime"
              (blur)="onTimeChange()"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              aria-describedby="startTimeError"
            />
            @if (validationError()) {
              <span id="startTimeError" class="text-xs text-red-600 mt-1">
                {{ validationError() }}
              </span>
            }
          </div>

          <!-- End Time -->
          <div class="flex flex-col">
            <label for="endTime" class="text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              id="endTime"
              type="datetime-local"
              formControlName="endTime"
              (blur)="onTimeChange()"
              [disabled]="isFutureDisabled()"
              class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-describedby="endTimeError"
            />
            @if (isFutureDisabled()) {
              <span id="endTimeError" class="text-xs text-gray-500 mt-1">
                End time cannot be in the future
              </span>
            }
          </div>
        </div>

        <!-- Duration Display -->
        <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p class="text-sm font-medium text-gray-700">
            Window Duration: <span class="text-rose-600">{{ durationDisplay() }}</span>
          </p>
        </div>
      </form>

      <!-- Action Buttons -->
      <div class="flex gap-2 justify-between pt-2">
        <button
          (click)="handleCancel()"
          class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          (click)="onApply()"
          [disabled]="!canApply()"
          [attr.aria-busy]="isValidating()"
          class="px-4 py-2 bg-rose-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (isValidating()) {
            <span class="inline-block animate-spin mr-2">⏳</span>
          }
          Apply
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeWindowSelector {
  // Dependencies
  private dateTimeService = inject(DateTimeService);
  private timeEstimationService = inject(TimeEstimationService);
  private toast = inject(ToastService);

  // Input/Output
  timeWindow = input<TimeWindow>();
  onTimeWindowChange = output<TimeWindow>();
  onCancelClick = output<void>();

  // State
  selectedPreset = signal<'4h' | '8h' | '24h' | 'custom' | null>(null);
  isValidating = signal(false);
  validationError = signal<string | null>(null);
  isFutureDisabled = signal(false);

  // Form
  timeForm = new FormGroup({
    startTime: new FormControl('', [Validators.required]),
    endTime: new FormControl('', [Validators.required]),
  });

  /**
   * Calculate and display duration between start and end times.
   */
  durationDisplay(): string {
    const startVal = this.timeForm.get('startTime')?.value;
    const endVal = this.timeForm.get('endTime')?.value;

    if (!startVal || !endVal) return '—';

    try {
      const start = new Date(startVal);
      const end = new Date(endVal);
      const diffMs = end.getTime() - start.getTime();

      if (diffMs < 0) return 'Invalid (start after end)';
      if (diffMs === 0) return '0 minutes';

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
      return `${minutes}m`;
    } catch {
      return '—';
    }
  }

  /**
   * Check if apply button should be enabled.
   */
  canApply(): boolean {
    return this.timeForm.valid && !this.isValidating() && this.validationError() === null;
  }

  /**
   * Apply preset time window.
   */
  applyPreset(preset: '4h' | '8h' | '24h' | 'custom') {
    this.selectedPreset.set(preset);
    const now = new Date();
    let startTime: Date;

    switch (preset) {
      case '4h':
        startTime = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        break;
      case '8h':
        startTime = new Date(now.getTime() - 8 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        // Keep existing times
        return;
    }

    // Update form with preset times
    const startStr = this.dateTimeService.toInputFormat(startTime);
    const endStr = this.dateTimeService.toInputFormat(now);

    this.timeForm.patchValue({
      startTime: startStr,
      endTime: endStr,
    });

    this.validationError.set(null);
  }

  /**
   * Validate time window on change.
   */
  onTimeChange() {
    const startVal = this.timeForm.get('startTime')?.value;
    const endVal = this.timeForm.get('endTime')?.value;

    if (!startVal || !endVal) {
      this.validationError.set(null);
      return;
    }

    try {
      const startTime = new Date(startVal).toISOString();
      const endTime = new Date(endVal).toISOString();

      const errors = this.timeEstimationService.validateTimeWindow({
        startTime,
        endTime,
      });

      if (errors.length > 0) {
        this.validationError.set(errors[0]);
        this.isFutureDisabled.set(false);
      } else {
        this.validationError.set(null);
        // Check if end time is in future (with tolerance)
        const now = new Date();
        const endDate = new Date(endVal);
        const toleranceMs = 5 * 60000;
        this.isFutureDisabled.set(endDate.getTime() > now.getTime() + toleranceMs);
      }
    } catch {
      this.validationError.set('Invalid datetime format');
    }
  }

  /**
   * Apply the selected time window.
   */
  onApply() {
    if (!this.canApply()) return;

    const startVal = this.timeForm.get('startTime')?.value;
    const endVal = this.timeForm.get('endTime')?.value;

    if (!startVal || !endVal) return;

    this.isValidating.set(true);

    try {
      const startTime = new Date(startVal).toISOString();
      const endTime = new Date(endVal).toISOString();

      // Final validation
      const errors = this.timeEstimationService.validateTimeWindow({
        startTime,
        endTime,
      });

      if (errors.length > 0) {
        errors.forEach((err) => this.toast.error(err));
        this.isValidating.set(false);
        return;
      }

      this.onTimeWindowChange.emit({
        startTime,
        endTime,
      });

      this.isValidating.set(false);
    } catch (err) {
      this.toast.error('Failed to apply time window');
      this.isValidating.set(false);
    }
  }

  /**
   * Cancel and go back.
   */
  handleCancel() {
    this.onCancelClick.emit();
  }
}
