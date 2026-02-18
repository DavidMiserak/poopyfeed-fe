/**
 * Service for calculating event timestamps within a time window.
 *
 * The Time Estimation Service uses proportional distribution to automatically
 * calculate timestamps for events based on their typical durations. This gives
 * caregivers a reasonable starting point while allowing manual overrides.
 *
 * Algorithm (O(n) complexity):
 * 1. Calculate total typical duration of all new events
 * 2. Calculate remaining gap time: window duration - total typical duration
 * 3. Distribute gap time evenly as buffer between events
 * 4. Assign each event a start time = previous end + gap portion
 * 5. Detect overflow (durations exceed window) and compress proportionally
 * 6. Skip pinned events during recalculation (they stay fixed)
 *
 * Typical durations (configurable):
 * - Feeding: 20 minutes
 * - Diaper: 5 minutes
 * - Nap: 60 minutes
 * - Minimum gap: 2 minutes
 */

import { Injectable } from '@angular/core';
import {
  CatchUpEvent,
  TimeWindow,
  TimeEstimationConfig,
  TimeEstimationResult,
  DEFAULT_TIME_ESTIMATION_CONFIG,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TimeEstimationService {
  /**
   * Estimate timestamps for all events in a time window.
   *
   * @param events - Array of events (mix of new and existing)
   * @param window - Time window boundaries (start and end)
   * @param config - Optional configuration (defaults to DEFAULT_TIME_ESTIMATION_CONFIG)
   * @returns TimeEstimationResult with calculated events and overflow flag
   *
   * @example
   * const result = this.timeEstimation.estimateEventTimes(events, window);
   * const updatedEvents = result.events;
   * if (result.isOverflowed) {
   *   this.toast.warning('Events may not fit in the selected time window');
   * }
   */
  estimateEventTimes(
    events: CatchUpEvent[],
    window: TimeWindow,
    config: TimeEstimationConfig = DEFAULT_TIME_ESTIMATION_CONFIG,
  ): TimeEstimationResult {
    // Filter new events (skip read-only existing events)
    const newEvents = events.filter((e) => !e.isExisting);

    if (newEvents.length === 0) {
      return {
        events: events,
        isOverflowed: false,
        totalDurationMs: 0,
        gapTimeMs: this.calculateWindowDurationMs(window),
      };
    }

    // Calculate total typical duration and determine if overflow
    const totalDurationMs = newEvents.reduce(
      (sum, event) =>
        sum + this.getEventDurationMs(event.type, config),
      0,
    );

    const windowDurationMs = this.calculateWindowDurationMs(window);
    const isOverflowed = totalDurationMs > windowDurationMs;

    // Calculate available gap time for distribution
    const gapTimeMs = Math.max(0, windowDurationMs - totalDurationMs);
    const gapPerEvent = gapTimeMs / newEvents.length;

    // Build result events with calculated timestamps
    let currentTime = new Date(window.startTime).getTime();
    const resultEvents = events.map((event) => {
      if (event.isExisting) {
        // Existing events keep their original timestamp
        return event;
      }

      // Skip pinned events (use their manually-set time)
      if (event.isPinned) {
        return event;
      }

      // New event: assign calculated time
      const eventDurationMs = isOverflowed
        ? this.getCompressedDurationMs(
            event.type,
            config,
            totalDurationMs,
            windowDurationMs,
          )
        : this.getEventDurationMs(event.type, config);

      const eventStartTime = currentTime;
      const eventEndTime = eventStartTime + eventDurationMs;
      const nextEventStartTime = eventEndTime + gapPerEvent;

      // Enforce minimum gap between events
      const minGapMs = config.minGapMinutes * 60000;
      const adjustedStartTime = Math.max(
        eventStartTime,
        currentTime + minGapMs,
      );

      currentTime = Math.max(nextEventStartTime, adjustedStartTime + eventDurationMs);

      // Ensure we don't exceed window end
      if (currentTime > new Date(window.endTime).getTime()) {
        currentTime = new Date(window.endTime).getTime();
      }

      return {
        ...event,
        estimatedTime: new Date(adjustedStartTime).toISOString(),
      };
    });

    return {
      events: resultEvents,
      isOverflowed,
      totalDurationMs,
      gapTimeMs,
    };
  }

  /**
   * Recalculate timestamps after an event is reordered.
   *
   * This method is called after drag-and-drop reordering. It recalculates
   * all unpinned event timestamps while keeping pinned events fixed.
   *
   * @param events - Current event array (may include newly reordered event)
   * @param window - Time window boundaries
   * @param pinnedIndices - Indices of pinned events (skip recalculation)
   * @param config - Optional configuration
   * @returns TimeEstimationResult with recalculated timestamps
   *
   * @example
   * // After user drags event at index 2 to index 0
   * const updated = this.timeEstimation.recalculateTimes(
   *   events,
   *   window,
   *   [1, 3], // Events at indices 1 and 3 are pinned
   * );
   */
  recalculateTimes(
    events: CatchUpEvent[],
    window: TimeWindow,
    pinnedIndices: number[] = [],
    config: TimeEstimationConfig = DEFAULT_TIME_ESTIMATION_CONFIG,
  ): TimeEstimationResult {
    // Mark pinned events before estimation
    const pinnedSet = new Set(pinnedIndices);
    const eventsWithPinning = events.map((event, index) => ({
      ...event,
      isPinned: event.isPinned || pinnedSet.has(index),
    }));

    return this.estimateEventTimes(eventsWithPinning, window, config);
  }

  /**
   * Validate a time window.
   *
   * Checks that:
   * - Start time is before end time
   * - End time is not in the future (with tolerance)
   * - Duration does not exceed maximum (24 hours)
   *
   * @param window - Time window to validate
   * @returns Array of validation error messages (empty if valid)
   *
   * @example
   * const errors = this.timeEstimation.validateTimeWindow(window);
   * if (errors.length > 0) {
   *   errors.forEach(err => this.toast.error(err));
   * }
   */
  validateTimeWindow(window: TimeWindow): string[] {
    const errors: string[] = [];

    const startTime = new Date(window.startTime);
    const endTime = new Date(window.endTime);
    const now = new Date();

    if (startTime >= endTime) {
      errors.push('Start time must be before end time');
    }

    // Check end time not in future (with 5-minute tolerance)
    const toleranceMs = 5 * 60000;
    if (endTime.getTime() > now.getTime() + toleranceMs) {
      errors.push('End time cannot be in the future');
    }

    // Check window duration doesn't exceed 24 hours
    const durationHours =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 24) {
      errors.push('Time window cannot exceed 24 hours');
    }

    return errors;
  }

  /**
   * Get the typical duration for an event type.
   *
   * @param type - Event type: 'feeding', 'diaper', or 'nap'
   * @param config - Configuration with duration values
   * @returns Duration in milliseconds
   *
   * @internal
   */
  private getEventDurationMs(
    type: CatchUpEvent['type'],
    config: TimeEstimationConfig,
  ): number {
    const durationMinutes =
      type === 'feeding'
        ? config.feedingDurationMinutes
        : type === 'diaper'
          ? config.diaperDurationMinutes
          : config.napDurationMinutes;

    return durationMinutes * 60000;
  }

  /**
   * Get compressed duration when overflow is detected.
   *
   * Proportionally reduces all event durations to fit within the window.
   * Formula: (event_duration / total_duration) * window_duration
   *
   * @param type - Event type
   * @param config - Configuration
   * @param totalDurationMs - Sum of all event typical durations
   * @param windowDurationMs - Total window duration
   * @returns Compressed duration in milliseconds
   *
   * @internal
   */
  private getCompressedDurationMs(
    type: CatchUpEvent['type'],
    config: TimeEstimationConfig,
    totalDurationMs: number,
    windowDurationMs: number,
  ): number {
    const typicalDurationMs = this.getEventDurationMs(type, config);
    return (typicalDurationMs / totalDurationMs) * windowDurationMs;
  }

  /**
   * Calculate the duration of a time window in milliseconds.
   *
   * @param window - Time window
   * @returns Duration in milliseconds
   *
   * @internal
   */
  private calculateWindowDurationMs(window: TimeWindow): number {
    const start = new Date(window.startTime).getTime();
    const end = new Date(window.endTime).getTime();
    return Math.max(0, end - start);
  }
}
