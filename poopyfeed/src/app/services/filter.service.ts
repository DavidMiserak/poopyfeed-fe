/**
 * Generic filtering service for tracking lists.
 *
 * Provides utilities for date-range and type filtering.
 * Used by Feedings, Diapers, and Naps list components.
 */

import { Injectable } from '@angular/core';

/**
 * Generic filter criteria that all tracking types support
 */
export interface FilterCriteria {
  dateFrom?: string; // ISO string (YYYY-MM-DD)
  dateTo?: string; // ISO string (YYYY-MM-DD)
  type?: string; // Activity type (feeding_type, change_type, etc.)
}

/**
 * Item with timestamp property - generic type for flexible filtering
 */
export type TimestampedItem = Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  /**
   * Filter items by date range and optional type.
   *
   * Supports flexible timestamp field names for different resource types:
   * - fed_at (feedings)
   * - changed_at (diapers)
   * - napped_at (naps)
   *
   * @param items Items to filter
   * @param criteria Filter criteria (dates and optional type)
   * @param timestampField Name of timestamp property on items
   * @param typeField Name of type property on items (for type filtering)
   * @returns Filtered array
   *
   * @example
   * // Filter feedings by date range and feeding type
   * const filtered = this.filterService.filter(
   *   feedings,
   *   { dateFrom: '2024-01-01', dateTo: '2024-01-31', type: 'bottle' },
   *   'fed_at',
   *   'feeding_type'
   * );
   */
  filter<T>(
    items: T[],
    criteria: FilterCriteria,
    timestampField: string,
    typeField?: string
  ): T[] {
    if (!items.length) return items;

    return items.filter((item) => {
      // Date range filtering
      if (criteria.dateFrom || criteria.dateTo) {
        const itemRecord = item as Record<string, unknown>;
        const itemDate = this.extractDate(itemRecord[timestampField] as string);
        if (!itemDate) return false;

        if (criteria.dateFrom) {
          const fromDate = new Date(criteria.dateFrom);
          if (itemDate < fromDate) return false;
        }

        if (criteria.dateTo) {
          const toDate = new Date(criteria.dateTo);
          // Include entire dateTo day (add 1 day)
          toDate.setDate(toDate.getDate() + 1);
          if (itemDate >= toDate) return false;
        }
      }

      // Type filtering
      if (criteria.type && typeField) {
        const itemRecord = item as Record<string, unknown>;
        const itemType = itemRecord[typeField];
        if (itemType !== criteria.type) return false;
      }

      return true;
    });
  }

  /**
   * Extract date from ISO timestamp string.
   * Handles UTC conversion for comparison.
   *
   * @param timestamp ISO 8601 UTC timestamp
   * @returns Date object at start of day (local time)
   */
  private extractDate(timestamp: string): Date | null {
    if (!timestamp) return null;
    try {
      const date = new Date(timestamp);
      // Return start of day in local timezone
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } catch {
      return null;
    }
  }

  /**
   * Get today's date as ISO string (YYYY-MM-DD) in local timezone.
   */
  getTodayAsIsoString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Get date N days ago as ISO string (YYYY-MM-DD).
   *
   * @param daysAgo Number of days in the past
   * @returns ISO date string
   */
  getDateNDaysAgoAsIsoString(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  /**
   * Format ISO date string for display (Mon, Jan 15).
   *
   * @param isoDate ISO date string (YYYY-MM-DD)
   * @returns Formatted date string
   */
  formatDateForDisplay(isoDate: string): string {
    const date = new Date(isoDate + 'T00:00:00'); // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
}
