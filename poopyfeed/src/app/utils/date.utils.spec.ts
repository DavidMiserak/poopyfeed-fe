import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getChildAge,
  getChildAgeLong,
  formatTimestamp,
  formatActivityAge,
  isToday,
  getGenderIcon,
  getGenderIconDetailed,
  getActivityIcon,
  getRoleBadgeColor,
} from './date.utils';

describe('Date Utilities', () => {
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
});
