/**
 * DateTime utility service for timezone conversions
 * Handles conversion between local time and UTC for API interactions
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateTimeService {
  /**
   * Convert local Date to UTC ISO 8601 string for API
   * @param localDate - Local Date object
   * @returns ISO 8601 UTC string (e.g., "2024-01-15T10:30:00Z")
   */
  toUTC(localDate: Date): string {
    return localDate.toISOString();
  }

  /**
   * Parse UTC ISO 8601 string from API to local Date
   * @param utcString - ISO 8601 UTC string from API
   * @returns Local Date object
   */
  toLocal(utcString: string): Date {
    return new Date(utcString);
  }

  /**
   * Format Date for datetime-local input (YYYY-MM-DDTHH:mm)
   * Datetime-local inputs expect local time in this format
   * @param date - Date object to format
   * @returns String formatted for datetime-local input
   */
  toInputFormat(date: Date): string {
    // Get local time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Parse datetime-local input value to local Date
   * @param input - Input value from datetime-local field (YYYY-MM-DDTHH:mm)
   * @returns Local Date object
   */
  fromInputFormat(input: string): Date {
    // datetime-local format is already in local time
    return new Date(input);
  }

  /**
   * Get current local time formatted for datetime-local input
   * Useful for setting default values
   * @returns Current time in datetime-local format
   */
  nowAsInputFormat(): string {
    return this.toInputFormat(new Date());
  }
}
