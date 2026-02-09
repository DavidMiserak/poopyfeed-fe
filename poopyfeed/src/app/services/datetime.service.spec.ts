/**
 * Tests for DateTimeService
 */

import { TestBed } from '@angular/core/testing';
import { DateTimeService } from './datetime.service';

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
  });
});
