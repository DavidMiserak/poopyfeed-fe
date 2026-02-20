import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAgeInWeeks,
  getAgeInMonths,
  getChildAge,
  getChildAgeLong,
  formatTimestamp,
  formatActivityAge,
  isToday,
  getGenderIcon,
  getGenderIconDetailed,
  getActivityIcon,
  getRoleBadgeColor,
  formatMinutes,
} from './date.utils';

describe('Date Utilities', () => {
  describe('getAgeInWeeks', () => {
    it('should return 0 for newborn (less than 7 days old)', () => {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 3);
      expect(getAgeInWeeks(birthDate.toISOString())).toBe(0);
    });

    it('should return 1 for baby 1 week old', () => {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 7);
      expect(getAgeInWeeks(birthDate.toISOString())).toBe(1);
    });

    it('should return 2 for baby 2 weeks old', () => {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 14);
      expect(getAgeInWeeks(birthDate.toISOString())).toBe(2);
    });

    it('should return 4 for baby 4 weeks old (1 month)', () => {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 28);
      expect(getAgeInWeeks(birthDate.toISOString())).toBe(4);
    });

    it('should return 8 for baby 8 weeks old (2 months)', () => {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 56);
      expect(getAgeInWeeks(birthDate.toISOString())).toBe(8);
    });

    it('should return 12 for baby 12 weeks old (3 months)', () => {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 84);
      expect(getAgeInWeeks(birthDate.toISOString())).toBe(12);
    });

    it('should return 26 for baby 26 weeks old (6 months)', () => {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 182);
      expect(getAgeInWeeks(birthDate.toISOString())).toBe(26);
    });

    it('should return 52 for baby 52 weeks old (1 year)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 1);
      const ageInWeeks = getAgeInWeeks(birthDate.toISOString());
      expect(ageInWeeks).toBeGreaterThanOrEqual(52);
      expect(ageInWeeks).toBeLessThanOrEqual(53);
    });
  });

  describe('getAgeInMonths', () => {
    it('should return 0 for newborn (less than 1 month old)', () => {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 10);
      expect(getAgeInMonths(birthDate.toISOString())).toBe(0);
    });

    it('should return 1 for 1-month-old', () => {
      const birthDate = new Date();
      birthDate.setMonth(birthDate.getMonth() - 1);
      expect(getAgeInMonths(birthDate.toISOString())).toBe(1);
    });

    it('should return 3 for 3-month-old', () => {
      const birthDate = new Date();
      birthDate.setMonth(birthDate.getMonth() - 3);
      expect(getAgeInMonths(birthDate.toISOString())).toBe(3);
    });

    it('should return 6 for 6-month-old', () => {
      const birthDate = new Date();
      birthDate.setMonth(birthDate.getMonth() - 6);
      expect(getAgeInMonths(birthDate.toISOString())).toBe(6);
    });

    it('should return 8 for 8-month-old', () => {
      const birthDate = new Date();
      birthDate.setMonth(birthDate.getMonth() - 8);
      expect(getAgeInMonths(birthDate.toISOString())).toBe(8);
    });

    it('should return 12 for 1-year-old', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 1);
      expect(getAgeInMonths(birthDate.toISOString())).toBe(12);
    });

    it('should return 24 for 2-year-old', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 2);
      expect(getAgeInMonths(birthDate.toISOString())).toBe(24);
    });

    it('should handle birth across year boundary (born last year, different month)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 1);
      birthDate.setMonth(0); // January
      const result = getAgeInMonths(birthDate.toISOString());
      // Should be around 11-13 months depending on current month
      expect(result).toBeGreaterThanOrEqual(11);
      expect(result).toBeLessThanOrEqual(13);
    });
  });

  describe('getChildAge', () => {
    it('should contain days, months, or years', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const result = getChildAge(tenDaysAgo.toISOString());
      expect(['days', 'months', 'years', 'y', 'm'].some(unit => result.includes(unit))).toBe(true);
    });

    it('should return different format for older children', () => {
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = getChildAge(sixtyDaysAgo.toISOString());
      expect(['days', 'months', 'years', 'y', 'm'].some(unit => result.includes(unit))).toBe(true);
    });

    it('should return age in years for older children', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const result = getChildAge(twoYearsAgo.toISOString());
      expect(result).toContain('y');
    });

    it('should use numeric format for age', () => {
      const fiftyDaysAgo = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);
      const result = getChildAge(fiftyDaysAgo.toISOString());
      expect(/\d+/.test(result)).toBe(true);
    });
  });

  describe('getChildAgeLong', () => {
    it('should return age in days for newborns', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      expect(getChildAgeLong(tenDaysAgo.toISOString())).toContain('days old');
    });

    it('should return age in months for infants', () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      expect(getChildAgeLong(ninetyDaysAgo.toISOString())).toContain('months old');
    });

    it('should return age in years for toddlers', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
      expect(getChildAgeLong(twoYearsAgo.toISOString())).toContain('years old');
    });
  });

  describe('formatTimestamp', () => {
    it('should return "just now" for timestamps less than 1 minute old', () => {
      const now = new Date();
      expect(formatTimestamp(now.toISOString())).toBe('just now');
    });

    it('should return minutes for recent timestamps', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatTimestamp(fiveMinutesAgo.toISOString())).toContain('mins ago');
    });

    it('should return hours for older timestamps', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatTimestamp(twoHoursAgo.toISOString())).toContain('hours ago');
    });

    it('should return days for very old timestamps', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatTimestamp(threeDaysAgo.toISOString())).toContain('days ago');
    });

    it('should use singular form for 1 unit', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      expect(formatTimestamp(oneMinuteAgo.toISOString())).toContain('1 min ago');
    });
  });

  describe('formatActivityAge', () => {
    it('should not return "just now"', () => {
      const now = new Date();
      const result = formatActivityAge(now.toISOString());
      expect(result).not.toBe('just now');
    });

    it('should return minutes for recent activities', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatActivityAge(fiveMinutesAgo.toISOString())).toContain('mins ago');
    });

    it('should return hours for older activities', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatActivityAge(twoHoursAgo.toISOString())).toContain('hours ago');
    });
  });

  describe('isToday', () => {
    it('should return true for today\'s timestamp', () => {
      const now = new Date();
      expect(isToday(now.toISOString())).toBe(true);
    });

    it('should return true for today at midnight', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(isToday(today.toISOString())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday.toISOString())).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow.toISOString())).toBe(false);
    });
  });

  describe('getGenderIcon', () => {
    it('should return baby emoji for all genders', () => {
      expect(getGenderIcon('M')).toBe('👶');
      expect(getGenderIcon('F')).toBe('👶');
      expect(getGenderIcon('O')).toBe('👶');
    });
  });

  describe('getGenderIconDetailed', () => {
    it('should return boy emoji for M', () => {
      expect(getGenderIconDetailed('M')).toBe('👦');
    });

    it('should return girl emoji for F', () => {
      expect(getGenderIconDetailed('F')).toBe('👧');
    });

    it('should return baby emoji for O', () => {
      expect(getGenderIconDetailed('O')).toBe('👶');
    });

    it('should return baby emoji for unknown gender', () => {
      expect(getGenderIconDetailed('unknown')).toBe('👶');
    });
  });

  describe('getActivityIcon', () => {
    it('should return bottle emoji for feeding', () => {
      expect(getActivityIcon('feeding')).toBe('🍼');
    });

    it('should return diaper emoji for diaper', () => {
      expect(getActivityIcon('diaper')).toBe('🧷');
    });

    it('should return sleep emoji for nap', () => {
      expect(getActivityIcon('nap')).toBe('😴');
    });
  });

  describe('getRoleBadgeColor', () => {
    it('should return amber colors for owner', () => {
      expect(getRoleBadgeColor('owner')).toContain('amber');
    });

    it('should return blue colors for co-parent', () => {
      expect(getRoleBadgeColor('co-parent')).toContain('blue');
    });

    it('should return emerald colors for caregiver', () => {
      expect(getRoleBadgeColor('caregiver')).toContain('emerald');
    });

    it('should return slate colors for unknown role', () => {
      expect(getRoleBadgeColor('unknown')).toContain('slate');
    });

    it('should include gradient classes', () => {
      const color = getRoleBadgeColor('owner');
      expect(color).toContain('bg-gradient-to-r');
      expect(color).toContain('from-');
      expect(color).toContain('to-');
    });
  });

  describe('formatActivityAge - edge case for days', () => {
    it('should return days for activities older than 1440 minutes', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = formatActivityAge(twoDaysAgo.toISOString());
      expect(result).toContain('days ago');
    });

    it('should use singular day for exactly 1 day old', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = formatActivityAge(oneDayAgo.toISOString());
      expect(result).toContain('1 day ago');
    });
  });

  describe('getActivityIcon - default fallback', () => {
    it('should return fallback emoji for unknown activity type', () => {
      expect(getActivityIcon('unknown' as any)).toBe('📝');
    });

    it('should return fallback emoji for empty string', () => {
      expect(getActivityIcon('' as any)).toBe('📝');
    });
  });

  describe('formatMinutes', () => {
    it('should format minutes under 60', () => {
      expect(formatMinutes(0)).toBe('0m');
      expect(formatMinutes(1)).toBe('1m');
      expect(formatMinutes(30)).toBe('30m');
      expect(formatMinutes(59)).toBe('59m');
    });

    it('should format exact hours', () => {
      expect(formatMinutes(60)).toBe('1h');
      expect(formatMinutes(120)).toBe('2h');
      expect(formatMinutes(180)).toBe('3h');
    });

    it('should format hours and minutes', () => {
      expect(formatMinutes(90)).toBe('1h 30m');
      expect(formatMinutes(150)).toBe('2h 30m');
      expect(formatMinutes(61)).toBe('1h 1m');
      expect(formatMinutes(125)).toBe('2h 5m');
    });
  });

  describe('getChildAge - edge cases', () => {
    it('should handle exactly 1 month old', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = getChildAge(thirtyDaysAgo.toISOString());
      expect(['month', 'months'].some(unit => result.includes(unit))).toBe(true);
    });

    it('should handle exactly 12 months (1 year) old', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const result = getChildAge(oneYearAgo.toISOString());
      expect(result).toContain('y');
    });

    it('should handle age with only years (no months)', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      twoYearsAgo.setMonth(twoYearsAgo.getMonth()); // Same month
      const result = getChildAge(twoYearsAgo.toISOString());
      expect(result).toContain('2 years');
    });
  });
});
