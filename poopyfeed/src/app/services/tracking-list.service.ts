/**
 * Generic service for managing tracking list state and operations.
 *
 * Consolidates filtering, selection, and bulk delete logic used across
 * feedings-list, diapers-list, and naps-list components.
 *
 * Provides signal-based state management for:
 * - Item filtering (via FilterService)
 * - Selection tracking (single items and bulk operations)
 * - Bulk deletion with sequential execution
 * - Role-based permission checking
 *
 * Each component provides a TrackingListConfig to adapt the service
 * to their specific needs (different timestamp fields, type fields, etc.)
 */

import { Injectable, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterCriteria } from './filter.service';
import { Child } from '../models/child.model';

export interface TrackingListConfig<T> {
  timestampField: keyof T;
  typeField?: keyof T;
  resourceName: string;
  deleteConfirmMessage: (count: number) => string;
}

@Injectable({ providedIn: 'root' })
export class TrackingListService<T extends { id: number }> {
  // Signals - mutable state
  items = signal<T[]>([]);
  allItems = signal<T[]>([]);
  filters = signal<FilterCriteria>({});
  selectedIds = signal<Set<number>>(new Set());
  isLoading = signal(false);
  error = signal<string | null>(null);
  isBulkDeleting = signal(false);
  child = signal<Child | null>(null);

  // Configuration (set during initialize())
  private config!: TrackingListConfig<T>;

  // Computed - derived state
  // Backend already returns filtered results via query params,
  // so no need to re-filter client-side.
  filteredItems = computed(() => this.allItems());

  hasSelectedItems = computed(() => this.selectedIds().size > 0);

  isAllSelected = computed(() => {
    const items = this.filteredItems();
    return items.length > 0 && this.selectedIds().size === items.length;
  });

  canEdit = computed(() => {
    const role = this.child()?.user_role;
    return role === 'owner' || role === 'co-parent';
  });

  /**
   * Initialize service with component-specific configuration.
   * Must be called before using the service.
   */
  initialize(config: TrackingListConfig<T>): void {
    this.config = config;
  }

  /**
   * Toggle selection of a single item by ID.
   * Adds ID if not selected, removes if already selected.
   */
  toggleSelection(id: number): void {
    const current = new Set(this.selectedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.selectedIds.set(current);
  }

  /**
   * Toggle selection of all filtered items.
   * If all are selected, clears selection. Otherwise selects all.
   */
  toggleSelectAll(): void {
    const items = this.filteredItems();
    if (this.isAllSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(items.map(item => item.id)));
    }
  }

  /**
   * Clear all selected items.
   */
  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  /**
   * Bulk delete selected items using provided delete function.
   * Shows confirmation dialog, then executes deletes sequentially.
   * Updates allItems and clears selection on completion.
   *
   * @param deleteFunction Function that deletes a single item by ID
   */
  bulkDelete(deleteFunction: (id: number) => Observable<void>): void {
    const ids = this.selectedIds();
    const count = ids.size;

    if (!confirm(this.config.deleteConfirmMessage(count))) {
      return;
    }

    this.isBulkDeleting.set(true);
    let completed = 0;

    ids.forEach(id => {
      deleteFunction(id).subscribe({
        next: () => {
          completed++;
          if (completed === ids.size) {
            // All deletions complete - update state
            this.allItems.set(
              this.allItems().filter(item => !ids.has(item.id))
            );
            this.selectedIds.set(new Set());
            this.isBulkDeleting.set(false);
          }
        },
        error: () => {
          completed++;
          if (completed === ids.size) {
            // Even on error, mark as complete to re-enable UI
            this.isBulkDeleting.set(false);
          }
        },
      });
    });
  }

  /**
   * Reset all service state to initial values.
   * Called when component is destroyed or data is reloaded.
   */
  reset(): void {
    this.items.set([]);
    this.allItems.set([]);
    this.filters.set({});
    this.selectedIds.set(new Set());
    this.isLoading.set(false);
    this.error.set(null);
    this.isBulkDeleting.set(false);
    this.child.set(null);
  }
}
