/**
 * DateTime utility service for timezone conversions.
 *
 * Handles conversion between local time and UTC for API interactions using
 * the user's configured timezone (from AccountService profile). All API
 * timestamps are ISO 8601 UTC; this service formats for display and
 * parses datetime-local input in the user's timezone.
 */

import { inject, Injectable } from '@angular/core';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root',
})
export class DateTimeService {
  private accountService = inject(AccountService);

  /**
   * User's configured timezone (IANA, e.g. America/New_York).
   *
   * @returns Timezone string; defaults to 'UTC' if profile not loaded
   */
  get userTimezone(): string {
    return this.accountService.profile()?.timezone || 'UTC';
  }

  /**
   * Parse an ISO datetime string from the API as UTC.
   * If the string has no timezone (Z or ±HH:MM), appends 'Z' so it is not
   * interpreted as local time (which would break day filtering and display).
   */
  private parseAsUtc(iso: string): Date {
    const s = iso.trim();
    if (s.includes('T') && !s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
      return new Date(s + 'Z');
    }
    return new Date(s);
  }

  /**
   * Get YYYY-MM-DD for a UTC timestamp in user's timezone.
   *
   * Uses Intl.DateTimeFormat with 'en-CA' locale which natively produces YYYY-MM-DD.
   *
   * @param date - Date object or ISO string to convert
   * @returns YYYY-MM-DD string in user's timezone
   */
  getDateInUserTimezone(date: Date | string): string {
    const d = typeof date === 'string' ? this.parseAsUtc(date) : date;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  /**
   * Get today's YYYY-MM-DD in user's timezone.
   */
  getTodayInUserTimezone(): string {
    return this.getDateInUserTimezone(new Date());
  }

  /**
   * Check if UTC timestamp is "today" in user's timezone.
   *
   * @param utcTimestamp ISO datetime string from API
   * @returns True if the timestamp falls on today in user's timezone
   */
  isTodayInUserTimezone(utcTimestamp: string): boolean {
    return (
      this.getDateInUserTimezone(utcTimestamp) ===
      this.getTodayInUserTimezone()
    );
  }

  /**
   * Get YYYY-MM-DD for N days ago in user's timezone.
   *
   * Uses the user's "today" (from profile timezone), subtracts N calendar days
   * at noon UTC to avoid DST boundary issues, then formats in user TZ.
   *
   * @param daysAgo Number of days in the past
   * @returns YYYY-MM-DD string
   */
  getDateNDaysAgoInUserTimezone(daysAgo: number): string {
    const todayStr = this.getTodayInUserTimezone();
    const [y, m, d] = todayStr.split('-').map(Number);
    const ref = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    ref.setTime(ref.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return this.getDateInUserTimezone(ref);
  }

  /**
   * Get YYYY-MM-DD for tomorrow in user's timezone.
   *
   * Used for date-range end boundaries (e.g. "include all of today").
   *
   * @returns YYYY-MM-DD string
   */
  getTomorrowInUserTimezone(): string {
    const todayStr = this.getTodayInUserTimezone();
    const [y, m, d] = todayStr.split('-').map(Number);
    const ref = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    ref.setTime(ref.getTime() + 24 * 60 * 60 * 1000);
    return this.getDateInUserTimezone(ref);
  }

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
    return this.parseAsUtc(utcString);
  }

  /**
   * Format a Date (or UTC string) for datetime-local input (YYYY-MM-DDTHH:mm)
   * in the user's configured timezone.
   *
   * @param date - Date object or UTC string to format
   * @returns String formatted for datetime-local input in user's timezone
   */
  toInputFormat(date: Date | string): string {
    const d = typeof date === 'string' ? this.parseAsUtc(date) : date;
    const tz = this.userTimezone;
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);

    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value || '';

    const year = get('year');
    const month = get('month');
    const day = get('day');
    let hours = get('hour');
    const minutes = get('minute');

    // Intl may return '24' for midnight in some locales — normalize to '00'
    if (hours === '24') {
      hours = '00';
    }

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Parse datetime-local input value to a UTC Date.
   *
   * The input value represents a date/time in the user's timezone.
   * This method constructs the correct UTC Date by calculating the offset.
   *
   * @param input - Input value from datetime-local field (YYYY-MM-DDTHH:mm)
   * @returns Date object representing the UTC instant
   */
  fromInputFormat(input: string): Date {
    // Parse the input components
    const [datePart, timePart] = input.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create a date assuming browser local timezone first
    const localGuess = new Date(year, month - 1, day, hours, minutes);

    // Get what the user's timezone offset is at this point in time
    // by formatting back and comparing
    const formatted = this.toInputFormat(localGuess);
    const [fDatePart, fTimePart] = formatted.split('T');
    const [fYear, fMonth, fDay] = fDatePart.split('-').map(Number);
    const [fHours, fMinutes] = fTimePart.split(':').map(Number);

    // Calculate the difference between what we got and what we wanted
    const got = new Date(fYear, fMonth - 1, fDay, fHours, fMinutes);
    const diffMs = got.getTime() - localGuess.getTime();

    // Adjust by the difference to get the correct UTC instant
    return new Date(localGuess.getTime() - diffMs);
  }

  /**
   * Get current local time formatted for datetime-local input
   * Useful for setting default values
   * @returns Current time in datetime-local format in user's timezone
   */
  nowAsInputFormat(): string {
    return this.toInputFormat(new Date());
  }

  /**
   * Format a UTC timestamp as a full date-time string in the user's timezone.
   *
   * Output: "Jan 15, 2024, 3:30 PM"
   *
   * @param utcString ISO datetime string from API
   * @returns Localized date-time string in user's timezone
   */
  formatDateTime(utcString: string): string {
    const date = this.parseAsUtc(utcString);
    return date.toLocaleString('en-US', {
      timeZone: this.userTimezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format a UTC timestamp as time-only in the user's timezone.
   *
   * Output: "3:30 PM"
   *
   * @param utcString ISO datetime string from API
   * @returns Localized time string in user's timezone
   */
  formatTimeOnly(utcString: string): string {
    const date = this.parseAsUtc(utcString);
    return date.toLocaleString('en-US', {
      timeZone: this.userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format an ISO date string (YYYY-MM-DD) for display.
   *
   * Output: "Mon, Jan 15"
   *
   * The input is a date-only string (no time component), so we anchor it
   * at noon UTC to avoid any day-shift from timezone conversion.
   *
   * @param isoDate ISO date string (YYYY-MM-DD)
   * @returns Formatted date string
   */
  formatDateForDisplay(isoDate: string): string {
    const date = new Date(isoDate + 'T12:00:00Z');
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format a UTC timestamp as 24h time (HH:mm) in user's timezone.
   *
   * Output: "15:30"
   *
   * @param utcString ISO datetime string from API
   * @returns 24-hour time string in user's timezone
   */
  formatTime24h(utcString: string): string {
    const date = this.parseAsUtc(utcString);
    return date.toLocaleTimeString('en-US', {
      timeZone: this.userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  /**
   * Format a UTC timestamp as "HH:mm" using Intl to guarantee consistent output.
   *
   * Used by timeline gap indicators where we need exact HH:mm format.
   *
   * @param utcString ISO datetime string from API
   * @returns "HH:mm" string in user's timezone
   */
  formatTimeHHmm(utcString: string): string {
    const date = this.parseAsUtc(utcString);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value || '';

    let hours = get('hour');
    if (hours === '24') {
      hours = '00';
    }
    return `${hours}:${get('minute')}`;
  }

  /**
   * Get the browser's IANA timezone identifier.
   *
   * Returns null during SSR where Intl is not available.
   */
  static getBrowserTimezone(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }
  }
}
