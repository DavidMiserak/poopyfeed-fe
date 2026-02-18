/**
 * EventTimeline Component
 *
 * Displays events in a vertical timeline with:
 * - Visual event cards with drag handles
 * - Quick-add buttons for new events
 * - Event count summary (new, existing, total)
 * - HTML5 native drag-drop reordering (desktop)
 * - Touch-based drag reordering (mobile)
 * - Visual drop indicator line showing target position
 * - Time gap visualization
 * - Empty state handling
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
import { CatchUpEvent } from '../../models';
import { getActivityIcon } from '../../utils/date.utils';

@Component({
  selector: 'app-event-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="event-timeline space-y-4">
      <!-- Summary Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
          <p class="text-sm text-blue-600 font-medium">New Events</p>
          <p class="text-2xl font-bold text-blue-900">{{ newEventCount() }}</p>
        </div>
        <div class="bg-rose-50 rounded-lg p-3 text-center border border-rose-200">
          <p class="text-sm text-rose-600 font-medium">Existing Events</p>
          <p class="text-2xl font-bold text-rose-900">{{ existingEventCount() }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
          <p class="text-sm text-gray-600 font-medium">Total</p>
          <p class="text-2xl font-bold text-gray-900">{{ totalEventCount() }}</p>
        </div>
      </div>

      <!-- Quick-Add Buttons -->
      <div class="flex flex-wrap gap-2 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <button
          (click)="addEventHandler('feeding')"
          [disabled]="!canAddEvent()"
          class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          [attr.aria-label]="canAddEvent() ? 'Add feeding event' : 'Cannot add more events (limit reached)'"
        >
          🍼 Feeding
        </button>
        <button
          (click)="addEventHandler('diaper')"
          [disabled]="!canAddEvent()"
          class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          [attr.aria-label]="canAddEvent() ? 'Add diaper event' : 'Cannot add more events (limit reached)'"
        >
          💧 Diaper
        </button>
        <button
          (click)="addEventHandler('nap')"
          [disabled]="!canAddEvent()"
          class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          [attr.aria-label]="canAddEvent() ? 'Add nap event' : 'Cannot add more events (limit reached)'"
        >
          😴 Nap
        </button>
      </div>

      <!-- Events Timeline -->
      @if (events().length > 0) {
        <div
          class="timeline space-y-2"
          (drop)="onDrop($event)"
          (dragover)="onDragOver($event)"
          (dragleave)="onContainerDragLeave($event)"
          [class.bg-blue-50]="isDraggingOver()"
          [class.rounded-lg]="isDraggingOver()"
          [class.p-4]="isDraggingOver()"
          [class.border-2]="isDraggingOver()"
          [class.border-dashed]="isDraggingOver()"
          [class.border-blue-400]="isDraggingOver()"
          role="region"
          aria-label="Events timeline"
        >
          @for (event of events(); track event.id; let idx = $index) {
            <!-- Drop indicator line -->
            @if (dragOverIndex() === idx && draggedIndex() !== idx) {
              <div class="h-1 bg-blue-400 rounded-full mx-2 my-1" aria-hidden="true"></div>
            }

            <div
              class="event-item flex gap-3"
              draggable="true"
              (dragstart)="onDragStart($event, idx)"
              (dragend)="onDragEnd()"
              (dragenter)="onDragEnter($event, idx)"
              (dragleave)="onDragLeave($event, idx)"
              (touchstart)="onTouchStart($event, idx)"
              (touchmove)="onTouchMove($event)"
              (touchend)="onTouchEnd()"
              role="article"
            >
              <!-- Timeline Connector -->
              <div class="flex flex-col items-center">
                <!-- Dot -->
                <div
                  class="w-3 h-3 rounded-full border-2 mt-2"
                  [class.bg-blue-500]="!event.isExisting"
                  [class.border-blue-500]="!event.isExisting"
                  [class.bg-rose-500]="event.isExisting"
                  [class.border-rose-500]="event.isExisting"
                ></div>
                <!-- Line to next event -->
                @if (idx < events().length - 1) {
                  <div
                    class="w-0.5 flex-1 my-1"
                    [class.bg-gray-300]="event.isExisting && events()[idx + 1].isExisting"
                    [class.bg-blue-200]="!event.isExisting && !events()[idx + 1].isExisting"
                    [class.bg-gradient-to-b]="(event.isExisting && !events()[idx + 1].isExisting) || (!event.isExisting && events()[idx + 1].isExisting)"
                    [class.from-rose-200]="event.isExisting && !events()[idx + 1].isExisting"
                    [class.to-blue-200]="event.isExisting && !events()[idx + 1].isExisting"
                    [class.from-blue-200]="!event.isExisting && events()[idx + 1].isExisting"
                    [class.to-rose-200]="!event.isExisting && events()[idx + 1].isExisting"
                  ></div>
                }
              </div>

              <!-- Event Trigger -->
              <button
                class="flex-1 text-left p-3 rounded-lg border transition-all cursor-move active:cursor-grabbing"
                [class.bg-blue-50]="!event.isExisting"
                [class.border-blue-200]="!event.isExisting"
                [class.hover:border-blue-400]="!event.isExisting"
                [class.bg-rose-50]="event.isExisting"
                [class.border-rose-200]="event.isExisting"
                [class.hover:border-rose-400]="event.isExisting"
                (click)="selectEventHandler(event.id)"
                [attr.aria-label]="event.type + ' event at ' + event.estimatedTime"
              >
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ getActivityIcon(event.type) }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 capitalize">{{ event.type }}</p>
                    <p class="text-sm text-gray-600">{{ formatTime(event.estimatedTime) }}</p>
                  </div>
                  @if (event.isPinned) {
                    <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium" title="Time manually pinned">
                      📌 Pinned
                    </span>
                  }
                </div>
              </button>
            </div>
          }
        </div>
      } @else {
        <!-- Empty State -->
        <div class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p class="text-lg font-semibold text-gray-900 mb-2">No events yet</p>
          <p class="text-gray-600 mb-4">Add events using the buttons above to get started</p>
          <p class="text-sm text-gray-500">(Maximum {{ maxEvents }} events per batch)</p>
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
  readonly maxEvents = 20;

  // State
  isDraggingOver = signal(false);
  draggedIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);
  touchStartY = signal<number | null>(null);

  // Computed
  newEventCount = computed(() => this.events().filter((e) => !e.isExisting).length);
  existingEventCount = computed(() => this.events().filter((e) => e.isExisting).length);
  totalEventCount = computed(() => this.events().length);
  canAddEvent = computed(() => this.totalEventCount() < this.maxEvents);

  // Helpers
  getActivityIcon = getActivityIcon;

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
   * Handle drag start.
   */
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  /**
   * Handle drag enter on individual event items to track drop target.
   */
  onDragEnter(event: DragEvent, index: number) {
    event.preventDefault();
    this.dragOverIndex.set(index);
  }

  /**
   * Handle drag leave on individual event items.
   */
  onDragLeave(event: DragEvent, index: number) {
    // Clear dragOverIndex if leaving this specific item
    if (this.dragOverIndex() === index) {
      this.dragOverIndex.set(null);
    }
  }

  /**
   * Handle drag end.
   */
  onDragEnd() {
    this.isDraggingOver.set(false);
    this.dragOverIndex.set(null);
  }

  /**
   * Handle drag over.
   */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDraggingOver.set(true);
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * Handle drag leave from the timeline container.
   */
  onContainerDragLeave(event: DragEvent) {
    // Only hide if leaving the container entirely
    if ((event.target as HTMLElement).classList.contains('timeline')) {
      this.isDraggingOver.set(false);
    }
  }

  /**
   * Handle drop.
   */
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDraggingOver.set(false);

    const sourceIndex = Number(event.dataTransfer?.getData('text/plain') ?? '-1');
    const targetIndex = this.dragOverIndex() ?? sourceIndex;

    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      this.dragOverIndex.set(null);
      this.draggedIndex.set(null);
      return;
    }

    // Create reordered list
    const reordered = [...this.events()];
    const [draggedEvent] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, draggedEvent);

    this.onReorderEvents.emit(reordered);
    this.draggedIndex.set(null);
    this.dragOverIndex.set(null);
  }

  /**
   * Handle touch start on event item (mobile drag support).
   */
  onTouchStart(event: TouchEvent, index: number) {
    event.preventDefault();
    this.draggedIndex.set(index);
    this.isDraggingOver.set(true);
    this.touchStartY.set(event.touches[0]?.clientY ?? null);
  }

  /**
   * Handle touch move on event item to determine drop target (mobile drag support).
   */
  onTouchMove(event: TouchEvent) {
    event.preventDefault();

    const draggedIdx = this.draggedIndex();
    if (draggedIdx === null) return;

    const currentY = event.touches[0]?.clientY ?? 0;
    const timeline = document.querySelector('.timeline') as HTMLElement;
    if (!timeline) return;

    // Find which event item is currently under the touch point
    const eventItems = timeline.querySelectorAll('.event-item');
    let foundTarget = false;

    eventItems.forEach((item, idx) => {
      const rect = item.getBoundingClientRect();

      // Check if touch is over this item (with some margin for easier targeting)
      if (currentY >= rect.top - 30 && currentY <= rect.bottom + 30) {
        if (idx !== draggedIdx) {
          this.dragOverIndex.set(idx);
          foundTarget = true;
        }
      }
    });

    // If no valid target found, clear dragOverIndex
    if (!foundTarget) {
      this.dragOverIndex.set(null);
    }
  }

  /**
   * Handle touch end to complete reordering (mobile drag support).
   */
  onTouchEnd() {
    const sourceIndex = this.draggedIndex();
    const targetIndex = this.dragOverIndex();

    this.isDraggingOver.set(false);
    this.touchStartY.set(null);

    if (
      sourceIndex === null ||
      targetIndex === null ||
      sourceIndex === targetIndex
    ) {
      this.draggedIndex.set(null);
      this.dragOverIndex.set(null);
      return;
    }

    // Create reordered list
    const reordered = [...this.events()];
    const [draggedEvent] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, draggedEvent);

    this.onReorderEvents.emit(reordered);
    this.draggedIndex.set(null);
    this.dragOverIndex.set(null);
  }
}
