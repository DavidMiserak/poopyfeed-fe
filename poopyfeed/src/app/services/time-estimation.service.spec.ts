import { TestBed } from '@angular/core/testing';
import { TimeEstimationService } from './time-estimation.service';
import {
  CatchUpEvent,
  TimeWindow,
  DEFAULT_TIME_ESTIMATION_CONFIG,
  CATCH_UP_VALIDATION,
} from '../models';

describe('TimeEstimationService', () => {
  let service: TimeEstimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TimeEstimationService],
    });
    service = TestBed.inject(TimeEstimationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('estimateEventTimes', () => {
    it('should handle empty new events array', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z',
      };

      const existingEvent: CatchUpEvent = {
        id: '1',
        type: 'feeding',
        estimatedTime: '2026-02-17T10:00:00Z',
        isPinned: false,
        isExisting: true,
        existingId: 1,
        data: { feeding_type: 'bottle', fed_at: '2026-02-17T10:00:00Z' },
      };

      const result = service.estimateEventTimes([existingEvent], window);

      expect(result.events.length).toBe(1);
      expect(result.isOverflowed).toBe(false);
      expect(result.totalDurationMs).toBe(0);
      expect(result.gapTimeMs).toBeGreaterThan(0);
    });

    it('should distribute single feeding event proportionally', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z', // 4 hours
      };

      const event: CatchUpEvent = {
        id: '1',
        type: 'feeding',
        estimatedTime: '',
        isPinned: false,
        isExisting: false,
        data: {
          feeding_type: 'bottle',
          fed_at: '',
          amount_oz: 4,
        },
      };

      const result = service.estimateEventTimes([event], window);

      expect(result.events.length).toBe(1);
      expect(result.events[0].estimatedTime).toBeTruthy();
      expect(new Date(result.events[0].estimatedTime).getTime()).toBeGreaterThanOrEqual(
        new Date(window.startTime).getTime(),
      );
      expect(new Date(result.events[0].estimatedTime).getTime()).toBeLessThanOrEqual(
        new Date(window.endTime).getTime(),
      );
    });

    it('should distribute mixed event types proportionally', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z', // 4 hours = 240 minutes
      };

      // Total typical duration: 20 + 5 + 60 = 85 minutes
      // Gap time: 240 - 85 = 155 minutes
      // Gap per event: 155 / 3 ≈ 51.67 minutes

      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: {
            feeding_type: 'bottle',
            fed_at: '',
            amount_oz: 4,
          },
        },
        {
          id: '2',
          type: 'diaper',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: {
            change_type: 'wet',
            changed_at: '',
          },
        },
        {
          id: '3',
          type: 'nap',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: {
            napped_at: '',
            ended_at: '',
          },
        },
      ];

      const result = service.estimateEventTimes(events, window);

      expect(result.events.length).toBe(3);
      expect(result.isOverflowed).toBe(false);

      // All timestamps should be within window
      const windowStart = new Date(window.startTime).getTime();
      const windowEnd = new Date(window.endTime).getTime();

      result.events.forEach((event) => {
        const eventTime = new Date(event.estimatedTime).getTime();
        expect(eventTime).toBeGreaterThanOrEqual(windowStart);
        expect(eventTime).toBeLessThanOrEqual(windowEnd);
      });

      // Events should be in increasing time order
      for (let i = 0; i < result.events.length - 1; i++) {
        const currentTime = new Date(result.events[i].estimatedTime).getTime();
        const nextTime = new Date(result.events[i + 1].estimatedTime).getTime();
        expect(nextTime).toBeGreaterThan(currentTime);
      }
    });

    it('should enforce minimum 2-minute gap between events', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T09:30:00Z', // 30 minutes (very tight)
      };

      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'diaper',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: { change_type: 'wet', changed_at: '' },
        },
        {
          id: '2',
          type: 'diaper',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: { change_type: 'wet', changed_at: '' },
        },
      ];

      const result = service.estimateEventTimes(events, window);
      const minGapMs = 2 * 60000; // 2 minutes

      for (let i = 0; i < result.events.length - 1; i++) {
        const currentTime = new Date(result.events[i].estimatedTime).getTime();
        const nextTime = new Date(result.events[i + 1].estimatedTime).getTime();
        const gap = nextTime - currentTime;
        expect(gap).toBeGreaterThanOrEqual(minGapMs);
      }
    });

    it('should detect overflow when durations exceed window', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T10:00:00Z', // 1 hour = 60 minutes
      };

      // Typical durations: 20 + 20 + 20 + 60 = 120 minutes (exceeds window)
      const events: CatchUpEvent[] = Array.from({ length: 4 }, (_, i) => ({
        id: String(i),
        type: i === 3 ? 'nap' : 'feeding',
        estimatedTime: '',
        isPinned: false,
        isExisting: false,
        data:
          i === 3
            ? { napped_at: '', ended_at: '' }
            : { feeding_type: 'bottle', fed_at: '', amount_oz: 4 },
      }));

      const result = service.estimateEventTimes(events, window);

      expect(result.isOverflowed).toBe(true);
      expect(result.totalDurationMs).toBeGreaterThan(result.gapTimeMs + 1); // Rough check
    });

    it('should skip existing events in time estimation', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z',
      };

      const existingEvent: CatchUpEvent = {
        id: '1',
        type: 'feeding',
        estimatedTime: '2026-02-17T10:00:00Z',
        isPinned: false,
        isExisting: true,
        existingId: 1,
        data: { feeding_type: 'bottle', fed_at: '2026-02-17T10:00:00Z' },
      };

      const newEvent: CatchUpEvent = {
        id: '2',
        type: 'diaper',
        estimatedTime: '',
        isPinned: false,
        isExisting: false,
        data: { change_type: 'wet', changed_at: '' },
      };

      const result = service.estimateEventTimes(
        [existingEvent, newEvent],
        window,
      );

      // Existing event keeps original time
      expect(result.events[0].estimatedTime).toBe('2026-02-17T10:00:00Z');
      // New event gets calculated time
      expect(result.events[1].estimatedTime).not.toBe('');
    });

    it('should keep pinned events fixed during recalculation', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z',
      };

      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T10:30:00Z',
          isPinned: true, // User manually set this time
          isExisting: false,
          data: { feeding_type: 'bottle', fed_at: '', amount_oz: 4 },
        },
        {
          id: '2',
          type: 'diaper',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: { change_type: 'wet', changed_at: '' },
        },
      ];

      const result = service.estimateEventTimes(events, window);

      // Pinned event should keep its time
      expect(result.events[0].estimatedTime).toBe('2026-02-17T10:30:00Z');
    });

    it('should handle custom configuration', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T10:00:00Z', // 1 hour
      };

      const customConfig = {
        feedingDurationMinutes: 10,
        diaperDurationMinutes: 2,
        napDurationMinutes: 30,
        minGapMinutes: 1,
      };

      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: { feeding_type: 'bottle', fed_at: '', amount_oz: 4 },
        },
      ];

      const result = service.estimateEventTimes(events, window, customConfig);

      expect(result.events.length).toBe(1);
      expect(result.events[0].estimatedTime).toBeTruthy();
    });
  });

  describe('recalculateTimes', () => {
    it('should recalculate times after reordering', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z',
      };

      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T09:30:00Z',
          isPinned: false,
          isExisting: false,
          data: { feeding_type: 'bottle', fed_at: '', amount_oz: 4 },
        },
        {
          id: '2',
          type: 'nap',
          estimatedTime: '2026-02-17T12:00:00Z',
          isPinned: false,
          isExisting: false,
          data: { napped_at: '', ended_at: '' },
        },
      ];

      // Reorder: nap first, feeding second
      const reordered = [events[1], events[0]];
      const result = service.recalculateTimes(reordered, window);

      // Times should be recalculated (nap takes 60 min, so should be earlier)
      expect(result.events[0].type).toBe('nap');
      expect(
        new Date(result.events[0].estimatedTime).getTime(),
      ).toBeLessThanOrEqual(
        new Date(result.events[1].estimatedTime).getTime(),
      );
    });

    it('should respect pinned indices during recalculation', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z',
      };

      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '2026-02-17T09:30:00Z',
          isPinned: false,
          isExisting: false,
          data: { feeding_type: 'bottle', fed_at: '', amount_oz: 4 },
        },
        {
          id: '2',
          type: 'diaper',
          estimatedTime: '2026-02-17T10:00:00Z',
          isPinned: false,
          isExisting: false,
          data: { change_type: 'wet', changed_at: '' },
        },
      ];

      // Pin the first event during recalculation
      const result = service.recalculateTimes(events, window, [0]);

      // First event should keep its time (pinned)
      expect(result.events[0].estimatedTime).toBe('2026-02-17T09:30:00Z');
    });
  });

  describe('validateTimeWindow', () => {
    it('should validate valid time window', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z',
      };

      const errors = service.validateTimeWindow(window);

      expect(errors.length).toBe(0);
    });

    it('should reject window with start >= end', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T13:00:00Z',
        endTime: '2026-02-17T09:00:00Z',
      };

      const errors = service.validateTimeWindow(window);

      expect(errors).toContain('Start time must be before end time');
    });

    it('should reject window with equal start and end', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T12:00:00Z',
        endTime: '2026-02-17T12:00:00Z',
      };

      const errors = service.validateTimeWindow(window);

      expect(errors).toContain('Start time must be before end time');
    });

    it('should reject end time in future (beyond tolerance)', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 10 * 60000); // 10 minutes in future

      const window: TimeWindow = {
        startTime: new Date(now.getTime() - 1000 * 60000).toISOString(), // 1000 min ago
        endTime: future.toISOString(),
      };

      const errors = service.validateTimeWindow(window);

      expect(errors).toContain('End time cannot be in the future');
    });

    it('should allow end time within tolerance (5 minutes)', () => {
      const now = new Date();
      const almostFuture = new Date(now.getTime() + 2 * 60000); // 2 minutes in future

      const window: TimeWindow = {
        startTime: new Date(now.getTime() - 1000 * 60000).toISOString(),
        endTime: almostFuture.toISOString(),
      };

      const errors = service.validateTimeWindow(window);

      expect(errors).not.toContain('End time cannot be in the future');
    });

    it('should reject window exceeding 24 hours', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-18T10:00:00Z', // 25 hours
      };

      const errors = service.validateTimeWindow(window);

      expect(errors).toContain('Time window cannot exceed 24 hours');
    });

    it('should allow window exactly 24 hours', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-18T09:00:00Z', // Exactly 24 hours
      };

      const errors = service.validateTimeWindow(window);

      // Should not have duration error
      expect(errors).not.toContain(
        'Time window cannot exceed 24 hours',
      );
    });

    it('should accumulate multiple validation errors', () => {
      // endTime in future (6 min from now) and startTime after endTime (8 min from now)
      const endInFuture = new Date(Date.now() + 6 * 60000);
      const startAfterEnd = new Date(Date.now() + 8 * 60000);

      const window: TimeWindow = {
        startTime: startAfterEnd.toISOString(), // start > end AND in future
        endTime: endInFuture.toISOString(), // end in future (both errors)
      };

      const errors = service.validateTimeWindow(window);

      // Should have both errors
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('Start time must be before end time');
      expect(errors).toContain('End time cannot be in the future');
    });
  });

  describe('edge cases', () => {
    it('should handle very small time window', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T12:00:00Z',
        endTime: '2026-02-17T12:01:00Z', // 1 minute
      };

      const event: CatchUpEvent = {
        id: '1',
        type: 'diaper',
        estimatedTime: '',
        isPinned: false,
        isExisting: false,
        data: { change_type: 'wet', changed_at: '' },
      };

      const result = service.estimateEventTimes([event], window);

      expect(result.events.length).toBe(1);
      // 1 minute window with 5-minute diaper is overflowed
      expect(result.isOverflowed).toBe(true);
    });

    it('should handle 20 events (max batch size)', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z', // 4 hours = 240 minutes
      };

      const events: CatchUpEvent[] = Array.from(
        { length: CATCH_UP_VALIDATION.MAX_EVENTS_PER_BATCH },
        (_, i) => ({
          id: String(i),
          type: 'diaper' as const,
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: { change_type: 'wet' as const, changed_at: '' },
        }),
      );

      const result = service.estimateEventTimes(events, window);

      expect(result.events.length).toBe(20);
      // 20 * 5 = 100 minutes, fits in 240 minute window, not overflowed
      expect(result.isOverflowed).toBe(false);
    });

    it('should preserve order after estimation', () => {
      const window: TimeWindow = {
        startTime: '2026-02-17T09:00:00Z',
        endTime: '2026-02-17T13:00:00Z',
      };

      const events: CatchUpEvent[] = [
        {
          id: '1',
          type: 'feeding',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: { feeding_type: 'bottle', fed_at: '', amount_oz: 4 },
        },
        {
          id: '2',
          type: 'diaper',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: { change_type: 'wet', changed_at: '' },
        },
        {
          id: '3',
          type: 'nap',
          estimatedTime: '',
          isPinned: false,
          isExisting: false,
          data: { napped_at: '', ended_at: '' },
        },
      ];

      const result = service.estimateEventTimes(events, window);

      // Order should be preserved
      expect(result.events[0].id).toBe('1');
      expect(result.events[1].id).toBe('2');
      expect(result.events[2].id).toBe('3');
    });
  });
});
