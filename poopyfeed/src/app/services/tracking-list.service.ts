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

/**
 * Configuration for TrackingListService (per resource type).
 *
 * @template T - Item type (e.g. Feeding, DiaperChange, Nap)
 * @interface TrackingListConfig
 */
export interface TrackingListConfig<T> {
  /** Property name for timestamp (e.g. 'fed_at', 'changed_at') */
  timestampField: keyof T;
  /** Property name for type (e.g. 'feeding_type', 'change_type'); optional */
  typeField?: keyof T;
  /** Human-readable name for confirm messages (e.g. 'feedings') */
  resourceName: string;
  /** Function to build bulk-delete confirmation message */
  deleteConfirmMessage: (count: number) => string;
}

/**
 * Generic service for tracking list state and operations.
 *
 * @template T - Item type with at least { id: number }
 */
@Injectable({ providedIn: 'root' })
export class TrackingListService<T extends { id: number }> {
  /** Current items (filtered); set by list components. */
  items = signal<T[]>([]);
  /** All items from API; used for filtering. */
  allItems = signal<T[]>([]);
  /** Current filter criteria. */
  filters = signal<FilterCriteria>({});
  /** Set of selected item IDs for bulk actions. */
  selectedIds = signal<Set<number>>(new Set());
  /** True while loading list. */
  isLoading = signal(false);
  /** Error message to display; null when none. */
  error = signal<string | null>(null);
  /** True while bulk delete in progress. */
  isBulkDeleting = signal(false);
  /** Current child (for permission checks). */
  child = signal<Child | null>(null);

  private config!: TrackingListConfig<T>;

  /** Filtered items (currently same as allItems; backend does filtering). */
  filteredItems = computed(() => this.allItems());

  /** True if at least one item is selected. */
  hasSelectedItems = computed(() => this.selectedIds().size > 0);

  /** True if all visible items are selected. */
  isAllSelected = computed(() => {
    const items = this.filteredItems();
    return items.length > 0 && this.selectedIds().size === items.length;
  });

  /** True if user can edit/delete (owner or co-parent). */
  canEdit = computed(() => {
    const role = this.child()?.user_role;
    return role === 'owner' || role === 'co-parent';
  });

  /**
   * Initialize with component-specific configuration. Call before use.
   *
   * @param config - Timestamp/type fields, resource name, delete message
   */
  initialize(config: TrackingListConfig<T>): void {
    this.config = config;
  }

  /**
   * Toggle selection of a single item by ID.
   *
   * @param id - Item ID to toggle
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
