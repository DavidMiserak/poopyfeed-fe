/**
 * Form utility functions for common form operations.
 *
 * Used by tracking forms and shared components for validation display,
 * reset, and error message formatting.
 */

import { FormGroup } from '@angular/forms';

/**
 * Mark all form controls as touched to trigger validation display.
 *
 * Call before submit so validation errors appear for invalid fields.
 *
 * @param form - The form group to mark as touched
 * @returns void
 *
 * @example
 * ```typescript
 * onSubmit() {
 *   markAllAsTouched(this.form);
 *   if (this.form.invalid) return;
 *   // ...
 * }
 * ```
 */
export function markAllAsTouched(form: FormGroup): void {
  Object.keys(form.controls).forEach((key) => {
    const control = form.get(key);
    control?.markAsTouched();
  });
}

/**
 * Reset form to pristine and untouched state.
 *
 * Clears values and resets pristine/touched so validation messages are hidden.
 *
 * @param form - The form group to reset
 * @returns void
 */
export function resetFormCompletely(form: FormGroup): void {
  form.reset();
  Object.keys(form.controls).forEach((key) => {
    const control = form.get(key);
    control?.markAsUntouched();
  });
}

/**
 * Check if a form control has a validation error.
 *
 * @param form - The form group containing the control
 * @param controlName - Name of the control
 * @param errorType - Optional specific error key (e.g. 'required', 'min')
 * @returns True if control has any error, or the specified error type
 *
 * @example
 * ```typescript
 * hasError(this.form, 'amount_oz', 'required')
 * hasError(this.form, 'name') // any error
 * ```
 */
export function hasError(
  form: FormGroup,
  controlName: string,
  errorType?: string
): boolean {
  const control = form.get(controlName);
  if (!control) {
    return false;
  }

  if (!control.errors) {
    return false;
  }

  if (errorType) {
    return errorType in control.errors;
  }

  return Object.keys(control.errors).length > 0;
}

/**
 * Get user-friendly error message for a form control.
 *
 * Maps common validators (required, minlength, maxlength, min, max) to
 * readable messages. Falls back to "{fieldLabel} is invalid".
 *
 * @param form - The form group containing the control
 * @param controlName - Name of the control
 * @param fieldLabel - Label for the field (e.g. 'Amount') used in message
 * @returns Error message string, or empty string if no errors
 *
 * @example
 * ```typescript
 * getErrorMessage(this.form, 'amount_oz', 'Amount')
 * ```
 */
export function getErrorMessage(
  form: FormGroup,
  controlName: string,
  fieldLabel: string
): string {
  const control = form.get(controlName);
  if (!control?.errors) {
    return '';
  }

  if ('required' in control.errors) {
    return `${fieldLabel} is required`;
  }
  if ('minlength' in control.errors) {
    const error = control.errors['minlength'];
    return `${fieldLabel} must be at least ${error.requiredLength} characters`;
  }
  if ('maxlength' in control.errors) {
    const error = control.errors['maxlength'];
    return `${fieldLabel} must be no more than ${error.requiredLength} characters`;
  }
  if ('min' in control.errors) {
    const error = control.errors['min'];
    return `${fieldLabel} must be at least ${error.min}`;
  }
  if ('max' in control.errors) {
    const error = control.errors['max'];
    return `${fieldLabel} must be no more than ${error.max}`;
  }

  return `${fieldLabel} is invalid`;
}
