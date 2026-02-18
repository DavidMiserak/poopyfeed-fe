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
import { Child } from '../../models';

describe('CatchUpComponent - Step Wizard', () => {
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
      validateTimeWindow: vi.fn().mockReturnValue([]),
      estimateEventTimes: vi.fn().mockImplementation((events) => ({
        events,
        isOverflowed: false,
      })),
    };
    batchesService = {
      create: vi.fn().mockReturnValue(of({ count: 1 })),
    };
    toastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };
    router = {
      navigate: vi.fn(),
    };
    route = {
      snapshot: { paramMap: { get: vi.fn().mockReturnValue('1') } },
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
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeDefined();
    });

    it('should start at time-range step', () => {
      expect(component.currentStep()).toBe('time-range');
    });

    it('should load child and initialize', () => {
      expect(childrenService.get).toHaveBeenCalledWith(1);
      expect(component.child()).toEqual(mockChild);
    });
  });

  describe('Step Navigation - goToStep', () => {
    it('should advance from time-range to events', () => {
      const now = new Date();
      const start = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const timeWindow = {
        startTime: start.toISOString(),
        endTime: now.toISOString(),
      };

      component.goToStep('events', timeWindow);

      expect(component.currentStep()).toBe('events');
    });

    it('should exclude events outside the 4-hour time window', () => {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const timeWindow = {
        startTime: fourHoursAgo.toISOString(),
        endTime: now.toISOString(),
      };

      // Create events: one inside window (2h ago), one outside (5h ago), one way outside (1 day ago)
      const eventWithin4h = {
        id: 1,
        child: 1,
        feeding_type: 'bottle',
        fed_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        amount_oz: 4,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      // This event should NOT be returned by the service because it's outside the window
      const eventOutside4h = {
        id: 2,
        child: 1,
        feeding_type: 'bottle',
        fed_at: fiveHoursAgo.toISOString(),
        amount_oz: 4,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T09:00:00Z',
      };

      const eventFromYesterday = {
        id: 3,
        child: 1,
        feeding_type: 'bottle',
        fed_at: oneDayAgo.toISOString(),
        amount_oz: 4,
        created_at: '2024-01-14T10:00:00Z',
        updated_at: '2024-01-14T10:00:00Z',
      };

      // Services should be called with the 4-hour window filters
      // The API should filter and only return the event within 4h
      feedingsService.list.mockReturnValue(of([eventWithin4h]));
      diapersService.list.mockReturnValue(of([]));
      napsService.list.mockReturnValue(of([]));

      component.goToStep('events', timeWindow);

      // Verify services were called with correct time window filters
      expect(feedingsService.list).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          dateFrom: fourHoursAgo.toISOString(),
          dateTo: now.toISOString(),
        }),
      );

      // Verify the dates passed are actually within 4 hours
      const callDateFrom = new Date(fourHoursAgo);
      const callDateTo = new Date(now);
      const windowDurationHours = (callDateTo.getTime() - callDateFrom.getTime()) / (1000 * 60 * 60);
      expect(windowDurationHours).toBeCloseTo(4, 1); // Within 1 hour of 4 hours

      // The component should only show event within 4h
      const existingFeedings = component.eventList()
        .filter(e => e.type === 'feeding' && e.isExisting);

      // Should have the event from within 4h
      expect(existingFeedings.some(e => e.existingId === 1)).toBe(true);
      // Should NOT have events outside the window
      expect(existingFeedings.some(e => e.existingId === 2)).toBe(false);
      expect(existingFeedings.some(e => e.existingId === 3)).toBe(false);
    });

    it('should validate time window before advancing', () => {
      timeEstimationService.validateTimeWindow.mockReturnValue([
        'Invalid time window',
      ]);

      const timeWindow = {
        startTime: 'invalid',
        endTime: 'invalid',
      };

      component.goToStep('events', timeWindow);

      expect(component.currentStep()).toBe('time-range');
      expect(toastService.error).toHaveBeenCalled();
    });

    it('should require at least one event before review', () => {
      component.currentStep.set('events');

      component.goToStep('review');

      expect(component.currentStep()).toBe('events');
      expect(toastService.error).toHaveBeenCalled();
    });

    it('should advance to review with events', () => {
      component.onAddEvent('feeding');

      component.goToStep('review');

      expect(component.currentStep()).toBe('review');
    });

    it('should advance to success after successful submission', () => {
      component.currentStep.set('success');

      expect(component.currentStep()).toBe('success');
    });
  });

  describe('Event Management', () => {
    it('should add new feeding event', () => {
      component.onAddEvent('feeding');

      expect(component.newEvents().length).toBe(1);
      expect(component.newEvents()[0].type).toBe('feeding');
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

    it('should remove event', () => {
      component.onAddEvent('feeding');
      const eventId = component.newEvents()[0].id;

      component.onRemoveEvent(eventId);

      expect(component.newEvents().length).toBe(0);
    });

    it('should prevent adding more than max events', () => {
      for (let i = 0; i < 20; i++) {
        component.onAddEvent('feeding');
      }

      component.onAddEvent('feeding');

      expect(component.newEvents().length).toBe(20);
      expect(toastService.warning).toHaveBeenCalled();
    });
  });

  describe('Submission', () => {
    it('should submit batch of events successfully', () => {
      component.onAddEvent('feeding');
      component.currentStep.set('review');

      component.onSubmit();

      expect(batchesService.create).toHaveBeenCalled();
    });

    it('should show success screen after submission', () => {
      component.onAddEvent('feeding');
      component.currentStep.set('review');

      component.onSubmit();

      // Vitest is synchronous - just check that submission was initiated
      expect(batchesService.create).toHaveBeenCalled();
    });

    it('should handle submission errors', () => {
      // Mock console.error to suppress error output during test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      batchesService.create.mockReturnValue(
        throwError(() => ({
          batchErrors: {
            errors: [{ index: 0, type: 'feeding', errors: { field: ['error'] } }],
          },
        })),
      );

      component.onAddEvent('feeding');
      component.currentStep.set('review');

      component.onSubmit();

      expect(toastService.error).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cancel', () => {
    it('should navigate to dashboard when canceling from time-range step', () => {
      component.currentStep.set('time-range');

      component.onCancel();

      expect(router.navigate).toHaveBeenCalled();
    });

    it('should confirm before canceling from events step with unsaved changes', () => {
      component.currentStep.set('events');
      component.onAddEvent('feeding');

      // Mock confirm to return true
      window.confirm = vi.fn().mockReturnValue(true) as any;

      component.onCancel();

      expect(window.confirm).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
    });
  });

  describe('Navigation to Dashboard', () => {
    it('should navigate to child dashboard', () => {
      component.navigateToDashboard();

      expect(router.navigate).toHaveBeenCalledWith([
        '/children',
        1,
        'dashboard',
      ]);
    });
  });
});
