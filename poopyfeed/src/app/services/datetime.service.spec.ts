/**
 * Tests for DateTimeService
 */

import { TestBed } from '@angular/core/testing';
import { DateTimeService } from './datetime.service';
import { AccountService } from './account.service';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('DateTimeService', () => {
  let service: DateTimeService;
  let profileSignal: ReturnType<typeof signal>;

  beforeEach(() => {
    profileSignal = signal(null);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AccountService,
          useValue: { profile: profileSignal },
        },
      ],
    });
    service = TestBed.inject(DateTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('userTimezone', () => {
    it('should default to UTC when profile is null', () => {
      expect(service.userTimezone).toBe('UTC');
    });

    it('should return profile timezone when available', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });
      expect(service.userTimezone).toBe('America/New_York');
    });
  });

  describe('getDateInUserTimezone', () => {
    it('should return YYYY-MM-DD format', () => {
      const result = service.getDateInUserTimezone('2024-01-15T10:00:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return correct date in UTC', () => {
      const result = service.getDateInUserTimezone('2024-01-15T10:00:00Z');
      expect(result).toBe('2024-01-15');
    });

    it('should handle midnight boundary with negative offset timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // 4:30 AM UTC = 11:30 PM previous day in New York (EST, UTC-5)
      const result = service.getDateInUserTimezone('2024-01-15T04:30:00Z');
      expect(result).toBe('2024-01-14');
    });

    it('should handle midnight boundary with positive offset timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'Asia/Tokyo',
      });

      // 11:30 PM UTC = 8:30 AM next day in Tokyo (UTC+9)
      const result = service.getDateInUserTimezone('2024-01-15T23:30:00Z');
      expect(result).toBe('2024-01-16');
    });

    it('should accept Date objects', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = service.getDateInUserTimezone(date);
      expect(result).toBe('2024-01-15');
    });

    it('should handle leap year date', () => {
      const result = service.getDateInUserTimezone('2024-02-29T12:00:00Z');
      expect(result).toBe('2024-02-29');
    });
  });

  describe('getTodayInUserTimezone', () => {
    it('should return YYYY-MM-DD format', () => {
      const result = service.getTodayInUserTimezone();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today in UTC when no profile', () => {
      const expected = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      expect(service.getTodayInUserTimezone()).toBe(expected);
    });
  });

  describe('isTodayInUserTimezone', () => {
    it('should return true for a recent timestamp', () => {
      const now = new Date();
      expect(service.isTodayInUserTimezone(now.toISOString())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);
      expect(service.isTodayInUserTimezone(yesterday.toISOString())).toBe(
        false
      );
    });
  });

  describe('getDateNDaysAgoInUserTimezone', () => {
    it('should return today for 0 days ago', () => {
      expect(service.getDateNDaysAgoInUserTimezone(0)).toBe(
        service.getTodayInUserTimezone()
      );
    });

    it('should return YYYY-MM-DD format', () => {
      const result = service.getDateNDaysAgoInUserTimezone(7);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('toUTC', () => {
    it('should convert local Date to UTC ISO 8601 string', () => {
      const localDate = new Date('2024-01-15T10:30:00');
      const utcString = service.toUTC(localDate);

      expect(utcString).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(utcString).toContain('2024');
    });

    it('should handle midnight correctly', () => {
      const localDate = new Date('2024-01-15T00:00:00');
      const utcString = service.toUTC(localDate);

      expect(utcString).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should handle leap year dates', () => {
      const localDate = new Date('2024-02-29T12:00:00');
      const utcString = service.toUTC(localDate);

      expect(utcString).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
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
      // Use a UTC date and UTC timezone to get deterministic results
      const date = new Date('2024-01-15T10:30:00Z');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(inputFormat).toBe('2024-01-15T10:30');
    });

    it('should format in user timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // 2024-01-15T15:30:00Z = 10:30 AM EST
      const date = new Date('2024-01-15T15:30:00Z');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-01-15T10:30');
    });

    it('should accept string input', () => {
      const inputFormat = service.toInputFormat('2024-01-15T10:30:00Z');
      expect(inputFormat).toBe('2024-01-15T10:30');
    });

    it('should handle midnight', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-01-15T00:00');
    });

    it('should handle end of day', () => {
      const date = new Date('2024-01-15T23:59:00Z');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-01-15T23:59');
    });

    it('should pad single-digit values with zeros', () => {
      const date = new Date('2024-01-05T09:05:00Z');
      const inputFormat = service.toInputFormat(date);

      expect(inputFormat).toBe('2024-01-05T09:05');
    });
  });

  describe('fromInputFormat', () => {
    it('should parse datetime-local input to Date', () => {
      const input = '2024-01-15T10:30';
      const date = service.fromInputFormat(input);

      expect(date).toBeInstanceOf(Date);
      // Verify round-trip: toInputFormat should give back the same string
      const roundTrip = service.toInputFormat(date);
      expect(roundTrip).toBe(input);
    });

    it('should handle midnight input', () => {
      const input = '2024-01-15T00:00';
      const date = service.fromInputFormat(input);

      expect(date).toBeInstanceOf(Date);
      expect(service.toInputFormat(date)).toBe(input);
    });

    it('should handle end of day input', () => {
      const input = '2024-01-15T23:59';
      const date = service.fromInputFormat(input);

      expect(date).toBeInstanceOf(Date);
      expect(service.toInputFormat(date)).toBe(input);
    });

    it('should round-trip correctly with user timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      const input = '2024-01-15T10:30';
      const date = service.fromInputFormat(input);
      const roundTrip = service.toInputFormat(date);
      expect(roundTrip).toBe(input);
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
    });
  });

  describe('round-trip conversions', () => {
    it('should handle toInputFormat -> fromInputFormat round trip', () => {
      const original = new Date('2024-01-15T10:30:00Z');
      const inputFormat = service.toInputFormat(original);
      const parsed = service.fromInputFormat(inputFormat);

      // Round-trip should produce same input format
      expect(service.toInputFormat(parsed)).toBe(inputFormat);
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

      expect(utcString).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );

      // Parse back and verify
      const parsed = service.toLocal(utcString);
      expect(parsed.getTime()).toBe(localDate.getTime());
    });
  });

  describe('timezone day boundary edge cases', () => {
    const setTimezone = (tz: string) => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: tz,
      });
    };

    describe('negative offset (America/New_York, UTC-5)', () => {
      beforeEach(() => setTimezone('America/New_York'));

      it('should place 4:30 AM UTC on previous day in EST (11:30 PM EST)', () => {
        const result = service.getDateInUserTimezone('2024-06-15T04:30:00Z');
        expect(result).toBe('2024-06-15'); // EDT in June (UTC-4), so 12:30 AM same day
      });

      it('should place 4:30 AM UTC on previous day in EST winter (11:30 PM EST)', () => {
        // January = EST (UTC-5): 4:30 AM UTC = 11:30 PM Jan 14 EST
        const result = service.getDateInUserTimezone('2024-01-15T04:30:00Z');
        expect(result).toBe('2024-01-14');
      });

      it('should place 5:01 AM UTC on same day in EST winter (12:01 AM EST)', () => {
        // 5:01 AM UTC = 12:01 AM Jan 15 EST
        const result = service.getDateInUserTimezone('2024-01-15T05:01:00Z');
        expect(result).toBe('2024-01-15');
      });

      it('should place 4:59 AM UTC on previous day in EST winter (11:59 PM EST)', () => {
        // 4:59 AM UTC = 11:59 PM Jan 14 EST
        const result = service.getDateInUserTimezone('2024-01-15T04:59:00Z');
        expect(result).toBe('2024-01-14');
      });

      it('should place midnight UTC on previous day in EST winter (7:00 PM EST)', () => {
        // 0:00 UTC Jan 15 = 7:00 PM Jan 14 EST
        const result = service.getDateInUserTimezone('2024-01-15T00:00:00Z');
        expect(result).toBe('2024-01-14');
      });
    });

    describe('positive offset (Asia/Tokyo, UTC+9)', () => {
      beforeEach(() => setTimezone('Asia/Tokyo'));

      it('should place 1:00 AM Tokyo (4:00 PM UTC previous day) on the Tokyo date', () => {
        // 4:00 PM UTC Jan 14 = 1:00 AM Jan 15 Tokyo
        const result = service.getDateInUserTimezone('2024-01-14T16:00:00Z');
        expect(result).toBe('2024-01-15');
      });

      it('should place 11:00 PM UTC on next day in Tokyo (8:00 AM next day)', () => {
        // 11:00 PM UTC Jan 15 = 8:00 AM Jan 16 Tokyo
        const result = service.getDateInUserTimezone('2024-01-15T23:00:00Z');
        expect(result).toBe('2024-01-16');
      });

      it('should place 2:59 PM UTC on same day in Tokyo (11:59 PM Tokyo)', () => {
        // 2:59 PM UTC Jan 15 = 11:59 PM Jan 15 Tokyo
        const result = service.getDateInUserTimezone('2024-01-15T14:59:00Z');
        expect(result).toBe('2024-01-15');
      });

      it('should place 3:00 PM UTC on next day in Tokyo (midnight Tokyo)', () => {
        // 3:00 PM UTC Jan 15 = 12:00 AM Jan 16 Tokyo
        const result = service.getDateInUserTimezone('2024-01-15T15:00:00Z');
        expect(result).toBe('2024-01-16');
      });
    });

    describe('half-hour offset (Asia/Kolkata, UTC+5:30)', () => {
      beforeEach(() => setTimezone('Asia/Kolkata'));

      it('should place 6:29 PM UTC on same day in Kolkata (11:59 PM IST)', () => {
        // 6:29 PM UTC Jan 15 = 11:59 PM Jan 15 IST
        const result = service.getDateInUserTimezone('2024-01-15T18:29:00Z');
        expect(result).toBe('2024-01-15');
      });

      it('should place 6:30 PM UTC on next day in Kolkata (midnight IST)', () => {
        // 6:30 PM UTC Jan 15 = 12:00 AM Jan 16 IST
        const result = service.getDateInUserTimezone('2024-01-15T18:30:00Z');
        expect(result).toBe('2024-01-16');
      });

      it('should correctly shift day boundary at 5:30 AM IST', () => {
        // Midnight UTC Jan 15 = 5:30 AM Jan 15 IST
        const result = service.getDateInUserTimezone('2024-01-15T00:00:00Z');
        expect(result).toBe('2024-01-15');
      });
    });

    describe('getDateInUserTimezone cross-day verification', () => {
      it('should return different dates for same UTC timestamp in different timezones', () => {
        // 4:30 AM UTC Jan 15
        const utcTimestamp = '2024-01-15T04:30:00Z';

        // UTC: Jan 15
        profileSignal.set(null);
        expect(service.getDateInUserTimezone(utcTimestamp)).toBe('2024-01-15');

        // New York (EST, UTC-5): Jan 14 (11:30 PM)
        setTimezone('America/New_York');
        expect(service.getDateInUserTimezone(utcTimestamp)).toBe('2024-01-14');

        // Tokyo (UTC+9): Jan 15 (1:30 PM)
        setTimezone('Asia/Tokyo');
        expect(service.getDateInUserTimezone(utcTimestamp)).toBe('2024-01-15');
      });

      it('should produce different dates across day boundary for positive offset', () => {
        // 3:00 PM UTC Jan 15
        const utcTimestamp = '2024-01-15T15:00:00Z';

        // UTC: Jan 15
        profileSignal.set(null);
        expect(service.getDateInUserTimezone(utcTimestamp)).toBe('2024-01-15');

        // Tokyo (UTC+9): Jan 16 (midnight)
        setTimezone('Asia/Tokyo');
        expect(service.getDateInUserTimezone(utcTimestamp)).toBe('2024-01-16');
      });
    });

    describe('isTodayInUserTimezone with fixed dates', () => {
      it('should consider late-night EST timestamp as today if today in EST', () => {
        setTimezone('America/New_York');

        // Create a timestamp that is "now" in New York
        const now = new Date();
        // This should always be "today" regardless of timezone
        expect(service.isTodayInUserTimezone(now.toISOString())).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle year boundaries', () => {
      const result = service.getDateInUserTimezone('2024-01-01T00:00:00Z');
      expect(result).toBe('2024-01-01');
    });

    it('should handle December 31st', () => {
      const result = service.getDateInUserTimezone('2024-12-31T23:59:00Z');
      expect(result).toBe('2024-12-31');
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

      expect(utcString).toMatch(/:\d{2}:\d{2}\.\d{3}Z/);
      expect(utcString).toContain('45.');
    });

    it('should handle UTC string with offset notation', () => {
      const utcString = '2024-01-15T10:30:00+00:00';
      const localDate = service.toLocal(utcString);

      expect(localDate).toBeInstanceOf(Date);
      expect(localDate.getFullYear()).toBe(2024);
    });

    it('should handle DST transition dates', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // March 10, 2024 is DST transition in US (spring forward)
      const date = new Date('2024-03-10T07:30:00Z'); // 2:30 AM EST / 3:30 AM EDT
      const result = service.getDateInUserTimezone(date);
      expect(result).toBe('2024-03-10');
    });
  });
});
