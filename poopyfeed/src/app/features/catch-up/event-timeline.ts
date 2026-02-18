/**
 * EventTimeline Component
 *
 * Displays events in a simplified vertical list with:
 * - Visual event cards (no drag-drop)
 * - Arrow buttons for reordering new events
 * - Quick-add buttons for new events
 * - Event count summary (new, existing, total)
 * - Always-visible event cards for new entries
 */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatchUpEvent, CATCH_UP_VALIDATION } from '../../models';
import { getActivityIcon, formatActivityAge } from '../../utils/date.utils';

@Component({
  selector: 'app-event-timeline',
  imports: [CommonModule],
  template: `
    <div class="event-timeline space-y-6">
      <!-- Quick-Add Buttons (Large, Maria-friendly) -->
      <div class="space-y-2">
        <p class="text-sm font-semibold text-slate-900">Add Activity</p>
        <div class="grid grid-cols-3 gap-3">
          <button
            (click)="addEventHandler('feeding')"
            [disabled]="!canAddEvent()"
            class="h-14 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 hover:border-rose-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            [attr.aria-label]="canAddEvent() ? 'Add feeding event' : 'Cannot add more events (limit reached)'"
          >
            🍼 Feeding
          </button>
          <button
            (click)="addEventHandler('diaper')"
            [disabled]="!canAddEvent()"
            class="h-14 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 hover:border-rose-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            [attr.aria-label]="canAddEvent() ? 'Add diaper event' : 'Cannot add more events (limit reached)'"
          >
            💧 Diaper
          </button>
          <button
            (click)="addEventHandler('nap')"
            [disabled]="!canAddEvent()"
            class="h-14 bg-white border-2 border-slate-200 rounded-xl text-base font-semibold text-slate-900 hover:border-rose-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            [attr.aria-label]="canAddEvent() ? 'Add nap event' : 'Cannot add more events (limit reached)'"
          >
            😴 Nap
          </button>
        </div>
      </div>

      <!-- Events List -->
      @if (events().length > 0) {
        <div class="space-y-3" role="region" aria-label="Activities list">
          @for (event of events(); track event.id; let idx = $index) {
            <div class="flex gap-3 items-start">
              <!-- Reorder Controls (new events only) -->
              @if (!event.isExisting) {
                <div class="flex flex-col gap-1 pt-2">
                  <button
                    (click)="moveEventUp(idx)"
                    [disabled]="idx === 0"
                    class="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    [attr.aria-label]="'Move ' + event.type + ' up'"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    (click)="moveEventDown(idx)"
                    [disabled]="idx === events().length - 1"
                    class="w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    [attr.aria-label]="'Move ' + event.type + ' down'"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              }

              <!-- Timeline Connector -->
              <div class="flex flex-col items-center pt-1">
                <!-- Dot -->
                <div
                  class="w-3 h-3 rounded-full border-2"
                  [class.bg-rose-500]="event.isExisting"
                  [class.border-rose-500]="event.isExisting"
                  [class.bg-blue-500]="!event.isExisting"
                  [class.border-blue-500]="!event.isExisting"
                ></div>
                <!-- Line to next event -->
                @if (idx < events().length - 1) {
                  <div
                    class="w-0.5 h-16"
                    [class.bg-slate-300]="event.isExisting && events()[idx + 1].isExisting"
                    [class.bg-blue-200]="!event.isExisting && !events()[idx + 1].isExisting"
                    [class.bg-gradient-to-b]="(event.isExisting && !events()[idx + 1].isExisting) || (!event.isExisting && events()[idx + 1].isExisting)"
                    [class.from-rose-200]="event.isExisting && !events()[idx + 1].isExisting"
                    [class.to-blue-200]="event.isExisting && !events()[idx + 1].isExisting"
                    [class.from-blue-200]="!event.isExisting && events()[idx + 1].isExisting"
                    [class.to-rose-200]="!event.isExisting && events()[idx + 1].isExisting"
                  ></div>
                }
              </div>

              <!-- Event Card -->
              <div class="flex-1 min-w-0">
                <button
                  class="w-full text-left p-4 rounded-xl border-2 transition-all"
                  [class.bg-white]="!event.isExisting"
                  [class.border-rose-100]="!event.isExisting"
                  [class.hover:border-rose-300]="!event.isExisting"
                  [class.bg-slate-50]="event.isExisting"
                  [class.border-slate-200]="event.isExisting"
                  [class.opacity-75]="event.isExisting"
                  [class.cursor-not-allowed]="event.isExisting"
                  (click)="selectEventHandler(event.id)"
                  [attr.aria-label]="event.type + ' event at ' + event.estimatedTime + (event.isExisting ? ' (read-only)' : '')"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ getActivityIcon(event.type) }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-slate-900 capitalize text-base">{{ event.type }}</p>
                      <p class="text-sm text-slate-600">
                        @if (event.isExisting) {
                          {{ formatActivityAge(event.estimatedTime) }}
                        } @else {
                          {{ formatTime(event.estimatedTime) }}
                        }
                      </p>
                    </div>
                    @if (event.isExisting) {
                      <span class="text-sm px-2 py-1 bg-slate-200 text-slate-700 rounded-lg font-medium flex-shrink-0" title="Existing event (read-only anchor)">
                        🔒 Locked
                      </span>
                    }
                  </div>
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Empty State -->
        <div class="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <p class="text-lg font-bold text-slate-900 mb-2">No activities yet</p>
          <p class="text-slate-600 mb-4">Tap the buttons above to add activities</p>
          <p class="text-sm text-slate-500">(Max {{ maxEvents }} activities per session)</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .timeline {
        position: relative;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventTimeline {
  // Input/Output
  events = input<CatchUpEvent[]>([]);
  onAddEvent = output<'feeding' | 'diaper' | 'nap'>();
  onSelectEvent = output<string>();
  onReorderEvents = output<CatchUpEvent[]>();

  // Constants
  readonly maxEvents = CATCH_UP_VALIDATION.MAX_EVENTS_PER_BATCH;

  // Computed
  newEventCount = computed(() => this.events().filter((e) => !e.isExisting).length);
  existingEventCount = computed(() => this.events().filter((e) => e.isExisting).length);
  totalEventCount = computed(() => this.events().length);
  // FIX: canAddEvent should count only NEW events toward the limit, not total events
  canAddEvent = computed(() => this.newEventCount() < this.maxEvents);

  // Helpers
  getActivityIcon = getActivityIcon;
  formatActivityAge = formatActivityAge;

  /**
   * Format event time for display.
   */
  formatTime(estimatedTime: string): string {
    try {
      const date = new Date(estimatedTime);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return 'Invalid time';
    }
  }

  /**
   * Handler for add event button clicks.
   */
  addEventHandler(type: 'feeding' | 'diaper' | 'nap') {
    this.onAddEvent.emit(type);
  }

  /**
   * Handler for event selection clicks.
   */
  selectEventHandler(eventId: string) {
    this.onSelectEvent.emit(eventId);
  }

  /**
   * Move event up in the list (new events only).
   */
  moveEventUp(index: number) {
    if (index <= 0) return;
    const reordered = [...this.events()];
    [reordered[index], reordered[index - 1]] = [reordered[index - 1], reordered[index]];
    this.onReorderEvents.emit(reordered);
  }

  /**
   * Move event down in the list (new events only).
   */
  moveEventDown(index: number) {
    if (index >= this.events().length - 1) return;
    const reordered = [...this.events()];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    this.onReorderEvents.emit(reordered);
  }
}
