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
import { ActivatedRoute } from '@angular/router';
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
  TimeEstimationResult,
  BatchResponse,
  BatchErrorResponse,
  BatchEventError,
} from '../../models';
import { TimeEstimationService } from '../../services/time-estimation.service';
import { BatchesService } from '../../services/batches.service';
import { ChildNavigationService } from '../../services/child-navigation.service';
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
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-catch-up',
  imports: [
    CommonModule,
    TimeWindowSelector,
    EventTimeline,
    EventCard,
    ConfirmDialogComponent,
  ],
  templateUrl: './catch-up.html',
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
  // Component implementation continues below...
  private route: ActivatedRoute = inject(ActivatedRoute);
  private childNav = inject(ChildNavigationService);
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
  showDiscardConfirm = signal(false);

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

    // Load child profile only - events will be loaded after user selects time window
    this.childrenService
      .get(+childId)
      .pipe(
        tap((child: Child) => {
          this.child.set(child);
          this.isLoading.set(false);
        }),
        catchError((err: unknown) => {
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
   * Format time for display (user's profile timezone).
   */
  formatTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return this.dateTimeService.formatTime24h(timestamp);
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
    const timeWindow = this.timeWindow();
    if (!timeWindow) return;

    const filters = {
      dateFrom: timeWindow.startTime,
      dateTo: timeWindow.endTime,
    };

    forkJoin({
      feedings: this.feedingsService.list(childId, filters),
      diapers: this.diapersService.list(childId, filters),
      naps: this.napsService.list(childId, filters),
    })
      .pipe(
        tap(({ feedings, diapers, naps }: { feedings: Feeding[]; diapers: DiaperChange[]; naps: Nap[] }) => {
          const existingEvents = this.buildExistingEvents(
            feedings,
            diapers,
            naps,
          );
          const newEvents = this.eventList().filter((e) => !e.isExisting);
          this.eventList.set([...existingEvents, ...newEvents]);
        }),
        catchError((err: unknown) => {
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
    const result: TimeEstimationResult = this.timeEstimationService.estimateEventTimes(
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
        tap((_response: BatchResponse) => {
          // Show success screen instead of navigating immediately
          this.currentStep.set('success');
          this.isSubmitting.set(false);
        }),
        catchError((err: unknown) => {
          this.isSubmitting.set(false);

          const batchErrors = err && typeof err === 'object' && 'batchErrors' in err
            ? (err as { batchErrors?: BatchErrorResponse }).batchErrors
            : undefined;

          if (batchErrors?.errors) {
            batchErrors.errors.forEach((eventError: BatchEventError) => {
              const errorMsg = Object.entries(eventError.errors)
                .map(([_, msgs]) =>
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
   * Navigate back to child advanced tools from success screen.
   */
  goToAdvanced() {
    const id = this.childId();
    if (id !== null) this.childNav.goToAdvanced(id);
  }

  /**
   * Cancel the catch-up session (with confirmation on step 2 if unsaved changes).
   */
  onCancel() {
    if (this.currentStep() === 'events' && this.hasChanges()) {
      this.showDiscardConfirm.set(true);
      return;
    }
    const id = this.childId();
    if (id !== null) this.childNav.goToAdvanced(id);
  }

  onDiscardConfirm() {
    this.showDiscardConfirm.set(false);
    const id = this.childId();
    if (id !== null) this.childNav.goToAdvanced(id);
  }

  onDiscardCancel() {
    this.showDiscardConfirm.set(false);
  }
}
