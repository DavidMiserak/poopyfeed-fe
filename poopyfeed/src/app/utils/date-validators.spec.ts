import { describe, it, expect, vi } from 'vitest';
import { FormControl } from '@angular/forms';
import { noFutureDate, noFutureDateTime } from './date-validators';
import { DateTimeService } from '../services/datetime.service';

const mockDateTimeService = {
  getTodayInUserTimezone: vi.fn().mockReturnValue('2026-03-19'),
  nowAsInputFormat: vi.fn().mockReturnValue('2026-03-19T14:30'),
} as unknown as DateTimeService;

describe('Date Validators', () => {
  describe('noFutureDate', () => {
    const validator = noFutureDate(mockDateTimeService);

    it('should return null for a past date', () => {
      const control = new FormControl('2026-03-18');
      expect(validator(control)).toBeNull();
    });

    it('should return null for today', () => {
      const control = new FormControl('2026-03-19');
      expect(validator(control)).toBeNull();
    });

    it('should return error for a future date', () => {
      const control = new FormControl('2026-03-20');
      expect(validator(control)).toEqual({ futureDate: true });
    });

    it('should return null for an empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for a null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });
  });

  describe('noFutureDateTime', () => {
    const validator = noFutureDateTime(mockDateTimeService);

    it('should return null for a past datetime', () => {
      const control = new FormControl('2026-03-19T13:00');
      expect(validator(control)).toBeNull();
    });

    it('should return null for the current minute', () => {
      const control = new FormControl('2026-03-19T14:30');
      expect(validator(control)).toBeNull();
    });

    it('should return error for a future datetime', () => {
      const control = new FormControl('2026-03-19T15:00');
      expect(validator(control)).toEqual({ futureDate: true });
    });

    it('should return error for a future date with earlier time', () => {
      const control = new FormControl('2026-03-20T08:00');
      expect(validator(control)).toEqual({ futureDate: true });
    });

    it('should return null for an empty value', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null for a null value', () => {
      const control = new FormControl(null);
      expect(validator(control)).toBeNull();
    });
  });
});
