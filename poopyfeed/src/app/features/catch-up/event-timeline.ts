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
  templateUrl: './event-timeline.html',
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
