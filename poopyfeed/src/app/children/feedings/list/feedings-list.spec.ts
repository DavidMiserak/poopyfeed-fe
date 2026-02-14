import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedingsList } from './feedings-list';
import { FeedingsService } from '../../../services/feedings.service';
import { ChildrenService } from '../../../services/children.service';
import { FilterService } from '../../../services/filter.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Feeding } from '../../../models/feeding.model';
import { Child } from '../../../models/child.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

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
});
