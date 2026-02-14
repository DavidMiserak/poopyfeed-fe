/**
 * Tests for DateTimeService
 */

import { TestBed } from '@angular/core/testing';
import { DateTimeService } from './datetime.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('DateTimeService', () => {
  let service: DateTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toUTC', () => {
    it('should convert local Date to UTC ISO 8601 string', () => {
      const localDate = new Date('2024-01-15T10:30:00');
      const utcString = service.toUTC(localDate);

      expect(utcString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(utcString).toContain('2024');
    });

    it('should handle midnight correctly', () => {
      const localDate = new Date('2024-01-15T00:00:00');
      const utcString = service.toUTC(localDate);

      expect(utcString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle leap year dates', () => {
      const localDate = new Date('2024-02-29T12:00:00');
      const utcString = service.toUTC(localDate);

      expect(utcString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(utcString).toContain('2024-02-29');
    });
  });

  describe('toLocal', () => {
    it('should parse UTC ISO 8601 string to local Date', () => {
      const utcString = '2024-01-15T10:30:00Z';
      const localDate = service.toLocal(utcString);

      expect(localDate).toBeInstanceOf(Date);
      expect(localDate.getFullYear()).toBe(2024);
      expect(localDate.getMonth()).toBe(0); // January = 0
      expect(localDate.getDate()).toBe(15);
    });

    it('should handle UTC string with milliseconds', () => {
      const utcString = '2024-01-15T10:30:00.123Z';
      const localDate = service.toLocal(utcString);

      expect(localDate).toBeInstanceOf(Date);
      expect(localDate.getMilliseconds()).toBe(123);
    });

    it('should handle UTC string without Z suffix', () => {
      const utcString = '2024-01-15T10:30:00';
      const localDate = service.toLocal(utcString);

      expect(localDate).toBeInstanceOf(Date);
      expect(localDate.getFullYear()).toBe(2024);
    });
  });

  describe('toInputFormat', () => {
    it('should format Date for datetime-local input', () => {
      const date = new Date('2024-01-15T10:30:00');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(inputFormat).toBe('2024-01-15T10:30');
    });

    it('should pad single-digit values with zeros', () => {
      const date = new Date('2024-01-05T09:05:00');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-01-05T09:05');
    });

    it('should handle midnight', () => {
      const date = new Date('2024-01-15T00:00:00');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-01-15T00:00');
    });

    it('should handle end of day', () => {
      const date = new Date('2024-01-15T23:59:00');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-01-15T23:59');
    });
  });

  describe('fromInputFormat', () => {
    it('should parse datetime-local input to Date', () => {
      const input = '2024-01-15T10:30';
      const date = service.fromInputFormat(input);

      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(10);
      expect(date.getMinutes()).toBe(30);
    });

    it('should handle midnight input', () => {
      const input = '2024-01-15T00:00';
      const date = service.fromInputFormat(input);

      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    });

    it('should handle end of day input', () => {
      const input = '2024-01-15T23:59';
      const date = service.fromInputFormat(input);

      expect(date.getHours()).toBe(23);
      expect(date.getMinutes()).toBe(59);
    });
  });

  describe('nowAsInputFormat', () => {
    it('should return current time in input format', () => {
      const inputFormat = service.nowAsInputFormat();

      expect(inputFormat).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('should return a format that can be parsed back', () => {
      const inputFormat = service.nowAsInputFormat();
      const parsed = service.fromInputFormat(inputFormat);

      expect(parsed).toBeInstanceOf(Date);
      expect(inputFormat).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      // Verify it's roughly the current time (within current day)
      const now = new Date();
      expect(parsed.getFullYear()).toBe(now.getFullYear());
      expect(parsed.getMonth()).toBe(now.getMonth());
      expect(parsed.getDate()).toBe(now.getDate());
    });
  });

  describe('round-trip conversions', () => {
    it('should handle toInputFormat -> fromInputFormat round trip', () => {
      const original = new Date('2024-01-15T10:30:00');
      const inputFormat = service.toInputFormat(original);
      const parsed = service.fromInputFormat(inputFormat);

      expect(parsed.getFullYear()).toBe(original.getFullYear());
      expect(parsed.getMonth()).toBe(original.getMonth());
      expect(parsed.getDate()).toBe(original.getDate());
      expect(parsed.getHours()).toBe(original.getHours());
      expect(parsed.getMinutes()).toBe(original.getMinutes());
    });

    it('should handle toUTC -> toLocal round trip', () => {
      const original = new Date('2024-01-15T10:30:00');
      const utcString = service.toUTC(original);
      const parsed = service.toLocal(utcString);

      expect(parsed.getTime()).toBe(original.getTime());
    });

    it('should handle input format -> UTC conversion', () => {
      const inputValue = '2024-01-15T10:30';
      const localDate = service.fromInputFormat(inputValue);
      const utcString = service.toUTC(localDate);

      expect(utcString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Parse back and verify
      const parsed = service.toLocal(utcString);
      expect(parsed.getTime()).toBe(localDate.getTime());
    });
  });

  describe('edge cases', () => {
    it('should handle DST transition dates', () => {
      // March 10, 2024 is DST transition in US
      const date = new Date('2024-03-10T02:30:00');
      const inputFormat = service.toInputFormat(date);
      const parsed = service.fromInputFormat(inputFormat);

      expect(parsed.getDate()).toBe(date.getDate());
      expect(parsed.getMonth()).toBe(date.getMonth());
    });

    it('should handle year boundaries', () => {
      const newYear = new Date('2024-01-01T00:00:00');
      const inputFormat = service.toInputFormat(newYear);

      expect(inputFormat).toBe('2024-01-01T00:00');
    });

    it('should handle December 31st', () => {
      const endOfYear = new Date('2024-12-31T23:59:00');
      const inputFormat = service.toInputFormat(endOfYear);

      expect(inputFormat).toBe('2024-12-31T23:59');
    });

    it('should handle milliseconds in UTC conversion', () => {
      const date = new Date('2024-01-15T10:30:45.567');
      const utcString = service.toUTC(date);

      expect(utcString).toContain('567');
      const parsed = service.toLocal(utcString);
      expect(parsed.getMilliseconds()).toBe(567);
    });

    it('should preserve seconds in toUTC output', () => {
      const date = new Date('2024-01-15T10:30:45');
      const utcString = service.toUTC(date);

      // Verify seconds are preserved with milliseconds
      expect(utcString).toMatch(/:\d{2}:\d{2}\.\d{3}Z/);
      expect(utcString).toContain('45.');
    });

    it('should handle single digit hours and minutes in formatting', () => {
      const date = new Date('2024-01-15T01:02:00');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-01-15T01:02');
      // Verify no double-digit hours/minutes
      expect(inputFormat).toMatch(/T\d{2}:\d{2}$/);
    });

    it('should correctly handle October (month 10) padding', () => {
      const date = new Date('2024-10-15T10:30:00');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-10-15T10:30');
      expect(inputFormat.substring(5, 7)).toBe('10');
    });

    it('should handle input format with single-digit date', () => {
      const input = '2024-01-05T10:30';
      const date = service.fromInputFormat(input);

      expect(date.getDate()).toBe(5);
      expect(date.getMonth()).toBe(0);
    });

    it('should handle different years in round trip', () => {
      const testYears = [2020, 2023, 2024, 2025];

      testYears.forEach(year => {
        const date = new Date(`${year}-06-15T12:30:00`);
        const inputFormat = service.toInputFormat(date);
        const parsed = service.fromInputFormat(inputFormat);

        expect(parsed.getFullYear()).toBe(year);
      });
    });

    it('should handle UTC string with offset notation', () => {
      const utcString = '2024-01-15T10:30:00+00:00';
      const localDate = service.toLocal(utcString);

      expect(localDate).toBeInstanceOf(Date);
      expect(localDate.getFullYear()).toBe(2024);
    });

    it('should return valid format for all hours of the day', () => {
      for (let hour = 0; hour < 24; hour++) {
        const date = new Date(2024, 0, 15, hour, 30, 0);
        const inputFormat = service.toInputFormat(date);
        const hourStr = String(hour).padStart(2, '0');

        expect(inputFormat).toContain(`T${hourStr}:30`);
      }
    });

    it('should return valid format for all minutes of the hour', () => {
      for (let minute = 0; minute < 60; minute += 5) {
        const date = new Date(2024, 0, 15, 10, minute, 0);
        const inputFormat = service.toInputFormat(date);
        const minStr = String(minute).padStart(2, '0');

        expect(inputFormat).toContain(`:${minStr}`);
      }
    });

    it('should handle consecutive date conversions', () => {
      const dates = [
        new Date('2024-01-15T10:30:00'),
        new Date('2024-01-16T11:45:00'),
        new Date('2024-01-17T09:15:00'),
      ];

      dates.forEach(date => {
        const inputFormat = service.toInputFormat(date);
        const parsed = service.fromInputFormat(inputFormat);

        expect(parsed.getFullYear()).toBe(date.getFullYear());
        expect(parsed.getMonth()).toBe(date.getMonth());
        expect(parsed.getDate()).toBe(date.getDate());
      });
    });

    it('should handle mixed timezone conversion patterns', () => {
      const localDate = new Date('2024-01-15T10:30:00');
      const utcString = service.toUTC(localDate);
      const inputFormat = service.toInputFormat(localDate);

      // Both conversions should be valid
      expect(utcString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(inputFormat).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

      // They should represent the same point in time
      const utcParsed = service.toLocal(utcString);
      const inputParsed = service.fromInputFormat(inputFormat);

      expect(utcParsed.getTime()).toBe(inputParsed.getTime());
    });
  });
});
