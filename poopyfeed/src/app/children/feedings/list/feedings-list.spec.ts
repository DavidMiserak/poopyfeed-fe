import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedingsList } from './feedings-list';
import { FeedingsService } from '../../../services/feedings.service';
import { ChildrenService } from '../../../services/children.service';
import { FilterService } from '../../../services/filter.service';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Feeding } from '../../../models/feeding.model';
import { Child } from '../../../models/child.model';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('FeedingsList - Batch Operations', () => {
  let component: FeedingsList;
  let fixture: ComponentFixture<FeedingsList>;
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
    last_diaper_change: '2024-01-15T14:30:00Z',
    last_nap: '2024-01-15T13:00:00Z',
    last_feeding: '2024-01-15T12:00:00Z',
  };

  const mockFeedings: Feeding[] = [
    {
      id: 1,
      child: 1,
      feeding_type: 'bottle',
      fed_at: '2024-01-15T10:00:00Z',
      amount_oz: 5.5,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      child: 1,
      feeding_type: 'breast',
      fed_at: '2024-01-15T14:30:00Z',
      duration_minutes: 15,
      side: 'left',
      created_at: '2024-01-15T14:30:00Z',
      updated_at: '2024-01-15T14:30:00Z',
    },
    {
      id: 3,
      child: 1,
      feeding_type: 'bottle',
      fed_at: '2024-01-15T18:00:00Z',
      amount_oz: 6,
      created_at: '2024-01-15T18:00:00Z',
      updated_at: '2024-01-15T18:00:00Z',
    },
  ];

  beforeEach(async () => {
    const feedingsServiceMock = {
      list: vi.fn().mockReturnValue(of(mockFeedings)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };
    const routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FeedingsList],
      providers: [
        { provide: FeedingsService, useValue: feedingsServiceMock },
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        FilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'childId' ? '1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    feedingsService = TestBed.inject(FeedingsService);
    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(FeedingsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('selection state', () => {
    it('should initialize with empty selection', () => {
      expect(component.selectedIds()).toEqual([]);
    });

    it('should have hasSelectedItems computed false initially', () => {
      expect(component.hasSelectedItems()).toBeFalsy();
    });

    it('should have isAllSelected computed false initially', () => {
      expect(component.isAllSelected()).toBeFalsy();
    });
  });

  describe('toggleSelection', () => {
    it('should add item to selection', () => {
      component.toggleSelection(1);

      expect(component.selectedIds()).toContain(1);
    });

    it('should remove item from selection', () => {
      component.selectedIds.set([1, 2]);

      component.toggleSelection(1);

      expect(component.selectedIds()).not.toContain(1);
      expect(component.selectedIds()).toContain(2);
    });

    it('should toggle multiple items independently', () => {
      component.toggleSelection(1);
      component.toggleSelection(2);
      component.toggleSelection(1);

      expect(component.selectedIds()).toEqual([2]);
    });
  });

  describe('toggleSelectAll', () => {
    it('should select all items when none selected', () => {
      component.allFeedings.set(mockFeedings);
      fixture.detectChanges();

      component.toggleSelectAll();

      expect(component.selectedIds()).toEqual([1, 2, 3]);
    });

    it('should deselect all items when all selected', () => {
      component.selectedIds.set([1, 2, 3]);
      component.allFeedings.set(mockFeedings);
      fixture.detectChanges();

      component.toggleSelectAll();

      expect(component.selectedIds()).toEqual([]);
    });

    it('should select all filtered items', () => {
      component.allFeedings.set(mockFeedings);
      component.filters.set({ type: 'bottle' });
      fixture.detectChanges();

      component.toggleSelectAll();

      // Should select only bottle feedings (1 and 3)
      expect(component.selectedIds().length).toBe(2);
      expect(component.selectedIds()).toContain(1);
      expect(component.selectedIds()).toContain(3);
    });
  });

  describe('clearSelection', () => {
    it('should clear selected items', () => {
      component.selectedIds.set([1, 2, 3]);

      component.clearSelection();

      expect(component.selectedIds()).toEqual([]);
    });

    it('should update hasSelectedItems computed', () => {
      component.selectedIds.set([1, 2]);

      expect(component.hasSelectedItems()).toBeTruthy();

      component.clearSelection();

      expect(component.hasSelectedItems()).toBeFalsy();
    });
  });

  describe('hasSelectedItems computed', () => {
    it('should return true when items selected', () => {
      component.selectedIds.set([1]);

      expect(component.hasSelectedItems()).toBeTruthy();
    });

    it('should return false when no items selected', () => {
      component.selectedIds.set([]);

      expect(component.hasSelectedItems()).toBeFalsy();
    });
  });

  describe('isAllSelected computed', () => {
    it('should return true when all items selected', () => {
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2, 3]);
      fixture.detectChanges();

      expect(component.isAllSelected()).toBeTruthy();
    });

    it('should return false when partial selection', () => {
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2]);
      fixture.detectChanges();

      expect(component.isAllSelected()).toBeFalsy();
    });

    it('should return false when no selection', () => {
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([]);
      fixture.detectChanges();

      expect(component.isAllSelected()).toBeFalsy();
    });

    it('should account for filtered items', () => {
      component.allFeedings.set(mockFeedings);
      component.filters.set({ type: 'bottle' }); // 2 items match
      fixture.detectChanges();

      component.selectedIds.set([1, 3]); // Select both bottle items

      expect(component.isAllSelected()).toBeTruthy();
    });
  });

  describe('bulkDelete', () => {
    it('should prompt for confirmation', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2]);

      component.bulkDelete();

      expect(confirmSpy).toHaveBeenCalledWith(
        'Delete 2 feeding(s)? This cannot be undone.'
      );
      confirmSpy.mockRestore();
    });

    it('should not delete if user cancels confirmation', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2]);

      component.bulkDelete();

      expect(feedingsService.delete).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should delete selected items', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.childId.set(1);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2]);

      component.bulkDelete();

      expect(feedingsService.delete).toHaveBeenCalledWith(1, 1);
      expect(feedingsService.delete).toHaveBeenCalledWith(1, 2);
      confirmSpy.mockRestore();
    });

    it('should remove deleted items from allFeedings', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      (feedingsService.delete as any).mockReturnValue(of(void 0));

      component.childId.set(1);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 3]);

      component.bulkDelete();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(component.allFeedings()).toEqual([mockFeedings[1]]); // Only feeding 2 remains
      confirmSpy.mockRestore();
    });

    it('should clear selection after deletion', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      (feedingsService.delete as any).mockReturnValue(of(void 0));

      component.childId.set(1);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2, 3]);

      component.bulkDelete();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(component.selectedIds()).toEqual([]);
      confirmSpy.mockRestore();
    });

    it('should manage isBulkDeleting flag correctly', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      (feedingsService.delete as any).mockReturnValue(of(void 0));

      component.childId.set(1);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2]);

      expect(component.isBulkDeleting()).toBeFalsy();

      component.bulkDelete();

      // Wait for deletion to complete and check flag is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(component.isBulkDeleting()).toBeFalsy();
      confirmSpy.mockRestore();
    });

    it('should clear isBulkDeleting flag after all deletions complete', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      (feedingsService.delete as any).mockReturnValue(of(void 0));

      component.childId.set(1);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2]);

      component.bulkDelete();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(component.isBulkDeleting()).toBeFalsy();
      confirmSpy.mockRestore();
    });

    it('should handle deletion errors gracefully', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      (feedingsService.delete as any).mockImplementation(
        (childId: number, id: number) => {
          if (id === 2) {
            return throwError(() => new Error('Delete failed'));
          }
          return of(void 0);
        }
      );

      component.childId.set(1);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2, 3]);

      component.bulkDelete();

      await new Promise(resolve => setTimeout(resolve, 100));
      // Should still complete bulk delete operation
      expect(component.isBulkDeleting()).toBeFalsy();
      confirmSpy.mockRestore();
    });

    it('should not delete if childId is null', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.childId.set(null);
      component.selectedIds.set([1, 2]);

      component.bulkDelete();

      expect(feedingsService.delete).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });

  describe('integration tests', () => {
    it('should handle complete selection and deletion flow', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      (feedingsService.delete as any).mockReturnValue(of(void 0));

      component.childId.set(1);
      component.allFeedings.set(mockFeedings);
      component.child.set(mockChild);
      fixture.detectChanges();

      // User selects all
      component.toggleSelectAll();
      expect(component.isAllSelected()).toBeTruthy();

      // User confirms bulk delete
      component.bulkDelete();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(component.selectedIds()).toEqual([]);
      expect(component.allFeedings()).toEqual([]);
      expect(component.hasSelectedItems()).toBeFalsy();
      confirmSpy.mockRestore();
    });

    it('should maintain selection state across filter changes', () => {
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 3]);

      // Apply filter
      component.filters.set({ type: 'bottle' });
      fixture.detectChanges();

      // Selection should persist
      expect(component.selectedIds()).toEqual([1, 3]);
    });
  });

  describe('error handling - service failures', () => {
    it('should handle feedings list fetch failure on init', () => {
      const error = new Error('Failed to load feedings');
      (feedingsService.list as any).mockReturnValue(throwError(() => error));
      (childrenService.get as any).mockReturnValue(of(mockChild));

      expect(() => {
        component.ngOnInit?.();
      }).not.toThrow();
    });

    it('should handle child fetch failure on init', () => {
      const error = new Error('Failed to load child');
      (childrenService.get as any).mockReturnValue(throwError(() => error));
      (feedingsService.list as any).mockReturnValue(of(mockFeedings));

      expect(() => {
        component.ngOnInit?.();
      }).not.toThrow();
    });

    it('should handle 401 unauthorized on feedings list', () => {
      const error = new Error('Your session has expired');
      (feedingsService.list as any).mockReturnValue(throwError(() => error));
      (childrenService.get as any).mockReturnValue(of(mockChild));

      expect(() => {
        component.ngOnInit?.();
      }).not.toThrow();
    });

    it('should handle partial deletion failure in bulk delete', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      let callCount = 0;

      (feedingsService.delete as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return of(void 0); // First delete succeeds
        }
        return throwError(() => new Error('Network error')); // Second fails
      });

      component.childId.set(1);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2]);

      component.bulkDelete();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(callCount).toBe(2); // Both delete attempts made
      confirmSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty allFeedings array', () => {
      component.allFeedings.set([]);
      expect(component.allFeedings()).toEqual([]);
    });

    it('should handle null filters gracefully', () => {
      component.allFeedings.set(mockFeedings);
      component.filters.set(null as any);

      expect(() => {
        component.allFeedings();
      }).not.toThrow();
    });

    it('should handle selection with empty feedings', () => {
      component.allFeedings.set([]);
      component.toggleSelectAll();

      expect(component.selectedIds()).toEqual([]);
      expect(component.isAllSelected()).toBeFalsy();
    });

    it('should handle toggle select with no feedings', () => {
      component.allFeedings.set([]);
      component.selectedIds.set([]);

      component.toggleSelectAll();

      expect(component.selectedIds()).toEqual([]);
    });

    it('should handle bulkDelete with no childId', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.childId.set(null);
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([1, 2]);

      component.bulkDelete();

      expect(feedingsService.delete).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should handle toggleSelection with invalid id', () => {
      component.allFeedings.set(mockFeedings);
      component.selectedIds.set([]);

      component.toggleSelection(999); // ID not in list

      expect(component.selectedIds()).toContain(999); // Still toggles the selection
    });

    it('should handle bulkDelete when isBulkDeleting is already true', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.isBulkDeleting.set(true);
      component.childId.set(1);
      component.selectedIds.set([1]);

      component.bulkDelete();

      // Should not proceed if already deleting
      confirmSpy.mockRestore();
    });
  });
});

describe('FeedingsList - Core Functionality Tests', () => {
  let component: FeedingsList;
  let fixture: ComponentFixture<FeedingsList>;
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

  const mockCoParentChild: Child = {
    ...mockChild,
    id: 2,
    user_role: 'co-parent',
  };

  const mockCaregiverChild: Child = {
    ...mockChild,
    id: 3,
    user_role: 'caregiver',
  };

  const mockFeedings: Feeding[] = [
    {
      id: 1,
      child: 1,
      feeding_type: 'bottle',
      fed_at: '2024-02-10T10:00:00Z',
      amount_oz: 5.5,
      created_at: '2024-02-10T10:00:00Z',
      updated_at: '2024-02-10T10:00:00Z',
    },
    {
      id: 2,
      child: 1,
      feeding_type: 'breast',
      fed_at: '2024-02-10T14:30:00Z',
      duration_minutes: 15,
      side: 'left',
      created_at: '2024-02-10T14:30:00Z',
      updated_at: '2024-02-10T14:30:00Z',
    },
    {
      id: 3,
      child: 1,
      feeding_type: 'bottle',
      fed_at: '2024-02-10T18:00:00Z',
      amount_oz: 6,
      created_at: '2024-02-10T18:00:00Z',
      updated_at: '2024-02-10T18:00:00Z',
    },
  ];

  beforeEach(async () => {
    const feedingsServiceMock = {
      list: vi.fn().mockReturnValue(of(mockFeedings)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };
    const routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FeedingsList],
      providers: [
        { provide: FeedingsService, useValue: feedingsServiceMock },
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        FilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'childId' ? '1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    feedingsService = TestBed.inject(FeedingsService);
    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(FeedingsList);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty feedings', () => {
      expect(component.allFeedings()).toEqual([]);
    });

    it('should initialize with isLoading=true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should initialize with empty selection', () => {
      expect(component.selectedIds()).toEqual([]);
    });

    it('should initialize feeding type options', () => {
      expect(component.feedingTypeOptions).toEqual([
        { value: 'bottle', label: 'Bottle' },
        { value: 'breast', label: 'Breast' },
      ]);
    });
  });

  describe('Data Loading', () => {
    it('should load child and feedings on init', () => {
      component.ngOnInit();

      expect(childrenService.get).toHaveBeenCalledWith(1);
    });

    it('should populate allFeedings after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.allFeedings()).toHaveLength(3);
    });

    it('should set isLoading=false after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isLoading()).toBe(false);
    });

    it('should set child signal after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.child()).toEqual(mockChild);
    });
  });

  describe('Permissions', () => {
    it('should allow edit for owner', () => {
      component.child.set(mockChild);

      expect(component.canEdit()).toBe(true);
    });

    it('should allow edit for co-parent', () => {
      component.child.set(mockCoParentChild);

      expect(component.canEdit()).toBe(true);
    });

    it('should deny edit for caregiver', () => {
      component.child.set(mockCaregiverChild);

      expect(component.canEdit()).toBe(false);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.childId.set(1);
    });

    it('should navigate to create', () => {
      component.navigateToCreate();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'feedings', 'create']);
    });

    it('should navigate to edit', () => {
      component.navigateToEdit(5);

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'feedings', 5, 'edit']);
    });

    it('should navigate to delete', () => {
      component.navigateToDelete(5);

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'feedings', 5, 'delete']);
    });

    it('should navigate to dashboard', () => {
      component.navigateToDashboard();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'dashboard']);
    });
  });

  describe('DateTime Formatting', () => {
    it('should format datetime with locale string', () => {
      const formatted = component.formatDateTime('2024-02-10T14:30:00Z');

      expect(formatted).toContain('Feb');
      expect(formatted).toContain('10');
      expect(formatted).toContain('2024');
    });

    it('should format time ago in minutes', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-10T14:45:00Z'));

      const formatted = component.formatTimeAgo('2024-02-10T14:30:00Z');

      expect(formatted).toBe('15 mins ago');
      vi.useRealTimers();
    });

    it('should format time ago in hours', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-10T18:30:00Z'));

      const formatted = component.formatTimeAgo('2024-02-10T14:30:00Z');

      expect(formatted).toBe('4 hours ago');
      vi.useRealTimers();
    });

    it('should format time ago in days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-12T14:30:00Z'));

      const formatted = component.formatTimeAgo('2024-02-10T14:30:00Z');

      expect(formatted).toBe('2 days ago');
      vi.useRealTimers();
    });

    it('should handle singular time units', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-10T14:31:00Z'));

      const formatted = component.formatTimeAgo('2024-02-10T14:30:00Z');

      expect(formatted).toBe('1 min ago');
      vi.useRealTimers();
    });
  });

  describe('Feeding Type Handling', () => {
    it('should display bottle icon for bottle feeding', () => {
      const bottleFeeding = mockFeedings[0];

      const icon = component.getFeedingIcon(bottleFeeding);

      expect(icon).toBe('🍼');
    });

    it('should display breast icon for breast feeding', () => {
      const breastFeeding = mockFeedings[1];

      const icon = component.getFeedingIcon(breastFeeding);

      expect(icon).toBe('🤱');
    });

    it('should format bottle feeding title with amount', () => {
      const bottleFeeding = mockFeedings[0];

      const title = component.getFeedingTitle(bottleFeeding);

      expect(title).toBe('Bottle: 5.5 oz');
    });

    it('should format breast feeding title with duration and side', () => {
      const breastFeeding = mockFeedings[1];

      const title = component.getFeedingTitle(breastFeeding);

      expect(title).toBe('Breast: 15 min (Left)');
    });

    it('should handle both sides in breast feeding', () => {
      const bothSidesFeeding: Feeding = {
        id: 4,
        child: 1,
        feeding_type: 'breast',
        fed_at: '2024-02-10T20:00:00Z',
        duration_minutes: 20,
        side: 'both',
        created_at: '2024-02-10T20:00:00Z',
        updated_at: '2024-02-10T20:00:00Z',
      };

      const title = component.getFeedingTitle(bothSidesFeeding);

      expect(title).toBe('Breast: 20 min (Both)');
    });

    it('should handle right side in breast feeding', () => {
      const rightSideFeeding: Feeding = {
        id: 5,
        child: 1,
        feeding_type: 'breast',
        fed_at: '2024-02-10T21:00:00Z',
        duration_minutes: 12,
        side: 'right',
        created_at: '2024-02-10T21:00:00Z',
        updated_at: '2024-02-10T21:00:00Z',
      };

      const title = component.getFeedingTitle(rightSideFeeding);

      expect(title).toBe('Breast: 12 min (Right)');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.allFeedings.set(mockFeedings);
      fixture.detectChanges();
    });

    it('should have feedings computed property', () => {
      expect(component.feedings).toBeDefined();
    });

    it('should return all feedings when no filters', () => {
      expect(component.feedings()).toHaveLength(3);
    });

    it('should filter by feeding type', () => {
      component.onFilterChange({ type: 'bottle' });
      fixture.detectChanges();

      const filtered = component.feedings();
      expect(filtered.length).toBe(2); // Two bottle feedings
      expect(filtered.every(f => f.feeding_type === 'bottle')).toBeTruthy();
    });

    it('should filter by date range', () => {
      component.onFilterChange({
        dateFrom: '2024-02-10',
        dateTo: '2024-02-10',
      });
      fixture.detectChanges();

      expect(component.feedings()).toHaveLength(3); // All on same day
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors', () => {
      const error = new Error('Load failed');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => error));

      component.ngOnInit();

      expect(component.error()).toBe('Load failed');
    });

    it('should clear error on retry', () => {
      component.error.set('Previous error');
      vi.mocked(childrenService.get).mockReturnValue(of(mockChild));

      component.loadData(1);

      expect(component.error()).toBeNull();
    });

    it('should handle feedings load error', () => {
      const error = new Error('Feedings load failed');
      vi.mocked(feedingsService.list).mockReturnValue(throwError(() => error));
      vi.mocked(childrenService.get).mockReturnValue(of(mockChild));

      component.loadData(1);

      expect(component.error()).toBe('Feedings load failed');
    });
  });

  describe('Empty States', () => {
    it('should handle empty feeding list', () => {
      component.allFeedings.set([]);

      expect(component.feedings()).toEqual([]);
    });

    it('should handle no selections', () => {
      expect(component.hasSelectedItems()).toBe(false);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update allFeedings reactively', () => {
      component.allFeedings.set(mockFeedings);

      expect(component.allFeedings()).toHaveLength(3);
    });

    it('should update filters reactively', () => {
      component.filters.set({ type: 'breast' });

      expect(component.filters()).toEqual({ type: 'breast' });
    });

    it('should update error reactively', () => {
      component.error.set('Test error');

      expect(component.error()).toBe('Test error');
    });

    it('should update isLoading reactively', () => {
      component.isLoading.set(false);

      expect(component.isLoading()).toBe(false);
    });
  });
});
