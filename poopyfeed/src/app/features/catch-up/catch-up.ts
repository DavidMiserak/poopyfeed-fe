/**
 * Catch-Up Mode main component.
 *
 * Orchestrates the entire catch-up session where caregivers log multiple events
 * with smart time estimation and drag-and-drop reordering. Manages time window,
 * event lifecycle, and atomic batch submission to the backend.
 *
 * Features:
 * - Time window selection with validation (4-hour default, max 24 hours)
 * - Automatic proportional time spacing for new events
 * - Drag-and-drop reordering with time recalculation
 * - Support for event pinning (manual time overrides)
 * - Batch submission with per-event error highlighting
 * - Existing events as read-only anchors
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
import { forkJoin, throwError } from 'rxjs';
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

@Component({
  selector: 'app-catch-up',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="catch-up-container max-w-4xl mx-auto px-4 py-8">
      <!-- Loading state -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        </div>
      }

      <!-- Error state -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 class="font-semibold text-red-900 mb-2">Error</h3>
          <p class="text-red-700">{{ error() }}</p>
        </div>
      }

      <!-- Main content -->
      @if (!isLoading() && !error()) {
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            Catch-Up Mode: {{ child()?.name }}
          </h1>
          <p class="text-gray-600">
            Log multiple activities at once with smart time estimation
          </p>
        </div>

        <!-- Time Window Section (placeholder for child component) -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Time Window</h2>
          <p class="text-gray-600 text-sm">
            Time window selector component will be rendered here (Phase 3)
          </p>
          <p class="text-xs text-gray-500 mt-2">
            Current window: {{ timeWindow().startTime | date: 'short' }} to
            {{ timeWindow().endTime | date: 'short' }}
          </p>
        </div>

        <!-- Event Timeline Section (placeholder for child component) -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Events ({{ eventList().length }})
          </h2>
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-rose-600">{{ newEvents().length }}</div>
              <div class="text-sm text-gray-600">New Events</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ existingEvents().length }}</div>
              <div class="text-sm text-gray-600">Existing Events</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ totalEventCount() }}</div>
              <div class="text-sm text-gray-600">Total</div>
            </div>
          </div>
          <p class="text-gray-600 text-sm">
            Event timeline component will be rendered here (Phase 3)
          </p>
        </div>

        <!-- Add Event Actions (placeholder for child component) -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Add Event</h2>
          <div class="flex gap-2">
            <button
              (click)="onAddEvent('feeding')"
              [disabled]="!canAddEvent()"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Feeding
            </button>
            <button
              (click)="onAddEvent('diaper')"
              [disabled]="!canAddEvent()"
              class="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Diaper
            </button>
            <button
              (click)="onAddEvent('nap')"
              [disabled]="!canAddEvent()"
              class="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Nap
            </button>
          </div>
          @if (!canAddEvent()) {
            <p class="text-sm text-red-600 mt-3">
              Maximum 20 events per session. Submit these first, then start a new session.
            </p>
          }
        </div>

        <!-- Form Actions -->
        <div class="flex gap-4 justify-between">
          <button
            (click)="onCancel()"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            (click)="onSubmit()"
            [disabled]="!hasChanges() || isSubmitting()"
            [attr.aria-busy]="isSubmitting()"
            class="px-6 py-2 bg-rose-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (isSubmitting()) {
              <span class="inline-block animate-spin mr-2">⏳</span>
              Saving {{ newEvents().length }} events...
            } @else {
              Save All
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .catch-up-container {
        background-color: #fafafa;
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
   * Remove an event from the timeline.
   */
  onRemoveEvent(eventId: string) {
    this.eventList.update((events) => events.filter((e) => e.id !== eventId));
    this.recalculateTimes();
    this.toast.success('Event removed');
  }

  /**
   * Update an event with new data.
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
   * Reorder events after drag-and-drop.
   */
  onReorderEvents(reorderedList: CatchUpEvent[]) {
    this.eventList.set(reorderedList);
    this.recalculateTimes();
  }

  /**
   * Update time window and reload existing events.
   */
  onTimeWindowChange(newWindow: TimeWindow) {
    const validationErrors =
      this.timeEstimationService.validateTimeWindow(newWindow);

    if (validationErrors.length > 0) {
      validationErrors.forEach((err: string) => this.toast.error(err));
      return;
    }

    this.timeWindow.set(newWindow);
    this.recalculateTimes();

    // Reload existing events from new time window
    if (this.childId()) {
      this.loadExistingEvents(this.childId()!);
    }
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
      this.toast.error('Add at least one event before saving');
      return;
    }

    this.isSubmitting.set(true);

    this.batchesService
      .create(this.childId()!, this.newEvents())
      .pipe(
        tap((response: any) => {
          this.toast.success(
            `${response.count} events saved successfully`,
          );
          this.router.navigate(['/children', this.childId(), 'dashboard']);
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
                `Event ${eventError.index + 1} (${eventError.type}): ${errorMsg}`,
              );
            });
          } else {
            this.toast.error(
              'Failed to save events. Your data is preserved — please try again.',
            );
          }

          return throwError(() => err);
        }),
      )
      .subscribe();
  }

  /**
   * Cancel the catch-up session with confirmation if unsaved changes exist.
   */
  onCancel() {
    if (this.hasChanges()) {
      const confirmed = confirm(
        `Discard ${this.newEvents().length} unsaved event(s)?`,
      );
      if (!confirmed) {
        return;
      }
    }

    this.router.navigate(['/children', this.childId(), 'dashboard']);
  }
}
