import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CatchUp } from './catch-up';
import { TimeEstimationService } from '../../services/time-estimation.service';
import { BatchesService } from '../../services/batches.service';
import { ChildrenService } from '../../services/children.service';
import { FeedingsService } from '../../services/feedings.service';
import { DiapersService } from '../../services/diapers.service';
import { NapsService } from '../../services/naps.service';
import { ToastService } from '../../services/toast.service';
import { Child, Feeding, DiaperChange, Nap, CATCH_UP_VALIDATION } from '../../models';

describe('CatchUpComponent', () => {
  let component: CatchUp;
  let fixture: ComponentFixture<CatchUp>;
  let childrenService: any;
  let feedingsService: any;
  let diapersService: any;
  let napsService: any;
  let timeEstimationService: any;
  let batchesService: any;
  let toastService: any;
  let router: any;
  let route: any;

  const mockChild: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-01-15T14:30:00Z',
    last_nap: '2024-01-15T13:00:00Z',
    last_feeding: '2024-01-15T12:00:00Z',
  };

  const mockFeeding: Feeding = {
    id: 1,
    child: 1,
    feeding_type: 'bottle',
    fed_at: '2024-01-15T10:00:00Z',
    amount_oz: 4,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  };

  const mockDiaperChange: DiaperChange = {
    id: 1,
    child: 1,
    change_type: 'wet',
    changed_at: '2024-01-15T11:00:00Z',
    created_at: '2024-01-15T11:00:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  };

  const mockNap: Nap = {
    id: 1,
    child: 1,
    napped_at: '2024-01-15T12:00:00Z',
    ended_at: '2024-01-15T13:00:00Z',
    duration_minutes: 60,
    created_at: '2024-01-15T12:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
  };

  beforeEach(async () => {
    childrenService = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };
    feedingsService = {
      list: vi.fn().mockReturnValue(of([])),
    };
    diapersService = {
      list: vi.fn().mockReturnValue(of([])),
    };
    napsService = {
      list: vi.fn().mockReturnValue(of([])),
    };
    timeEstimationService = {
      estimateEventTimes: vi.fn().mockImplementation((events: any) => ({
        events: events || [],
        isOverflowed: false,
        totalDurationMs: 0,
        gapTimeMs: 0,
      })),
      validateTimeWindow: vi.fn().mockReturnValue([]),
    };
    batchesService = {
      create: vi.fn().mockReturnValue(of({ created: [], count: 0 })),
    };
    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    };
    router = {
      navigate: vi.fn(),
    };
    route = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1'),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [CatchUp],
      providers: [
        { provide: ChildrenService, useValue: childrenService },
        { provide: FeedingsService, useValue: feedingsService },
        { provide: DiapersService, useValue: diapersService },
        { provide: NapsService, useValue: napsService },
        { provide: TimeEstimationService, useValue: timeEstimationService },
        { provide: BatchesService, useValue: batchesService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatchUp);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load child profile and existing events', () => {
      feedingsService.list.mockReturnValue(of([mockFeeding]));
      diapersService.list.mockReturnValue(of([mockDiaperChange]));
      napsService.list.mockReturnValue(of([mockNap]));

      fixture.detectChanges();

      expect(childrenService.get).toHaveBeenCalledWith(1);
      expect(feedingsService.list).toHaveBeenCalledWith(1);
      expect(diapersService.list).toHaveBeenCalledWith(1);
      expect(napsService.list).toHaveBeenCalledWith(1);
      expect(component.child()).toEqual(mockChild);
      expect(component.eventList().length).toBe(3);
    });

    it('should set default 4-hour time window', () => {
      fixture.detectChanges();

      const now = new Date();
      const startTime = new Date(component.timeWindow().startTime);
      const endTime = new Date(component.timeWindow().endTime);

      expect(endTime.getTime()).toBeCloseTo(now.getTime(), -2);
      expect(startTime.getTime()).toBeCloseTo(
        now.getTime() - 4 * 60 * 60 * 1000,
        -2
      );
    });

    it('should handle invalid child ID', () => {
      route.snapshot.paramMap.get.mockReturnValue(null);

      fixture.detectChanges();

      expect(component.error()).toBe('Invalid child ID');
    });

  });

  describe('Event Lifecycle', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add new feeding event', () => {
      component.onAddEvent('feeding');

      expect(component.newEvents().length).toBe(1);
      expect(component.newEvents()[0].type).toBe('feeding');
      expect(component.newEvents()[0].isPinned).toBe(false);
      expect(component.newEvents()[0].isExisting).toBe(false);
    });

    it('should add new diaper event', () => {
      component.onAddEvent('diaper');

      expect(component.newEvents().length).toBe(1);
      expect(component.newEvents()[0].type).toBe('diaper');
    });

    it('should add new nap event', () => {
      component.onAddEvent('nap');

      expect(component.newEvents().length).toBe(1);
      expect(component.newEvents()[0].type).toBe('nap');
    });

    it('should generate unique IDs for events', () => {
      component.onAddEvent('feeding');
      component.onAddEvent('feeding');

      expect(component.newEvents()[0].id).not.toBe(
        component.newEvents()[1].id
      );
    });

    it('should remove event from list', () => {
      component.onAddEvent('feeding');
      const eventId = component.newEvents()[0].id;

      component.onRemoveEvent(eventId);

      expect(component.newEvents().length).toBe(0);
      expect(toastService.success).toHaveBeenCalledWith('Event removed');
    });

    it('should prevent adding more than 20 events', () => {
      for (let i = 0; i < 20; i++) {
        component.onAddEvent('feeding');
      }

      expect(component.canAddEvent()).toBe(false);

      component.onAddEvent('feeding');

      // Still 20 (didn't add the 21st)
      expect(component.newEvents().length).toBe(20);
      expect(toastService.warning).toHaveBeenCalled();
    });

    it('should update event data', () => {
      component.onAddEvent('feeding');
      const eventId = component.newEvents()[0].id;
      const newTime = '2024-01-15T15:00:00Z';

      component.onUpdateEvent(eventId, {
        isPinned: true,
        estimatedTime: newTime,
      });

      const updated = component.eventList().find((e) => e.id === eventId);
      expect(updated?.isPinned).toBe(true);
      expect(updated?.estimatedTime).toBe(newTime);
    });

    it('should recalculate times after add/remove', () => {
      component.onAddEvent('feeding');

      expect(timeEstimationService.estimateEventTimes).toHaveBeenCalled();
    });

    it('should reorder events', () => {
      component.onAddEvent('feeding');
      component.onAddEvent('diaper');
      component.onAddEvent('nap');

      const reordered = [
        component.eventList()[2],
        component.eventList()[0],
        component.eventList()[1],
      ];

      component.onReorderEvents(reordered);

      expect(component.eventList()[0].type).toBe('nap');
    });
  });

  describe('Time Window Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate time window before change', () => {
      const validationErrors = ['Start time must be before end time'];
      timeEstimationService.validateTimeWindow.mockReturnValue(validationErrors);

      const newWindow = {
        startTime: '2024-01-15T15:00:00Z',
        endTime: '2024-01-15T10:00:00Z',
      };

      component.onTimeWindowChange(newWindow);

      expect(toastService.error).toHaveBeenCalledWith(
        'Start time must be before end time'
      );
      expect(component.timeWindow().startTime).not.toBe(newWindow.startTime);
    });

    it('should reload existing events on time window change', () => {
      timeEstimationService.validateTimeWindow.mockReturnValue([]);
      feedingsService.list.mockReturnValue(of([mockFeeding]));

      const newWindow = {
        startTime: '2024-01-15T08:00:00Z',
        endTime: '2024-01-15T12:00:00Z',
      };

      component.onTimeWindowChange(newWindow);

      expect(component.timeWindow()).toEqual(newWindow);
      expect(feedingsService.list).toHaveBeenCalled();
    });

    it('should show warning on validation error', () => {
      const errors = [
        'End time cannot be in the future',
        'Time window cannot exceed 24 hours',
      ];
      timeEstimationService.validateTimeWindow.mockReturnValue(errors);

      component.onTimeWindowChange({
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-16T15:00:00Z',
      });

      expect(toastService.error).toHaveBeenCalledTimes(errors.length);
    });
  });

  describe('Batch Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should submit new events only (exclude existing)', () => {
      component.onAddEvent('feeding');

      batchesService.create.mockReturnValue(
        of({ created: [], count: 1 })
      );

      component.onSubmit();

      expect(batchesService.create).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({
            isExisting: false,
          }),
        ])
      );
    });

    it('should show success toast and navigate on success', () => {
      component.onAddEvent('feeding');

      batchesService.create.mockReturnValue(
        of({ created: [], count: 1 })
      );

      component.onSubmit();

      expect(toastService.success).toHaveBeenCalledWith(
        '1 events saved successfully'
      );
      expect(router.navigate).toHaveBeenCalledWith([
        '/children',
        1,
        'dashboard',
      ]);
    });


    it('should disable submit button during submission', () => {
      component.onAddEvent('feeding');

      batchesService.create.mockReturnValue(
        of({ created: [], count: 1 })
      );

      component.onSubmit();

      expect(component.isSubmitting()).toBe(true);
    });

    it('should prevent submit with no changes', () => {
      // No events added
      component.onSubmit();

      expect(toastService.error).toHaveBeenCalledWith(
        'Add at least one event before saving'
      );
    });
  });

  describe('Derived State (Computed Signals)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate new vs existing events', () => {
      feedingsService.list.mockReturnValue(of([mockFeeding]));
      component.eventList.set([
        {
          id: 'existing-1',
          type: 'feeding',
          estimatedTime: '2024-01-15T10:00:00Z',
          isPinned: true,
          isExisting: true,
          existingId: 1,
          data: mockFeeding,
        },
      ]);

      component.onAddEvent('diaper');

      expect(component.existingEvents().length).toBe(1);
      expect(component.newEvents().length).toBe(1);
      expect(component.totalEventCount()).toBe(2);
    });

    it('should track if there are unsaved changes', () => {
      expect(component.hasChanges()).toBe(false);

      component.onAddEvent('feeding');

      expect(component.hasChanges()).toBe(true);
    });

    it('should know when to disable add button', () => {
      expect(component.canAddEvent()).toBe(true);

      // Add max events
      for (let i = 0; i < CATCH_UP_VALIDATION.MAX_EVENTS_PER_BATCH; i++) {
        component.onAddEvent('feeding');
      }

      expect(component.canAddEvent()).toBe(false);
    });
  });

  describe('Cancellation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to dashboard on cancel with no changes', () => {
      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith([
        '/children',
        1,
        'dashboard',
      ]);
    });
  });

});
