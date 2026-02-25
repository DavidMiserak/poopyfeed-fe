/**
 * Generic filtering service for tracking lists.
 *
 * Provides utilities for date-range and type filtering.
 * Used by Feedings, Diapers, and Naps list components.
 */

import { inject, Injectable } from '@angular/core';
import { DateTimeService } from './datetime.service';

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
  private datetimeService = inject(DateTimeService);

  /**
   * Filter items by date range and optional type.
   *
   * Supports flexible timestamp field names for different resource types:
   * - fed_at (feedings)
   * - changed_at (diapers)
   * - napped_at (naps)
   *
   * Date comparisons use the user's configured timezone to determine which
   * calendar day a UTC timestamp falls on.
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
        const timestamp = itemRecord[timestampField] as string;
        if (!timestamp) return false;

        const itemDateStr = this.datetimeService.getDateInUserTimezone(timestamp);

        if (criteria.dateFrom && itemDateStr < criteria.dateFrom) return false;
        if (criteria.dateTo && itemDateStr > criteria.dateTo) return false;
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
   * Get today's date as ISO string (YYYY-MM-DD) in user's timezone.
   */
  getTodayAsIsoString(): string {
    return this.datetimeService.getTodayInUserTimezone();
  }

  /**
   * Get date N days ago as ISO string (YYYY-MM-DD) in user's timezone.
   *
   * @param daysAgo Number of days in the past
   * @returns ISO date string
   */
  getDateNDaysAgoAsIsoString(daysAgo: number): string {
    return this.datetimeService.getDateNDaysAgoInUserTimezone(daysAgo);
  }

  /**
   * Format ISO date string for display (Mon, Jan 15).
   *
   * @param isoDate ISO date string (YYYY-MM-DD)
   * @returns Formatted date string
   */
  formatDateForDisplay(isoDate: string): string {
    return this.datetimeService.formatDateForDisplay(isoDate);
  }
}
