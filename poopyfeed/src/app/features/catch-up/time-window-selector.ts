/**
 * TimeWindowSelector Component
 *
 * Allows caregivers to select the catch-up time window.
 * Maria-optimized: Preset buttons, large touch targets, no confusing dropdowns.
 * Features:
 * - Large preset buttons (Last 4h, 8h, 24h)
 * - Validation using TimeEstimationService
 * - Mobile-friendly responsive layout
 */

import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { TimeWindow } from '../../models';
import { DateTimeService } from '../../services/datetime.service';
import { TimeEstimationService } from '../../services/time-estimation.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-time-window-selector',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="time-window-selector space-y-4">
      <!-- Preset Buttons (Maria-friendly: Large, tap-friendly) -->
      <p class="text-sm font-semibold text-slate-900">Choose Time Window</p>
      <div class="grid grid-cols-3 gap-3">
        <button
          (click)="applyPreset('4h')"
          [class.ring-2]="selectedPreset() === '4h'"
          [class.ring-rose-400]="selectedPreset() === '4h'"
          [class.bg-rose-50]="selectedPreset() === '4h'"
          [class.border-rose-300]="selectedPreset() === '4h'"
          [class.border-slate-200]="selectedPreset() !== '4h'"
          class="h-14 bg-white border-2 rounded-xl font-semibold text-base text-slate-900 transition-all hover:border-rose-300"
          aria-label="Last 4 hours"
        >
          Last 4h
        </button>
        <button
          (click)="applyPreset('8h')"
          [class.ring-2]="selectedPreset() === '8h'"
          [class.ring-rose-400]="selectedPreset() === '8h'"
          [class.bg-rose-50]="selectedPreset() === '8h'"
          [class.border-rose-300]="selectedPreset() === '8h'"
          [class.border-slate-200]="selectedPreset() !== '8h'"
          class="h-14 bg-white border-2 rounded-xl font-semibold text-base text-slate-900 transition-all hover:border-rose-300"
          aria-label="Last 8 hours"
        >
          Last 8h
        </button>
        <button
          (click)="applyPreset('24h')"
          [class.ring-2]="selectedPreset() === '24h'"
          [class.ring-rose-400]="selectedPreset() === '24h'"
          [class.bg-rose-50]="selectedPreset() === '24h'"
          [class.border-rose-300]="selectedPreset() === '24h'"
          [class.border-slate-200]="selectedPreset() !== '24h'"
          class="h-14 bg-white border-2 rounded-xl font-semibold text-base text-slate-900 transition-all hover:border-rose-300"
          aria-label="Last 24 hours"
        >
          Last 24h
        </button>
      </div>

      <!-- Duration Display -->
      @if (selectedPreset()) {
        <div class="bg-rose-50 rounded-xl p-4 border-2 border-rose-100">
          <p class="text-center text-base font-semibold text-slate-900">
            Window Duration: <span class="text-rose-600">{{ durationDisplay() }}</span>
          </p>
        </div>
      }

      <!-- Action Button -->
      @if (selectedPreset()) {
        <button
          (click)="onApply()"
          [disabled]="isValidating()"
          [attr.aria-busy]="isValidating()"
          class="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          @if (isValidating()) {
            <span class="inline-block animate-spin mr-2">⏳</span>
            Validating...
          } @else {
            Continue to Activities
          }
        </button>
      }
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
export class TimeWindowSelector implements OnInit {
  // Dependencies
  private dateTimeService = inject(DateTimeService);
  private timeEstimationService = inject(TimeEstimationService);
  private toast = inject(ToastService);

  // Input/Output
  timeWindow = input<TimeWindow>();
  onTimeWindowChange = output<TimeWindow>();
  onCancelClick = output<void>();

  // State
  selectedPreset = signal<'4h' | '8h' | '24h' | null>(null);
  isValidating = signal(false);
  validationError = signal<string | null>(null);

  ngOnInit() {
    this.initializeFromInput();
  }

  /**
   * Initialize preset from input timeWindow (FIX: was ignoring input).
   */
  private initializeFromInput() {
    const timeWindow = this.timeWindow();
    if (timeWindow) {
      // Try to match to a preset
      const start = new Date(timeWindow.startTime);
      const end = new Date(timeWindow.endTime);
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (Math.abs(diffHours - 4) < 0.5) {
        this.selectedPreset.set('4h');
      } else if (Math.abs(diffHours - 8) < 0.5) {
        this.selectedPreset.set('8h');
      } else if (Math.abs(diffHours - 24) < 0.5) {
        this.selectedPreset.set('24h');
      }
    }
    // No default - user must explicitly select a preset
  }

  /**
   * Calculate and display duration for selected preset.
   */
  durationDisplay(): string {
    const preset = this.selectedPreset();
    switch (preset) {
      case '4h':
        return '4 hours';
      case '8h':
        return '8 hours';
      case '24h':
        return '24 hours';
      default:
        return '—';
    }
  }

  /**
   * Apply preset time window.
   */
  applyPreset(preset: '4h' | '8h' | '24h') {
    this.selectedPreset.set(preset);
    this.validationError.set(null);
  }

  /**
   * Apply the selected time window after validation.
   */
  onApply() {
    const preset = this.selectedPreset();
    if (!preset) return;

    this.isValidating.set(true);

    try {
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
      }

      const timeWindow: TimeWindow = {
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
      };

      // Validate
      const errors = this.timeEstimationService.validateTimeWindow(timeWindow);
      if (errors.length > 0) {
        errors.forEach((err) => this.toast.error(err));
        this.isValidating.set(false);
        return;
      }

      this.onTimeWindowChange.emit(timeWindow);
      this.isValidating.set(false);
    } catch (err) {
      this.toast.error('Failed to apply time window');
      this.isValidating.set(false);
    }
  }
}
