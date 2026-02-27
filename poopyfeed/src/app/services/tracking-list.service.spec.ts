/**
 * Tests for TrackingListService<T>
 *
 * Verifies filtering, selection, bulk operations, and computed state
 */

import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { TrackingListService } from './tracking-list.service';
import { FilterService } from './filter.service';
import { AccountService } from './account.service';
import { Child } from '../models/child.model';

interface TestItem {
  id: number;
  fed_at?: string;
  feeding_type?: 'bottle' | 'breast';
}

describe('TrackingListService<T>', () => {
  let service: TrackingListService<TestItem>;
  let filterService: FilterService;

  const mockChild: Child = {
    id: 1,
    name: 'Baby',
    date_of_birth: '2024-01-01',
    gender: 'M',
    user_role: 'owner',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_diaper_change: '2024-01-01T12:00:00Z',
    last_nap: '2024-01-01T11:00:00Z',
    last_feeding: '2024-01-01T10:00:00Z',
    custom_bottle_low_oz: null,
    custom_bottle_mid_oz: null,
    custom_bottle_high_oz: null,
        feeding_reminder_interval: null,

  };

  const mockItems: TestItem[] = [
    { id: 1, fed_at: '2024-01-01T10:00:00Z', feeding_type: 'bottle' },
    { id: 2, fed_at: '2024-01-01T14:00:00Z', feeding_type: 'breast' },
    { id: 3, fed_at: '2024-01-02T10:00:00Z', feeding_type: 'bottle' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrackingListService,
        FilterService,
        {
          provide: AccountService,
          useValue: { profile: signal(null) },
        },
      ],
    });
    service = TestBed.inject(TrackingListService<TestItem>);
    filterService = TestBed.inject(FilterService);
  });

  describe('Initialization & Signals', () => {
    it('should initialize with correct default values', () => {
      expect(service.items()).toEqual([]);
      expect(service.allItems()).toEqual([]);
      expect(service.filters()).toEqual({});
      expect(service.selectedIds()).toEqual([]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.isBulkDeleting()).toBe(false);
      expect(service.child()).toBeNull();
    });

    it('should reset all state via reset()', () => {
      service.items.set([{ id: 1 }]);
      service.selectedIds.set([1, 2]);
      service.isLoading.set(true);
      service.error.set('Error message');
      service.child.set(mockChild);

      service.reset();

      expect(service.items()).toEqual([]);
      expect(service.selectedIds()).toEqual([]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.child()).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      service.initialize({
        timestampField: 'fed_at',
        typeField: 'feeding_type',
        resourceName: 'feeding',
        deleteConfirmMessage: (count: number) => `Delete ${count}?`,
      });
    });

    it('should compute hasSelectedItems correctly', () => {
      expect(service.hasSelectedItems()).toBe(false);

      service.selectedIds.set([1]);
      expect(service.hasSelectedItems()).toBe(true);

      service.selectedIds.set([]);
      expect(service.hasSelectedItems()).toBe(false);
    });

    it('should compute isAllSelected correctly', () => {
      service.allItems.set(mockItems);

      expect(service.isAllSelected()).toBe(false);

      service.selectedIds.set([1, 2, 3]);
      expect(service.isAllSelected()).toBe(true);

      service.selectedIds.set([1, 2]);
      expect(service.isAllSelected()).toBe(false);
    });

    it('should compute canEdit correctly for owner', () => {
      service.child.set(mockChild);
      expect(service.canEdit()).toBe(true);
    });

    it('should compute canEdit correctly for co-parent', () => {
      const coParent: Child = { ...mockChild, user_role: 'co-parent' };
      service.child.set(coParent);
      expect(service.canEdit()).toBe(true);
    });

    it('should compute canEdit correctly for caregiver', () => {
      const caregiver: Child = { ...mockChild, user_role: 'caregiver' };
      service.child.set(caregiver);
      expect(service.canEdit()).toBe(false);
    });

    it('should compute canEdit false when child is null', () => {
      service.child.set(null);
      expect(service.canEdit()).toBe(false);
    });

    it('should compute filteredItems using FilterService', () => {
      const filtered = [mockItems[0], mockItems[2]];
      vi.spyOn(filterService, 'filter').mockReturnValue(filtered);

      service.allItems.set(mockItems);
      service.filters.set({ type: 'bottle' });

      expect(service.filteredItems()).toEqual(filtered);
      expect(filterService.filter).toHaveBeenCalledWith(
        mockItems,
        { type: 'bottle' },
        'fed_at',
        'feeding_type'
      );
    });
  });

  describe('Selection Operations', () => {
    beforeEach(() => {
      service.initialize({
        timestampField: 'fed_at',
        resourceName: 'feeding',
        deleteConfirmMessage: (count: number) => `Delete ${count}?`,
      });
      service.allItems.set(mockItems);
    });

    it('should toggle selection for single item', () => {
      expect(service.selectedIds()).toEqual([]);

      service.toggleSelection(1);
      expect(service.selectedIds()).toEqual([1]);

      service.toggleSelection(1);
      expect(service.selectedIds()).toEqual([]);
    });

    it('should toggle selection for multiple items', () => {
      service.toggleSelection(1);
      service.toggleSelection(2);
      expect(service.selectedIds()).toEqual([1, 2]);

      service.toggleSelection(3);
      expect(service.selectedIds()).toEqual([1, 2, 3]);

      service.toggleSelection(2);
      expect(service.selectedIds()).toEqual([1, 3]);
    });

    it('should toggle select all filtered items', () => {
      expect(service.selectedIds()).toEqual([]);

      service.toggleSelectAll();
      expect(service.selectedIds()).toEqual([1, 2, 3]);

      service.toggleSelectAll();
      expect(service.selectedIds()).toEqual([]);
    });

    it('should clear selection', () => {
      service.selectedIds.set([1, 2, 3]);
      expect(service.selectedIds()).toEqual([1, 2, 3]);

      service.clearSelection();
      expect(service.selectedIds()).toEqual([]);
    });
  });

  describe('Bulk Delete Operations', () => {
    beforeEach(() => {
      service.initialize({
        timestampField: 'fed_at',
        resourceName: 'feeding',
        deleteConfirmMessage: (count: number) => `Delete ${count}?`,
      });
      service.allItems.set(mockItems);
      service.selectedIds.set([1, 2]);
    });

    it('should cancel bulk delete on user rejection', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const deleteFunc = vi.fn().mockReturnValue(of(undefined));

      service.bulkDelete(deleteFunc);

      expect(deleteFunc).not.toHaveBeenCalled();
      expect(service.allItems()).toEqual(mockItems);
      expect(service.selectedIds()).toEqual([1, 2]);
    });

    it('should delete all selected items sequentially', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const deleteFunc = vi.fn().mockReturnValue(of(undefined));

      service.bulkDelete(deleteFunc);

      expect(deleteFunc).toHaveBeenCalledWith(1);
      expect(deleteFunc).toHaveBeenCalledWith(2);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(service.allItems()).toEqual([mockItems[2]]);
      expect(service.selectedIds()).toEqual([]);
      expect(service.isBulkDeleting()).toBe(false);
    });

    it('should set isBulkDeleting during operation', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      // Use a subject to control when the observable completes
      const subject = new Subject<void>();
      const deleteFunc = vi.fn().mockReturnValue(subject.asObservable());

      expect(service.isBulkDeleting()).toBe(false);

      service.bulkDelete(deleteFunc);
      expect(service.isBulkDeleting()).toBe(true);

      // Complete the observables to clean up
      subject.complete();
    });

    it('should show confirmation message with item count', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const deleteFunc = vi.fn().mockReturnValue(of(undefined));

      service.bulkDelete(deleteFunc);

      expect(window.confirm).toHaveBeenCalledWith('Delete 2?');
    });
  });

  describe('Filter Operations', () => {
    beforeEach(() => {
      service.initialize({
        timestampField: 'fed_at',
        typeField: 'feeding_type',
        resourceName: 'feeding',
        deleteConfirmMessage: (count: number) => `Delete ${count}?`,
      });
      service.allItems.set(mockItems);
    });

    it('should update filters signal', () => {
      expect(service.filters()).toEqual({});

      service.filters.set({ type: 'bottle' });
      expect(service.filters()).toEqual({ type: 'bottle' });

      service.filters.set({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });
      expect(service.filters()).toEqual({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });
    });

    it('should trigger filteredItems update when filters change', () => {
      const filtered = [mockItems[0]];
      const filterSpy = vi.spyOn(filterService, 'filter').mockReturnValue(filtered);

      service.filters.set({ type: 'bottle' });

      // Access the computed signal to trigger evaluation
      const result = service.filteredItems();

      expect(filterSpy).toHaveBeenCalledWith(
        mockItems,
        { type: 'bottle' },
        'fed_at',
        'feeding_type'
      );
      expect(result).toEqual(filtered);
    });
  });

  describe('State Management Integration', () => {
    beforeEach(() => {
      service.initialize({
        timestampField: 'fed_at',
        resourceName: 'feeding',
        deleteConfirmMessage: (count: number) => `Delete ${count}?`,
      });
    });

    it('should update child and verify role-based access', () => {
      expect(service.canEdit()).toBe(false);

      service.child.set(mockChild);
      expect(service.canEdit()).toBe(true);

      const caregiver: Child = { ...mockChild, user_role: 'caregiver' };
      service.child.set(caregiver);
      expect(service.canEdit()).toBe(false);
    });

    it('should handle error state', () => {
      expect(service.error()).toBeNull();

      service.error.set('Network error');
      expect(service.error()).toBe('Network error');

      service.error.set(null);
      expect(service.error()).toBeNull();
    });

    it('should handle loading state', () => {
      expect(service.isLoading()).toBe(false);

      service.isLoading.set(true);
      expect(service.isLoading()).toBe(true);

      service.isLoading.set(false);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      service.initialize({
        timestampField: 'fed_at',
        resourceName: 'feeding',
        deleteConfirmMessage: (count: number) => `Delete ${count}?`,
      });
    });

    it('should handle empty allItems', () => {
      service.allItems.set([]);
      expect(service.isAllSelected()).toBe(false);
      expect(service.filteredItems()).toEqual([]);
    });

    it('should handle selection of non-existent items', () => {
      service.allItems.set(mockItems);
      service.toggleSelection(999);
      expect(service.selectedIds()).toEqual([999]);
    });

    it('should handle multiple toggleSelectAll calls', () => {
      service.allItems.set(mockItems);

      service.toggleSelectAll();
      expect(service.isAllSelected()).toBe(true);

      service.toggleSelectAll();
      expect(service.isAllSelected()).toBe(false);

      service.toggleSelectAll();
      expect(service.isAllSelected()).toBe(true);
    });
  });
});
