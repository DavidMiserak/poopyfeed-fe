/**
 * EventCard Component
 *
 * Displays individual event within the timeline with support for editing and deletion.
 */

import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CatchUpEvent } from '../../models';
import { DateTimeService } from '../../services/datetime.service';
import { ToastService } from '../../services/toast.service';
import { getActivityIcon, formatTimestamp } from '../../utils/date.utils';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <article
      class="event-card border rounded-lg p-4 transition-all"
      [class.bg-blue-50]="!evt.isExisting"
      [class.bg-rose-50]="evt.isExisting"
      [class.ring-2]="isExpanded()"
      [class.ring-rose-300]="isExpanded() && evt.isExisting"
      [class.ring-blue-300]="isExpanded() && !evt.isExisting"
      role="article"
    >
      <!-- Header -->
      <div class="flex items-center justify-between cursor-pointer" (click)="toggleExpand()">
        <div class="flex items-center gap-3 flex-1">
          <!-- Drag Handle -->
          <div
            class="text-gray-400 cursor-grab active:cursor-grabbing"
            [attr.aria-label]="'Drag handle for ' + evt.type + ' event'"
          >
            ⋮⋮
          </div>

          <!-- Event Type Icon -->
          <span class="text-2xl" [attr.aria-label]="evt.type + ' event'">
            {{ getActivityIcon(evt.type) }}
          </span>

          <!-- Event Info -->
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 capitalize">{{ evt.type }}</h3>
            <p class="text-sm text-gray-600">{{ formatTime() }}</p>
          </div>
        </div>

        <!-- Expand/Collapse Indicator -->
        <button
          (click)="toggleExpand(); $event.stopPropagation()"
          class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          [attr.aria-label]="isExpanded() ? 'Collapse' : 'Expand'"
          [attr.aria-expanded]="isExpanded()"
        >
          {{ isExpanded() ? '▼' : '▶' }}
        </button>
      </div>

      <!-- Expanded Content -->
      @if (isExpanded()) {
        <div class="mt-4 space-y-4 border-t pt-4">
          <!-- Read-only Display for Existing Events -->
          @if (evt.isExisting) {
            <div class="space-y-2 text-sm" [innerHTML]="getReadOnlyContent()"></div>
          } @else {
            <!-- Editable Form for New Events -->
            <form [formGroup]="eventForm" class="space-y-3">
              <!-- Pin Time Toggle -->
              <div class="flex items-center gap-3">
                <input
                  [id]="'isPinned-' + evt.id"
                  type="checkbox"
                  formControlName="isPinned"
                  (change)="onPinChange()"
                  class="w-4 h-4 cursor-pointer"
                  [attr.aria-label]="'Pin time for ' + evt.type + ' event'"
                />
                <label
                  [for]="'isPinned-' + evt.id"
                  class="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Manual Time Override
                </label>
              </div>

              <!-- Time Input (when pinned) -->
              @if (eventForm.get('isPinned')?.value) {
                <div class="flex flex-col">
                  <label [for]="'time-' + evt.id" class="text-sm font-medium text-gray-700 mb-1">
                    Event Time
                  </label>
                  <input
                    [id]="'time-' + evt.id"
                    type="datetime-local"
                    formControlName="estimatedTime"
                    class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              }

              <!-- Feeding Type Fields -->
              @if (evt.type === 'feeding') {
                <div class="space-y-3">
                  <div class="flex flex-col">
                    <label
                      [for]="'feedingType-' + evt.id"
                      class="text-sm font-medium text-gray-700 mb-1"
                    >
                      Feeding Type
                    </label>
                    <select
                      [id]="'feedingType-' + evt.id"
                      formControlName="feeding_type"
                      (change)="onFeedingTypeChange()"
                      class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="bottle">Bottle</option>
                      <option value="breast">Breast</option>
                    </select>
                  </div>

                  @if (eventForm.get('feeding_type')?.value === 'bottle') {
                    <div class="flex flex-col">
                      <label
                        [for]="'amount-' + evt.id"
                        class="text-sm font-medium text-gray-700 mb-1"
                      >
                        Amount (oz)
                      </label>
                      <input
                        [id]="'amount-' + evt.id"
                        type="number"
                        formControlName="amount_oz"
                        step="0.5"
                        min="0"
                        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  } @else {
                    <div class="flex flex-col">
                      <label
                        [for]="'duration-' + evt.id"
                        class="text-sm font-medium text-gray-700 mb-1"
                      >
                        Duration (minutes)
                      </label>
                      <input
                        [id]="'duration-' + evt.id"
                        type="number"
                        formControlName="duration_minutes"
                        min="0"
                        class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  }

                  <div class="flex flex-col">
                    <label
                      [for]="'side-' + evt.id"
                      class="text-sm font-medium text-gray-700 mb-1"
                    >
                      Side (optional)
                    </label>
                    <select
                      [id]="'side-' + evt.id"
                      formControlName="side"
                      class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">None</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              }

              <!-- Diaper Type Field -->
              @if (evt.type === 'diaper') {
                <div class="flex flex-col">
                  <label
                    [for]="'changeType-' + evt.id"
                    class="text-sm font-medium text-gray-700 mb-1"
                  >
                    Change Type
                  </label>
                  <select
                    [id]="'changeType-' + evt.id"
                    formControlName="change_type"
                    class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="wet">Wet</option>
                    <option value="dirty">Dirty</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              }

              <!-- Nap Duration Fields -->
              @if (evt.type === 'nap') {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div class="flex flex-col">
                    <label
                      [for]="'napStart-' + evt.id"
                      class="text-sm font-medium text-gray-700 mb-1"
                    >
                      Nap Start
                    </label>
                    <input
                      [id]="'napStart-' + evt.id"
                      type="datetime-local"
                      formControlName="napped_at"
                      class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div class="flex flex-col">
                    <label
                      [for]="'napEnd-' + evt.id"
                      class="text-sm font-medium text-gray-700 mb-1"
                    >
                      Nap End (optional)
                    </label>
                    <input
                      [id]="'napEnd-' + evt.id"
                      type="datetime-local"
                      formControlName="ended_at"
                      class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              }

              <!-- Notes -->
              <div class="flex flex-col">
                <label [for]="'notes-' + evt.id" class="text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  [id]="'notes-' + evt.id"
                  formControlName="notes"
                  rows="2"
                  class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Add any notes about this event..."
                ></textarea>
              </div>

              <!-- Validation Errors -->
              @if (validationErrors().length > 0) {
                <div class="bg-red-50 border border-red-200 rounded p-3">
                  <ul class="text-sm text-red-700 space-y-1">
                    @for (error of validationErrors(); track error) {
                      <li>• {{ error }}</li>
                    }
                  </ul>
                </div>
              }
            </form>
          }
        </div>
      }

      <!-- Action Buttons -->
      <div class="flex gap-2 justify-end mt-4 pt-4 border-t">
        <!-- Delete Button (new events only) -->
        @if (!evt.isExisting) {
          <button
            (click)="onDelete()"
            class="px-3 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            [attr.aria-label]="'Delete ' + evt.type + ' event'"
          >
            Delete
          </button>
        }
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      article {
        border-color: theme('colors.gray.200');
      }

      article.bg-blue-50 {
        border-color: theme('colors.blue.200');
      }

      article.bg-rose-50 {
        border-color: theme('colors.rose.200');
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventCard {
  // Dependencies
  private dateTimeService = inject(DateTimeService);
  private toast = inject(ToastService);

  // Input/Output
  event = input<CatchUpEvent>();
  onUpdate = output<Partial<CatchUpEvent>>();
  onRemove = output<void>();

  // Computed property for template
  get evt(): CatchUpEvent {
    return this.event()!;
  }

  // State
  isExpanded = signal(false);
  validationErrors = signal<string[]>([]);

  // Form for editing new events
  eventForm = new FormGroup({
    isPinned: new FormControl(false),
    estimatedTime: new FormControl(''),
    feeding_type: new FormControl('bottle'),
    amount_oz: new FormControl<number | null>(null),
    duration_minutes: new FormControl<number | null>(null),
    side: new FormControl(''),
    change_type: new FormControl('wet'),
    napped_at: new FormControl(''),
    ended_at: new FormControl(''),
    notes: new FormControl(''),
  });

  // Helpers
  getActivityIcon = getActivityIcon;

  constructor() {
    this.initializeForm();
  }

  /**
   * Get read-only content HTML for existing events.
   */
  getReadOnlyContent(): string {
    const data = this.evt.data as any;
    let html = '';

    if (this.evt.type === 'feeding') {
      if (data.feeding_type) {
        html += `<div><span class="text-gray-600">Type:</span><span class="ml-2 font-medium capitalize">${data.feeding_type}</span></div>`;
      }
      if (data.amount_oz) {
        html += `<div><span class="text-gray-600">Amount:</span><span class="ml-2 font-medium">${data.amount_oz} oz</span></div>`;
      }
      if (data.duration_minutes) {
        html += `<div><span class="text-gray-600">Duration:</span><span class="ml-2 font-medium">${data.duration_minutes} min</span></div>`;
      }
      if (data.side) {
        html += `<div><span class="text-gray-600">Side:</span><span class="ml-2 font-medium capitalize">${data.side}</span></div>`;
      }
    } else if (this.evt.type === 'diaper') {
      if (data.change_type) {
        html += `<div><span class="text-gray-600">Type:</span><span class="ml-2 font-medium capitalize">${data.change_type}</span></div>`;
      }
    } else if (this.evt.type === 'nap') {
      if (data.duration_minutes) {
        html += `<div><span class="text-gray-600">Duration:</span><span class="ml-2 font-medium">${data.duration_minutes} min</span></div>`;
      }
    }

    if (data.notes) {
      html += `<div><span class="text-gray-600">Notes:</span><p class="ml-2 text-gray-700 mt-1">${data.notes}</p></div>`;
    }

    return html;
  }

  /**
   * Initialize form with event data.
   */
  private initializeForm() {
    const evt = this.event();
    if (evt && !evt.isExisting && evt.data) {
      const data = evt.data as any;
      if (data.feeding_type) {
        this.eventForm.patchValue({ feeding_type: data.feeding_type });
      }
      if (data.amount_oz) {
        this.eventForm.patchValue({ amount_oz: data.amount_oz });
      }
      if (data.duration_minutes) {
        this.eventForm.patchValue({ duration_minutes: data.duration_minutes });
      }
      if (data.side) {
        this.eventForm.patchValue({ side: data.side });
      }
      if (data.change_type) {
        this.eventForm.patchValue({ change_type: data.change_type });
      }
      if (data.napped_at) {
        const localTime = this.dateTimeService.toInputFormat(new Date(data.napped_at));
        this.eventForm.patchValue({ napped_at: localTime });
      }
      if (data.ended_at) {
        const localTime = this.dateTimeService.toInputFormat(new Date(data.ended_at));
        this.eventForm.patchValue({ ended_at: localTime });
      }
      if (data.notes) {
        this.eventForm.patchValue({ notes: data.notes });
      }
    }
  }

  /**
   * Format event time for display.
   */
  formatTime(): string {
    return formatTimestamp(this.evt.estimatedTime);
  }

  /**
   * Toggle expand/collapse state.
   */
  toggleExpand() {
    this.isExpanded.update((v) => !v);
  }

  /**
   * Handle pin/unpin toggle.
   */
  onPinChange() {
    const isPinned = this.eventForm.get('isPinned')?.value ?? false;
    if (isPinned) {
      const localTime = this.dateTimeService.toInputFormat(new Date(this.evt.estimatedTime));
      this.eventForm.patchValue({ estimatedTime: localTime });
    }
  }

  /**
   * Handle feeding type change (updates validators).
   */
  onFeedingTypeChange() {
    const feedingType = this.eventForm.get('feeding_type')?.value;
    const amountControl = this.eventForm.get('amount_oz');
    const durationControl = this.eventForm.get('duration_minutes');

    if (feedingType === 'bottle') {
      amountControl?.setValidators([Validators.required, Validators.min(0)]);
      durationControl?.clearValidators();
    } else {
      amountControl?.clearValidators();
      durationControl?.setValidators([Validators.min(0)]);
    }

    amountControl?.updateValueAndValidity();
    durationControl?.updateValueAndValidity();
  }

  /**
   * Delete event.
   */
  onDelete() {
    const confirmed = confirm(`Delete this ${this.evt.type} event?`);
    if (confirmed) {
      this.onRemove.emit();
      this.toast.success('Event removed');
    }
  }
}
