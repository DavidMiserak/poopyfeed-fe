/**
 * Catch-Up Mode main component.
 *
 * 3-step wizard for Maria (caretaker persona):
 * Step 1: Choose Time Range → Step 2: Add Activities → Step 3: Review & Save → Success
 *
 * Orchestrates catch-up session with smart time estimation. Supports editing,
 * reordering, and batch submission. Optimized for quick data entry with large buttons
 * and preset-first UX.
 *
 * Features:
 * - 3-step linear wizard (time range → activities → review)
 * - Automatic proportional time spacing for new events
 * - Simple arrow buttons for reordering (no drag-drop)
 * - Batch submission with per-event error highlighting
 * - Success screen with summary
 */

import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import {
  CatchUpEvent,
  TimeWindow,
  CATCH_UP_VALIDATION,
  Child,
  Feeding,
  DiaperChange,
  Nap,
} from '../../models';
import { TimeEstimationService } from '../../services/time-estimation.service';
import { BatchesService } from '../../services/batches.service';
import { ChildrenService } from '../../services/children.service';
import { FeedingsService } from '../../services/feedings.service';
import { DiapersService } from '../../services/diapers.service';
import { NapsService } from '../../services/naps.service';
import { DateTimeService } from '../../services/datetime.service';
import { ToastService } from '../../services/toast.service';
import { ErrorHandler } from '../../services/error.utils';
import { getActivityIcon } from '../../utils/date.utils';
import { TimeWindowSelector } from './time-window-selector';
import { EventTimeline } from './event-timeline';
import { EventCard } from './event-card';

@Component({
  selector: 'app-catch-up',
  imports: [CommonModule, TimeWindowSelector, EventTimeline, EventCard],
  template: `
    <div class="catch-up-container min-h-screen bg-amber-50/30 px-4 py-6">
      <!-- Loading state -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      }

      <!-- Error state -->
      @if (error()) {
        <div class="max-w-3xl mx-auto bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
          <h3 class="font-bold text-red-900 mb-2 text-lg">Error</h3>
          <p class="text-red-700">{{ error() }}</p>
        </div>
      }

      <!-- Main content -->
      @if (!isLoading() && !error()) {
        <!-- Header -->
        <div class="max-w-3xl mx-auto mb-8">
          <h1 class="text-3xl font-bold text-slate-900 mb-2">
            Catch-Up Mode: {{ child()?.name }}
          </h1>
          <p class="text-slate-600">
            Quick log of {{ currentStepLabel() }}
          </p>
        </div>

        <!-- Step Indicator (hidden on success) -->
        @if (currentStep() !== 'success') {
          <div class="max-w-3xl mx-auto mb-8">
            <div class="flex gap-2 justify-center">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all"
                [class.bg-rose-500]="currentStep() === 'time-range'"
                [class.bg-slate-200]="currentStep() !== 'time-range'"
              >
                1
              </div>
              <div class="w-px bg-slate-300"></div>
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all"
                [class.bg-rose-500]="currentStep() === 'events'"
                [class.bg-slate-200]="currentStep() !== 'events'"
              >
                2
              </div>
              <div class="w-px bg-slate-300"></div>
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all"
                [class.bg-rose-500]="currentStep() === 'review'"
                [class.bg-slate-200]="currentStep() !== 'review'"
              >
                3
              </div>
            </div>
          </div>
        }

        <!-- Step 1: Time Range -->
        @if (currentStep() === 'time-range') {
          <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8 border border-slate-100">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Step 1: Choose Time Window</h2>
            <app-time-window-selector
              [timeWindow]="timeWindow()"
              (onTimeWindowChange)="goToStep('events', $event)"
            />
            <button
              (click)="onCancel()"
              class="w-full mt-6 h-12 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        }

        <!-- Step 2: Add Activities -->
        @if (currentStep() === 'events') {
          <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8 border border-slate-100">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Step 2: Add Activities</h2>
            <app-event-timeline
              [events]="eventList()"
              (onAddEvent)="onAddEvent($event)"
              (onSelectEvent)="selectedEventId.set($event)"
              (onReorderEvents)="onReorderEvents($event)"
            />

            <!-- Event Details (when selected) -->
            @if (selectedEventId(); as eventId) {
              @if (getEventById(eventId); as event) {
                <div class="mt-6 pt-6 border-t-2 border-slate-100">
                  <h3 class="text-lg font-bold text-slate-900 mb-4">Edit Activity</h3>
                  <app-event-card
                    [event]="event"
                    (onUpdate)="onUpdateEvent(eventId, $event)"
                    (onRemove)="onRemoveEvent(eventId)"
                  />
                  <button
                    (click)="selectedEventId.set(null)"
                    class="w-full mt-4 h-12 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                  >
                    Close Editor
                  </button>
                </div>
              }
            }

            <!-- Navigation -->
            <div class="flex gap-4 mt-6 pt-6 border-t-2 border-slate-100">
              <button
                (click)="goToStep('time-range')"
                class="flex-1 h-12 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                (click)="goToStep('review')"
                [disabled]="!hasChanges()"
                class="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review {{ newEvents().length }} Activities
              </button>
            </div>
          </div>
        }

        <!-- Step 3: Review & Save -->
        @if (currentStep() === 'review') {
          <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8 border border-slate-100">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Step 3: Review & Save</h2>
            <p class="text-slate-700 mb-6">
              Ready to save {{ newEvents().length }} activit{{ newEvents().length === 1 ? 'y' : 'ies' }}?
            </p>

            <!-- Summary List -->
            <div class="space-y-3 mb-8">
              @for (event of newEvents(); track event.id) {
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ getActivityIcon(event.type) }}</span>
                    <div class="flex-1">
                      <p class="font-semibold text-slate-900 capitalize">{{ event.type }}</p>
                      <p class="text-sm text-slate-600">{{ formatTime(event.estimatedTime) }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Navigation -->
            <div class="flex gap-4 pt-6 border-t-2 border-slate-100">
              <button
                (click)="goToStep('events')"
                [disabled]="isSubmitting()"
                class="flex-1 h-12 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                (click)="onSubmit()"
                [disabled]="isSubmitting()"
                [attr.aria-busy]="isSubmitting()"
                class="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isSubmitting()) {
                  <span class="inline-block animate-spin mr-2">⏳</span>
                  Saving...
                } @else {
                  Confirm & Save
                }
              </button>
            </div>
          </div>
        }

        <!-- Step 4: Success -->
        @if (currentStep() === 'success') {
          <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8 border border-slate-100 text-center">
            <div class="text-5xl mb-4">✅</div>
            <h2 class="text-3xl font-bold text-slate-900 mb-2">
              {{ newEvents().length }} Activit{{ newEvents().length === 1 ? 'y' : 'ies' }} Saved!
            </h2>
            <p class="text-lg text-slate-600 mb-8">
              Great work logging for {{ child()?.name }}. Everything is saved.
            </p>

            <!-- Summary -->
            <div class="bg-amber-50 rounded-xl p-6 border-2 border-amber-100 mb-8 text-left">
              <p class="text-sm font-semibold text-slate-900 mb-4">What was saved:</p>
              <div class="space-y-2">
                @for (event of newEvents(); track event.id) {
                  <div class="flex items-center gap-2 text-slate-700">
                    <span>{{ getActivityIcon(event.type) }}</span>
                    <span class="capitalize">{{ event.type }}</span>
                    <span class="text-slate-500">{{ formatTime(event.estimatedTime) }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Done Button -->
            <button
              (click)="navigateToDashboard()"
              class="w-full h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-lg"
            >
              Back to {{ child()?.name }}'s Dashboard
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .catch-up-container {
        min-height: 100vh;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatchUp implements OnInit {
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private childrenService: ChildrenService = inject(ChildrenService);
  private feedingsService: FeedingsService = inject(FeedingsService);
  private diapersService: DiapersService = inject(DiapersService);
  private napsService: NapsService = inject(NapsService);
  private timeEstimationService: TimeEstimationService = inject(TimeEstimationService);
  private batchesService: BatchesService = inject(BatchesService);
  private dateTimeService: DateTimeService = inject(DateTimeService);
  private toast: ToastService = inject(ToastService);

  // ✅ UI State
  isLoading = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  selectedEventId = signal<string | null>(null);
  currentStep = signal<'time-range' | 'events' | 'review' | 'success'>('time-range');

  // ✅ Data Model
  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  timeWindow = signal<TimeWindow>({
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
  });
  eventList = signal<CatchUpEvent[]>([]);
  newEventCounter = signal(0);

  // ✅ Derived State (Computed Signals)
  newEvents = computed(() =>
    this.eventList().filter((e) => !e.isExisting),
  );
  existingEvents = computed(() =>
    this.eventList().filter((e) => e.isExisting),
  );
  canAddEvent = computed(() =>
    this.newEvents().length < CATCH_UP_VALIDATION.MAX_EVENTS_PER_BATCH,
  );
  totalEventCount = computed(() => this.eventList().length);
  hasChanges = computed(() => this.newEvents().length > 0);
  currentStepLabel = computed(() => {
    switch (this.currentStep()) {
      case 'time-range':
        return 'time window';
      case 'events':
        return `${this.newEvents().length} activit${this.newEvents().length === 1 ? 'y' : 'ies'}`;
      case 'review':
        return 'review';
      case 'success':
        return 'done';
      default:
        return '';
    }
  });

  // ✅ Helpers
  getActivityIcon = getActivityIcon;

  /**
   * Get event by ID from event list.
   */
  getEventById(eventId: string): CatchUpEvent | undefined {
    return this.eventList().find((e) => e.id === eventId);
  }

  ngOnInit() {
    this.initialize();
  }

  /**
   * Initialize the catch-up component.
   *
   * Sequence:
   * 1. Extract childId from route params
   * 2. Fetch child profile
   * 3. Load existing events in default time window
   * 4. Initialize empty event list
   */
  private initialize() {
    const childId = this.route.snapshot.paramMap.get('childId');
    if (!childId || isNaN(+childId)) {
      this.error.set('Invalid child ID');
      return;
    }

    this.childId.set(+childId);
    this.isLoading.set(true);

    // Load child profile and existing events in parallel
    forkJoin({
      child: this.childrenService.get(+childId),
      feedings: this.feedingsService.list(+childId),
      diapers: this.diapersService.list(+childId),
      naps: this.napsService.list(+childId),
    })
      .pipe(
        tap(({ child, feedings, diapers, naps }: any) => {
          this.child.set(child);
          const existingEvents = this.buildExistingEvents(
            feedings,
            diapers,
            naps,
          );
          this.eventList.set(existingEvents);
          this.isLoading.set(false);
        }),
        catchError((err: any) => {
          const apiError = ErrorHandler.handle(err);
          this.error.set(apiError.message);
          this.isLoading.set(false);
          return throwError(() => apiError);
        }),
      )
      .subscribe();
  }

  /**
   * Convert API event objects to CatchUpEvent format (read-only existing events).
   */
  private buildExistingEvents(
    feedings: Feeding[],
    diapers: DiaperChange[],
    naps: Nap[],
  ): CatchUpEvent[] {
    const events: CatchUpEvent[] = [];

    // Add existing feedings
    feedings.forEach((feeding) => {
      events.push({
        id: `existing-feeding-${feeding.id}`,
        type: 'feeding',
        estimatedTime: feeding.fed_at,
        isPinned: true, // Existing events are pinned
        isExisting: true,
        existingId: feeding.id,
        data: {
          feeding_type: feeding.feeding_type,
          fed_at: feeding.fed_at,
          amount_oz: feeding.amount_oz,
          duration_minutes: feeding.duration_minutes,
          side: feeding.side,
          notes: feeding.notes,
        },
      });
    });

    // Add existing diapers
    diapers.forEach((diaper) => {
      events.push({
        id: `existing-diaper-${diaper.id}`,
        type: 'diaper',
        estimatedTime: diaper.changed_at,
        isPinned: true,
        isExisting: true,
        existingId: diaper.id,
        data: {
          change_type: diaper.change_type,
          changed_at: diaper.changed_at,
          notes: diaper.notes,
        },
      });
    });

    // Add existing naps
    naps.forEach((nap) => {
      events.push({
        id: `existing-nap-${nap.id}`,
        type: 'nap',
        estimatedTime: nap.napped_at,
        isPinned: true,
        isExisting: true,
        existingId: nap.id,
        data: {
          napped_at: nap.napped_at,
          ended_at: nap.ended_at ?? undefined,
        },
      });
    });

    return events.sort(
      (a, b) =>
        new Date(a.estimatedTime).getTime() -
        new Date(b.estimatedTime).getTime(),
    );
  }

  /**
   * Add a new event of the specified type with auto-calculated timestamp.
   */
  onAddEvent(type: 'feeding' | 'diaper' | 'nap') {
    if (!this.canAddEvent()) {
      this.toast.warning(
        'Maximum 20 events per session. Submit these first, then start a new session.',
      );
      return;
    }

    this.newEventCounter.update((c) => c + 1);
    const newEvent: CatchUpEvent = {
      id: `event-${type}-${this.newEventCounter()}`,
      type,
      estimatedTime: new Date().toISOString(),
      isPinned: false,
      isExisting: false,
      data: this.getDefaultDataForType(type),
    };

    this.eventList.update((events) => [...events, newEvent]);
    this.recalculateTimes();
  }

  /**
   * Get default data object for a new event type.
   */
  private getDefaultDataForType(
    type: 'feeding' | 'diaper' | 'nap',
  ): CatchUpEvent['data'] {
    switch (type) {
      case 'feeding':
        return {
          feeding_type: 'bottle',
          fed_at: new Date().toISOString(),
        };
      case 'diaper':
        return {
          change_type: 'wet',
          changed_at: new Date().toISOString(),
        };
      case 'nap':
        return {
          napped_at: new Date().toISOString(),
          ended_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
    }
  }

  /**
   * Navigate to a specific step with validation.
   */
  goToStep(
    step: 'time-range' | 'events' | 'review' | 'success',
    timeWindow?: TimeWindow,
  ) {
    if (timeWindow) {
      // Validate before advancing from time-range to events
      const errors = this.timeEstimationService.validateTimeWindow(timeWindow);
      if (errors.length > 0) {
        errors.forEach((err: string) => this.toast.error(err));
        return;
      }

      this.timeWindow.set(timeWindow);
      this.recalculateTimes();

      // Reload existing events from new time window
      if (this.childId()) {
        this.loadExistingEvents(this.childId()!);
      }
    }

    // Validate before advancing to review
    if (step === 'review' && !this.hasChanges()) {
      this.toast.error('Add at least one activity before reviewing');
      return;
    }

    this.currentStep.set(step);
  }

  /**
   * Format time for display.
   */
  formatTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return 'Invalid time';
    }
  }

  /**
   * Remove an event from the timeline (no toast - keep simple).
   */
  onRemoveEvent(eventId: string) {
    this.eventList.update((events) => events.filter((e) => e.id !== eventId));
    this.recalculateTimes();
  }

  /**
   * Update an event with new data from form changes.
   */
  onUpdateEvent(eventId: string, updates: Partial<CatchUpEvent>) {
    this.eventList.update((events) =>
      events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
    );

    if (updates.isPinned || updates.estimatedTime) {
      this.recalculateTimes();
    }
  }

  /**
   * Reorder events after move up/down buttons.
   */
  onReorderEvents(reorderedList: CatchUpEvent[]) {
    this.eventList.set(reorderedList);
    this.recalculateTimes();
  }

  /**
   * Load existing events from API for the current time window.
   */
  private loadExistingEvents(childId: number) {
    forkJoin({
      feedings: this.feedingsService.list(childId),
      diapers: this.diapersService.list(childId),
      naps: this.napsService.list(childId),
    })
      .pipe(
        tap(({ feedings, diapers, naps }: any) => {
          const existingEvents = this.buildExistingEvents(
            feedings,
            diapers,
            naps,
          );
          const newEvents = this.eventList().filter((e) => !e.isExisting);
          this.eventList.set([...existingEvents, ...newEvents]);
        }),
        catchError((err: any) => {
          const apiError = ErrorHandler.handle(err);
          this.toast.error(`Failed to reload events: ${apiError.message}`);
          return throwError(() => apiError);
        }),
      )
      .subscribe();
  }

  /**
   * Recalculate event times using proportional distribution algorithm.
   */
  private recalculateTimes() {
    const result: any = this.timeEstimationService.estimateEventTimes(
      this.eventList(),
      this.timeWindow(),
    );

    this.eventList.set(result.events);

    if (result.isOverflowed) {
      this.toast.warning(
        'Some events may not fit perfectly in the selected time window',
      );
    }
  }

  /**
   * Submit all new events as a batch to the backend.
   */
  onSubmit() {
    if (!this.hasChanges()) {
      this.toast.error('Add at least one activity before saving');
      return;
    }

    this.isSubmitting.set(true);

    this.batchesService
      .create(this.childId()!, this.newEvents())
      .pipe(
        tap((response: any) => {
          // Show success screen instead of navigating immediately
          this.currentStep.set('success');
          this.isSubmitting.set(false);
        }),
        catchError((err: any) => {
          this.isSubmitting.set(false);

          // Handle batch validation errors
          if (err.batchErrors?.errors) {
            err.batchErrors.errors.forEach((eventError: any) => {
              const errorMsg = Object.entries(eventError.errors)
                .map(([field, msgs]) =>
                  Array.isArray(msgs) ? msgs[0] : msgs,
                )
                .join('; ');
              this.toast.error(
                `Activity ${eventError.index + 1} (${eventError.type}): ${errorMsg}`,
              );
            });
          } else {
            this.toast.error(
              'Failed to save activities. Your data is preserved — please try again.',
            );
          }

          // Return empty observable to complete the stream gracefully
          return of([]);
        }),
      )
      .subscribe();
  }

  /**
   * Navigate back to child dashboard from success screen.
   */
  navigateToDashboard() {
    this.router.navigate(['/children', this.childId(), 'dashboard']);
  }

  /**
   * Cancel the catch-up session (with confirmation on step 2).
   */
  onCancel() {
    if (this.currentStep() === 'events' && this.hasChanges()) {
      const confirmed = confirm(
        `Discard ${this.newEvents().length} unsaved activit${this.newEvents().length === 1 ? 'y' : 'ies'}?`,
      );
      if (!confirmed) {
        return;
      }
    }

    this.router.navigate(['/children', this.childId(), 'dashboard']);
  }
}
