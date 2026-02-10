/**
 * Form utility functions for common form operations
 */

import { FormGroup, AbstractControl } from '@angular/forms';

/**
 * Mark all form controls as touched to trigger validation display
 */
export function markAllAsTouched(form: FormGroup): void {
  Object.keys(form.controls).forEach((key) => {
    const control = form.get(key);
    control?.markAsTouched();
  });
}

/**
 * Reset form to pristine state
 */
export function resetFormCompletely(form: FormGroup): void {
  form.reset();
  Object.keys(form.controls).forEach((key) => {
    const control = form.get(key);
    control?.markAsUntouched();
  });
}

/**
 * Check if a form control has a specific error
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
 * Get user-friendly error message for a form control
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
