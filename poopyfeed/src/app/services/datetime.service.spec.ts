/**
 * Tests for DateTimeService
 */

import { TestBed } from '@angular/core/testing';
import { DateTimeService } from './datetime.service';
import { AccountService } from './account.service';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

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

    it('should parse timestamp without Z as UTC (API compatibility)', () => {
      // Some APIs return ISO datetime without timezone; we treat as UTC so day filtering is correct
      const withZ = service.getDateInUserTimezone('2024-01-15T10:00:00Z');
      const withoutZ = service.getDateInUserTimezone('2024-01-15T10:00:00');
      expect(withoutZ).toBe(withZ);
      expect(withoutZ).toBe('2024-01-15');
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

  describe('getTomorrowInUserTimezone', () => {
    it('should return YYYY-MM-DD format', () => {
      const result = service.getTomorrowInUserTimezone();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return day after getTodayInUserTimezone', () => {
      const today = service.getTodayInUserTimezone();
      const tomorrow = service.getTomorrowInUserTimezone();
      const todayDate = new Date(today + 'T12:00:00Z');
      const tomorrowDate = new Date(tomorrow + 'T12:00:00Z');
      const diffDays = (tomorrowDate.getTime() - todayDate.getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBe(1);
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

  describe('formatDateTime', () => {
    it('should format in UTC when no profile is set', () => {
      // No profile = UTC. 10:30 AM UTC should display as 10:30 AM
      const result = service.formatDateTime('2024-01-15T10:30:00Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
      expect(result).toContain('10:30');
      expect(result).toContain('AM');
    });

    it('should respect user timezone for formatting', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // 2024-01-15T15:30:00Z = 10:30 AM EST
      const result = service.formatDateTime('2024-01-15T15:30:00Z');
      expect(result).toContain('10:30');
      expect(result).toContain('AM');
    });

    it('should shift the date when timezone crosses midnight', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // 2024-01-15T04:00:00Z = Jan 14, 11:00 PM EST
      const result = service.formatDateTime('2024-01-15T04:00:00Z');
      expect(result).toContain('Jan');
      expect(result).toContain('14');
      expect(result).toContain('11:00');
      expect(result).toContain('PM');
    });

    it('should handle DST transition (spring forward)', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // March 10, 2024 2:00 AM EST -> 3:00 AM EDT (spring forward)
      // 7:30 AM UTC on March 10 = 3:30 AM EDT (after spring forward)
      const result = service.formatDateTime('2024-03-10T07:30:00Z');
      expect(result).toContain('3:30');
      expect(result).toContain('AM');
      expect(result).toContain('Mar');
    });
  });

  describe('formatTimeOnly', () => {
    it('should format time in UTC by default', () => {
      const result = service.formatTimeOnly('2024-01-15T10:30:00Z');
      expect(result).toContain('10:30');
      expect(result).toContain('AM');
    });

    it('should format time in user timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // 2024-01-15T15:30:00Z = 10:30 AM EST
      const result = service.formatTimeOnly('2024-01-15T15:30:00Z');
      expect(result).toContain('10:30');
      expect(result).toContain('AM');
    });

    it('should handle PM times', () => {
      const result = service.formatTimeOnly('2024-01-15T15:30:00Z');
      expect(result).toContain('3:30');
      expect(result).toContain('PM');
    });

    it('should handle midnight (12:00 AM)', () => {
      const result = service.formatTimeOnly('2024-01-15T00:00:00Z');
      expect(result).toContain('12:00');
      expect(result).toContain('AM');
    });

    it('should handle noon (12:00 PM)', () => {
      const result = service.formatTimeOnly('2024-01-15T12:00:00Z');
      expect(result).toContain('12:00');
      expect(result).toContain('PM');
    });

    it('should handle DST transition correctly', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // Nov 3 2024 fall back: 6:30 AM UTC = 1:30 AM EST (after falling back)
      const result = service.formatTimeOnly('2024-11-03T06:30:00Z');
      expect(result).toContain('1:30');
      expect(result).toContain('AM');
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format as weekday, month day', () => {
      const result = service.formatDateForDisplay('2024-01-15');
      expect(result).toContain('Mon');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
    });

    it('should handle different dates', () => {
      const result = service.formatDateForDisplay('2024-12-25');
      expect(result).toContain('Wed');
      expect(result).toContain('Dec');
      expect(result).toContain('25');
    });

    it('should handle leap year date', () => {
      const result = service.formatDateForDisplay('2024-02-29');
      expect(result).toContain('Thu');
      expect(result).toContain('Feb');
      expect(result).toContain('29');
    });

    it('should handle year boundary (Jan 1)', () => {
      const result = service.formatDateForDisplay('2024-01-01');
      expect(result).toContain('Mon');
      expect(result).toContain('Jan');
      expect(result).toContain('1');
    });

    it('should handle year boundary (Dec 31)', () => {
      const result = service.formatDateForDisplay('2024-12-31');
      expect(result).toContain('Tue');
      expect(result).toContain('Dec');
      expect(result).toContain('31');
    });

    it('should not shift date regardless of user timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'Pacific/Auckland',
      });

      const result = service.formatDateForDisplay('2024-06-15');
      expect(result).toContain('15');
      expect(result).toContain('Jun');
    });
  });

  describe('formatTime24h', () => {
    it('should format as 24-hour time in UTC', () => {
      const result = service.formatTime24h('2024-01-15T15:30:00Z');
      expect(result).toMatch(/15.+30/);
    });

    it('should format in user timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // 2024-01-15T15:30:00Z = 10:30 EST
      const result = service.formatTime24h('2024-01-15T15:30:00Z');
      expect(result).toMatch(/10.+30/);
    });

    it('should handle midnight in UTC', () => {
      const result = service.formatTime24h('2024-01-15T00:00:00Z');
      expect(result).toMatch(/00.+00|24.+00/);
    });
  });

  describe('formatTimeHHmm', () => {
    it('should return HH:mm format', () => {
      const result = service.formatTimeHHmm('2024-01-15T15:30:00Z');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should use user timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // 2024-01-15T15:30:00Z = 10:30 in EST
      const result = service.formatTimeHHmm('2024-01-15T15:30:00Z');
      expect(result).toBe('10:30');
    });

    it('should handle midnight', () => {
      const result = service.formatTimeHHmm('2024-01-15T00:00:00Z');
      expect(result).toBe('00:00');
    });

    it('should handle end of day', () => {
      const result = service.formatTimeHHmm('2024-01-15T23:59:00Z');
      expect(result).toBe('23:59');
    });

    it('should handle positive offset timezone', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'Asia/Tokyo',
      });

      // 15:30 UTC = 00:30 next day in Tokyo (UTC+9)
      const result = service.formatTimeHHmm('2024-01-15T15:30:00Z');
      expect(result).toBe('00:30');
    });

    it('should handle DST transition correctly', () => {
      profileSignal.set({
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        timezone: 'America/New_York',
      });

      // March 10 2024 spring forward: 7:30 AM UTC = 3:30 AM EDT
      const result = service.formatTimeHHmm('2024-03-10T07:30:00Z');
      expect(result).toBe('03:30');
    });
  });

  describe('getBrowserTimezone', () => {
    it('should return a timezone string', () => {
      const tz = DateTimeService.getBrowserTimezone();
      expect(typeof tz).toBe('string');
      expect(tz!.length).toBeGreaterThan(0);
    });

    it('should return null when window is undefined (SSR)', () => {
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, 'window', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const tz = DateTimeService.getBrowserTimezone();

      Object.defineProperty(globalThis, 'window', {
        writable: true,
        configurable: true,
        value: originalWindow,
      });
      expect(tz).toBeNull();
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
