/**
 * DateTime utility service for timezone conversions
 * Handles conversion between local time and UTC for API interactions,
 * using the user's configured timezone preference.
 */

import { inject, Injectable } from '@angular/core';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root',
})
export class DateTimeService {
  private accountService = inject(AccountService);

  /**
   * User's configured timezone, defaults to UTC if profile not loaded.
   */
  get userTimezone(): string {
    return this.accountService.profile()?.timezone || 'UTC';
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
    const d = typeof date === 'string' ? new Date(date) : date;
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
   * @param daysAgo Number of days in the past
   * @returns YYYY-MM-DD string
   */
  getDateNDaysAgoInUserTimezone(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return this.getDateInUserTimezone(date);
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
    return new Date(utcString);
  }

  /**
   * Format a Date (or UTC string) for datetime-local input (YYYY-MM-DDTHH:mm)
   * in the user's configured timezone.
   *
   * @param date - Date object or UTC string to format
   * @returns String formatted for datetime-local input in user's timezone
   */
  toInputFormat(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
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
}
