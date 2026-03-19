import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DateTimeService } from '../services/datetime.service';

/**
 * Validator factory for date inputs (YYYY-MM-DD).
 * Rejects dates that are in the future relative to the user's timezone.
 *
 * @param datetimeService - DateTimeService instance for timezone-aware "today"
 * @returns ValidatorFn that returns `{ futureDate: true }` if value > today
 */
export function noFutureDate(
  datetimeService: DateTimeService,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }
    const today = datetimeService.getTodayInUserTimezone();
    return value > today ? { futureDate: true } : null;
  };
}

/**
 * Validator factory for datetime-local inputs (YYYY-MM-DDTHH:mm).
 * Rejects datetimes that are in the future relative to the user's timezone.
 *
 * @param datetimeService - DateTimeService instance for timezone-aware "now"
 * @returns ValidatorFn that returns `{ futureDate: true }` if value > now
 */
export function noFutureDateTime(
  datetimeService: DateTimeService,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }
    const now = datetimeService.nowAsInputFormat();
    return value > now ? { futureDate: true } : null;
  };
}
