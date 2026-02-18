/**
 * EventCard Component
 *
 * Displays individual event within the timeline with support for editing and deletion.
 * Maria-optimized: Large buttons, preset-first, always-expanded for new events.
 */

import {
  Component,
  input,
  output,
  signal,
  inject,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { CatchUpEvent } from '../../models';
import { DateTimeService } from '../../services/datetime.service';
import { ToastService } from '../../services/toast.service';
import { getActivityIcon, formatTimestamp } from '../../utils/date.utils';

@Component({
  selector: 'app-event-card',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <article
      class="event-card border-2 rounded-2xl p-5 transition-all"
      [class.bg-white]="!evt.isExisting"
      [class.border-rose-100]="!evt.isExisting"
      [class.bg-slate-50]="evt.isExisting"
      [class.border-slate-200]="evt.isExisting"
      [class.opacity-75]="evt.isExisting"
      role="article"
    >
      <!-- Header (Collapsible for existing events only) -->
      @if (evt.isExisting) {
        <div class="flex items-center justify-between cursor-pointer" (click)="toggleExpand()">
          <div class="flex items-center gap-3 flex-1">
            <!-- Event Type Icon -->
            <span class="text-2xl" [attr.aria-label]="evt.type + ' event'">
              {{ getActivityIcon(evt.type) }}
            </span>

            <!-- Event Info -->
            <div class="flex-1">
              <h3 class="font-semibold text-slate-900 capitalize">{{ evt.type }}</h3>
              <p class="text-sm text-slate-600">{{ formatTime() }}</p>
            </div>

            <!-- Locked Badge -->
            <span class="text-sm px-2 py-1 bg-slate-200 text-slate-700 rounded-lg font-medium flex-shrink-0" title="Locked - existing event (read-only)">
              🔒 Locked
            </span>
          </div>

          <!-- Expand/Collapse Indicator -->
          <button
            (click)="toggleExpand(); $event.stopPropagation()"
            class="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            [attr.aria-label]="isExpanded() ? 'Collapse' : 'Expand'"
            [attr.aria-expanded]="isExpanded()"
          >
            {{ isExpanded() ? '▼' : '▶' }}
          </button>
        </div>
      } @else {
        <!-- Header for new events (always visible, non-collapsible) -->
        <div class="flex items-center gap-3 mb-4">
          <span class="text-3xl" [attr.aria-label]="evt.type + ' event'">
            {{ getActivityIcon(evt.type) }}
          </span>
          <div class="flex-1">
            <h3 class="font-bold text-slate-900 capitalize text-xl">{{ evt.type }}</h3>
            <p class="text-sm text-slate-600">{{ formatTime() }}</p>
          </div>
        </div>
      }

      <!-- Expanded Content (for existing events - minimal read-only) -->
      @if (isExpanded() && evt.isExisting) {
        <div class="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <p class="text-sm text-slate-600">This is a locked existing event. You cannot edit it.</p>
        </div>
      }

      <!-- Editable Form for New Events (always visible) -->
      @if (!evt.isExisting) {
        <form [formGroup]="eventForm" class="space-y-4">
          <!-- Feeding Type Fields -->
          @if (evt.type === 'feeding') {
            <div class="space-y-4">
              <!-- Feeding Type Buttons -->
              <div class="flex flex-col">
                <p class="text-sm font-semibold text-slate-900 mb-3">Feeding Type</p>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    (click)="setFeedingType('bottle')"
                    [class.ring-2]="eventForm.get('feeding_type')?.value === 'bottle'"
                    [class.ring-rose-400]="eventForm.get('feeding_type')?.value === 'bottle'"
                    [class.bg-rose-50]="eventForm.get('feeding_type')?.value === 'bottle'"
                    [class.border-rose-300]="eventForm.get('feeding_type')?.value === 'bottle'"
                    class="h-14 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 transition-all hover:border-rose-300"
                  >
                    🍼 Bottle
                  </button>
                  <button
                    type="button"
                    (click)="setFeedingType('breast')"
                    [class.ring-2]="eventForm.get('feeding_type')?.value === 'breast'"
                    [class.ring-rose-400]="eventForm.get('feeding_type')?.value === 'breast'"
                    [class.bg-rose-50]="eventForm.get('feeding_type')?.value === 'breast'"
                    [class.border-rose-300]="eventForm.get('feeding_type')?.value === 'breast'"
                    class="h-14 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 transition-all hover:border-rose-300"
                  >
                    🤱 Breast
                  </button>
                </div>
              </div>

              <!-- Amount or Duration -->
              @if (eventForm.get('feeding_type')?.value === 'bottle') {
                <div class="flex flex-col">
                  <label
                    [for]="'amount-' + evt.id"
                    class="text-base font-semibold text-slate-900 mb-2"
                  >
                    Amount (oz)
                  </label>
                  <input
                    [id]="'amount-' + evt.id"
                    type="number"
                    formControlName="amount_oz"
                    step="0.5"
                    min="0"
                    class="h-12 px-4 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              } @else {
                <div class="flex flex-col">
                  <label
                    [for]="'duration-' + evt.id"
                    class="text-base font-semibold text-slate-900 mb-2"
                  >
                    Duration (minutes)
                  </label>
                  <input
                    [id]="'duration-' + evt.id"
                    type="number"
                    formControlName="duration_minutes"
                    min="0"
                    class="h-12 px-4 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              }

              <!-- Side -->
              <div class="flex flex-col">
                <label [for]="'side-' + evt.id" class="text-base font-semibold text-slate-900 mb-2">
                  Side (optional)
                </label>
                <select
                  [id]="'side-' + evt.id"
                  formControlName="side"
                  class="h-12 px-4 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="">None</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
          }

          <!-- Diaper Type Buttons -->
          @if (evt.type === 'diaper') {
            <div class="flex flex-col">
              <p class="text-sm font-semibold text-slate-900 mb-3">Change Type</p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  (click)="setDiaperType('wet')"
                  [class.ring-2]="eventForm.get('change_type')?.value === 'wet'"
                  [class.ring-rose-400]="eventForm.get('change_type')?.value === 'wet'"
                  [class.bg-rose-50]="eventForm.get('change_type')?.value === 'wet'"
                  [class.border-rose-300]="eventForm.get('change_type')?.value === 'wet'"
                  class="h-14 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 transition-all hover:border-rose-300"
                >
                  💧 Wet
                </button>
                <button
                  type="button"
                  (click)="setDiaperType('dirty')"
                  [class.ring-2]="eventForm.get('change_type')?.value === 'dirty'"
                  [class.ring-rose-400]="eventForm.get('change_type')?.value === 'dirty'"
                  [class.bg-rose-50]="eventForm.get('change_type')?.value === 'dirty'"
                  [class.border-rose-300]="eventForm.get('change_type')?.value === 'dirty'"
                  class="h-14 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 transition-all hover:border-rose-300"
                >
                  💩 Dirty
                </button>
                <button
                  type="button"
                  (click)="setDiaperType('both')"
                  [class.ring-2]="eventForm.get('change_type')?.value === 'both'"
                  [class.ring-rose-400]="eventForm.get('change_type')?.value === 'both'"
                  [class.bg-rose-50]="eventForm.get('change_type')?.value === 'both'"
                  [class.border-rose-300]="eventForm.get('change_type')?.value === 'both'"
                  class="h-14 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 transition-all hover:border-rose-300"
                >
                  🌊 Both
                </button>
              </div>
            </div>
          }

          <!-- Nap Duration Fields -->
          @if (evt.type === 'nap') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="flex flex-col">
                <label
                  [for]="'napStart-' + evt.id"
                  class="text-base font-semibold text-slate-900 mb-2"
                >
                  Nap Start
                </label>
                <input
                  [id]="'napStart-' + evt.id"
                  type="datetime-local"
                  formControlName="napped_at"
                  class="h-12 px-4 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div class="flex flex-col">
                <label
                  [for]="'napEnd-' + evt.id"
                  class="text-base font-semibold text-slate-900 mb-2"
                >
                  Nap End (optional)
                </label>
                <input
                  [id]="'napEnd-' + evt.id"
                  type="datetime-local"
                  formControlName="ended_at"
                  class="h-12 px-4 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </div>
          }

          <!-- Notes -->
          <div class="flex flex-col">
            <label [for]="'notes-' + evt.id" class="text-base font-semibold text-slate-900 mb-2">
              Notes (optional)
            </label>
            <textarea
              [id]="'notes-' + evt.id"
              formControlName="notes"
              rows="2"
              class="px-4 py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="Add any notes about this event..."
            ></textarea>
          </div>

          <!-- Validation Errors -->
          @if (validationErrors().length > 0) {
            <div class="bg-red-50 border-2 border-red-200 rounded-xl p-3">
              <ul class="text-sm text-red-700 space-y-1">
                @for (error of validationErrors(); track error) {
                  <li>• {{ error }}</li>
                }
              </ul>
            </div>
          }
        </form>
      }

      <!-- Action Buttons -->
      @if (!evt.isExisting) {
        <button
          (click)="onDelete()"
          class="w-full h-12 mt-4 border-2 border-red-300 text-red-600 rounded-xl text-base font-semibold hover:bg-red-50 transition-colors"
          [attr.aria-label]="'Delete ' + evt.type + ' event'"
        >
          Remove this activity
        </button>
      }
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
export class EventCard implements OnInit, AfterViewInit {
  // Dependencies
  private dateTimeService = inject(DateTimeService);
  private destroyRef = inject(DestroyRef);

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

  ngOnInit() {
    this.initializeForm();
  }

  ngAfterViewInit() {
    // Subscribe to form changes and emit updates for new events
    if (!this.evt.isExisting) {
      this.eventForm.valueChanges
        .pipe(
          debounceTime(200),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.emitUpdate();
        });
    }
  }

  /**
   * Initialize form with event data.
   */
  private initializeForm() {
    const evt = this.event();
    if (evt && !evt.isExisting && evt.data) {
      const data = evt.data as any;
      if (data.feeding_type) {
        this.eventForm.patchValue({ feeding_type: data.feeding_type }, { emitEvent: false });
      }
      if (data.amount_oz) {
        this.eventForm.patchValue({ amount_oz: data.amount_oz }, { emitEvent: false });
      }
      if (data.duration_minutes) {
        this.eventForm.patchValue({ duration_minutes: data.duration_minutes }, { emitEvent: false });
      }
      if (data.side) {
        this.eventForm.patchValue({ side: data.side }, { emitEvent: false });
      }
      if (data.change_type) {
        this.eventForm.patchValue({ change_type: data.change_type }, { emitEvent: false });
      }
      if (data.napped_at) {
        const localTime = this.dateTimeService.toInputFormat(new Date(data.napped_at));
        this.eventForm.patchValue({ napped_at: localTime }, { emitEvent: false });
      }
      if (data.ended_at) {
        const localTime = this.dateTimeService.toInputFormat(new Date(data.ended_at));
        this.eventForm.patchValue({ ended_at: localTime }, { emitEvent: false });
      }
      if (data.notes) {
        this.eventForm.patchValue({ notes: data.notes }, { emitEvent: false });
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
   * Toggle expand/collapse state (for existing events only).
   */
  toggleExpand() {
    if (this.evt.isExisting) {
      this.isExpanded.update((v) => !v);
    }
  }

  /**
   * Set feeding type and update validators.
   */
  setFeedingType(type: 'bottle' | 'breast') {
    this.eventForm.patchValue({ feeding_type: type });
    this.updateFeedingValidators(type);
  }

  /**
   * Set diaper type.
   */
  setDiaperType(type: 'wet' | 'dirty' | 'both') {
    this.eventForm.patchValue({ change_type: type });
  }

  /**
   * Update feeding validators based on type.
   */
  private updateFeedingValidators(feedingType: string) {
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
   * Emit update with current form data.
   */
  private emitUpdate() {
    const data = this.buildEventData();
    this.onUpdate.emit({
      isPinned: false,
      data,
    });
  }

  /**
   * Build event data from form values.
   */
  private buildEventData(): any {
    const formValue = this.eventForm.value;

    switch (this.evt.type) {
      case 'feeding':
        return {
          feeding_type: formValue.feeding_type,
          amount_oz: formValue.amount_oz,
          duration_minutes: formValue.duration_minutes,
          side: formValue.side,
          notes: formValue.notes,
        };
      case 'diaper':
        return {
          change_type: formValue.change_type,
          notes: formValue.notes,
        };
      case 'nap':
        return {
          napped_at: formValue.napped_at ? new Date(formValue.napped_at).toISOString() : undefined,
          ended_at: formValue.ended_at ? new Date(formValue.ended_at).toISOString() : undefined,
          notes: formValue.notes,
        };
      default:
        return {};
    }
  }

  /**
   * Delete event (no toast here - parent handles feedback).
   */
  onDelete() {
    const confirmed = confirm(`Delete this ${this.evt.type} event?`);
    if (confirmed) {
      this.onRemove.emit();
    }
  }
}
