import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FeedingDelete } from './feeding-delete';
import { FeedingsService } from '../../../services/feedings.service';
import { ChildrenService } from '../../../services/children.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { Feeding } from '../../../models/feeding.model';
import { Child } from '../../../models/child.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('FeedingDelete', () => {
  let component: FeedingDelete;
  let fixture: ComponentFixture<FeedingDelete>;
  let feedingsService: FeedingsService;
  let childrenService: ChildrenService;
  let router: Router;

  const mockChild: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-02-10T14:30:00Z',
    last_nap: '2024-02-10T13:00:00Z',
    last_feeding: '2024-02-10T12:00:00Z',
  };

  const mockBottleFeeding: Feeding = {
    id: 1,
    child: 1,
    feeding_type: 'bottle',
    fed_at: '2024-02-10T10:00:00Z',
    amount_oz: 5.5,
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z',
  };

  const mockBreastFeeding: Feeding = {
    id: 2,
    child: 1,
    feeding_type: 'breast',
    fed_at: '2024-02-10T14:30:00Z',
    duration_minutes: 15,
    side: 'left',
    created_at: '2024-02-10T14:30:00Z',
    updated_at: '2024-02-10T14:30:00Z',
  };

  beforeEach(async () => {
    const feedingsServiceMock = {
      get: vi.fn().mockReturnValue(of(mockBottleFeeding)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };
    const routerMock = {
      navigate: vi.fn(),
      events: EMPTY,
      routerState: { root: {} },
      parseUrl: vi.fn(),
      createUrlTree: vi.fn(() => ({})),
      navigateByUrl: vi.fn(),
      serializeUrl: vi.fn(() => ''),
    };

    await TestBed.configureTestingModule({
      imports: [FeedingDelete],
      providers: [
        { provide: FeedingsService, useValue: feedingsServiceMock },
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'childId') return '1';
                  if (key === 'id') return '1';
                  return null;
                },
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    feedingsService = TestBed.inject(FeedingsService);
    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(FeedingDelete);
    component = fixture.componentInstance;
    // Don't call detectChanges here to avoid RouterLink initialization
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null childId', () => {
      expect(component.childId()).toBeNull();
    });

    it('should initialize with null child', () => {
      expect(component.child()).toBeNull();
    });

    it('should initialize with null feeding', () => {
      expect(component.feeding()).toBeNull();
    });

    it('should initialize with isDeleting=false', () => {
      expect(component.isDeleting()).toBe(false);
    });

    it('should initialize with no error', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should load child and feeding on init', () => {
      component.ngOnInit();

      expect(childrenService.get).toHaveBeenCalledWith(1);
      expect(feedingsService.get).toHaveBeenCalledWith(1, 1);
    });

    it('should set childId from route', () => {
      component.ngOnInit();

      expect(component.childId()).toBe(1);
    });

    it('should populate child after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.child()).toEqual(mockChild);
    });

    it('should populate feeding after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.feeding()).toEqual(mockBottleFeeding);
    });


    it('should handle child load error', () => {
      const error = new Error('Failed to load child');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => error));

      component.loadData(1, 1);

      expect(component.error()).toBe('Failed to load child');
    });

    it('should handle feeding load error', () => {
      const error = new Error('Failed to load feeding');
      vi.mocked(feedingsService.get).mockReturnValue(throwError(() => error));

      component.loadData(1, 1);

      expect(component.error()).toBe('Failed to load feeding');
    });
  });

  describe('Confirm Delete', () => {
    it('should delete feeding on confirmation', () => {
      component.childId.set(1);
      component.feeding.set(mockBottleFeeding);
      vi.mocked(feedingsService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();

      expect(feedingsService.delete).toHaveBeenCalledWith(1, 1);
    });

    it('should set isDeleting=false after successful deletion', async () => {
      component.childId.set(1);
      component.feeding.set(mockBottleFeeding);
      vi.mocked(feedingsService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isDeleting()).toBe(false);
    });

    it('should navigate to feedings list on successful deletion', async () => {
      component.childId.set(1);
      component.feeding.set(mockBottleFeeding);
      vi.mocked(feedingsService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'feedings']);
    });

    it('should clear error on successful deletion', async () => {
      component.error.set('Previous error');
      component.childId.set(1);
      component.feeding.set(mockBottleFeeding);
      vi.mocked(feedingsService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBeNull();
    });

    it('should not delete if childId is null', () => {
      component.childId.set(null);
      component.feeding.set(mockBottleFeeding);

      component.onConfirmDelete();

      expect(feedingsService.delete).not.toHaveBeenCalled();
    });

    it('should not delete if feeding is null', () => {
      component.childId.set(1);
      component.feeding.set(null);

      component.onConfirmDelete();

      expect(feedingsService.delete).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      const deleteError = new Error('Delete failed');
      component.childId.set(1);
      component.feeding.set(mockBottleFeeding);
      vi.mocked(feedingsService.delete).mockReturnValue(throwError(() => deleteError));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBe('Delete failed');
      expect(component.isDeleting()).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Cancel', () => {
    it('should navigate to feedings list on cancel', () => {
      component.childId.set(1);

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'feedings']);
    });

    it('should not call delete service on cancel', () => {
      component.childId.set(1);
      component.feeding.set(mockBottleFeeding);

      component.onCancel();

      expect(feedingsService.delete).not.toHaveBeenCalled();
    });

    it('should not navigate if childId is null', () => {
      component.childId.set(null);

      component.onCancel();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('DateTime Formatting', () => {
    it('should format datetime with locale string', () => {
      const formatted = component.formatDateTime('2024-02-10T14:30:00Z');

      expect(formatted).toContain('Feb');
      expect(formatted).toContain('10');
      expect(formatted).toContain('2024');
    });

    it('should format bottle feeding details', () => {
      const details = component.getFeedingDetails(mockBottleFeeding);

      expect(details).toBe('Bottle: 5.5 oz');
    });

    it('should format breast feeding details with left side', () => {
      const details = component.getFeedingDetails(mockBreastFeeding);

      expect(details).toBe('Breast: 15 min (Left)');
    });

    it('should format breast feeding with right side', () => {
      const breastRight: Feeding = {
        ...mockBreastFeeding,
        side: 'right',
      };

      const details = component.getFeedingDetails(breastRight);

      expect(details).toBe('Breast: 15 min (Right)');
    });

    it('should format breast feeding with both sides', () => {
      const breastBoth: Feeding = {
        ...mockBreastFeeding,
        side: 'both',
      };

      const details = component.getFeedingDetails(breastBoth);

      expect(details).toBe('Breast: 15 min (Both)');
    });
  });

  describe('Signal Reactivity', () => {
    it('should update childId reactively', () => {
      component.childId.set(5);

      expect(component.childId()).toBe(5);
    });

    it('should update child reactively', () => {
      component.child.set(mockChild);

      expect(component.child()).toEqual(mockChild);
    });

    it('should update feeding reactively', () => {
      component.feeding.set(mockBottleFeeding);

      expect(component.feeding()).toEqual(mockBottleFeeding);
    });

    it('should update isDeleting reactively', () => {
      component.isDeleting.set(true);

      expect(component.isDeleting()).toBe(true);
    });

    it('should update error reactively', () => {
      component.error.set('Test error');

      expect(component.error()).toBe('Test error');
    });
  });

  describe('Error Handling', () => {
    it('should handle network error on load', () => {
      const networkError = new Error('Network error');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => networkError));

      component.loadData(1, 1);

      expect(component.error()).toBe('Network error');
    });

    it('should handle 404 error on load', () => {
      const notFoundError = new Error('Feeding not found');
      vi.mocked(feedingsService.get).mockReturnValue(throwError(() => notFoundError));

      component.loadData(1, 999);

      expect(component.error()).toBe('Feeding not found');
    });

    it('should handle 401 unauthorized error', () => {
      const unauthorizedError = new Error('Your session has expired');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => unauthorizedError));

      component.loadData(1, 1);

      expect(component.error()).toBe('Your session has expired');
    });
  });

  describe('Edge Cases', () => {
    it('should handle bottle feeding with decimal amount', () => {
      const bottleDecimal: Feeding = {
        ...mockBottleFeeding,
        amount_oz: 7.25,
      };

      const details = component.getFeedingDetails(bottleDecimal);

      expect(details).toBe('Bottle: 7.25 oz');
    });
  });
});
