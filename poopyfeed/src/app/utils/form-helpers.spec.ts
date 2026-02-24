import { describe, it, expect } from 'vitest';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  markAllAsTouched,
  resetFormCompletely,
  hasError,
  getErrorMessage,
} from './form-helpers';

describe('Form Helpers', () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      age: new FormControl('', [Validators.required, Validators.min(0), Validators.max(150)]),
    });
  });

  describe('markAllAsTouched', () => {
    it('should mark all controls as touched', () => {
      expect(form.get('name')?.touched).toBe(false);
      expect(form.get('email')?.touched).toBe(false);

      markAllAsTouched(form);

      expect(form.get('name')?.touched).toBe(true);
      expect(form.get('email')?.touched).toBe(true);
      expect(form.get('age')?.touched).toBe(true);
    });

    it('should mark all controls as touched even if some are already touched', () => {
      form.get('name')?.markAsTouched();
      expect(form.get('email')?.touched).toBe(false);

      markAllAsTouched(form);

      expect(form.get('name')?.touched).toBe(true);
      expect(form.get('email')?.touched).toBe(true);
      expect(form.get('age')?.touched).toBe(true);
    });

    it('should work with empty form', () => {
      const emptyForm = new FormGroup({});
      expect(() => markAllAsTouched(emptyForm)).not.toThrow();
    });
  });

  describe('resetFormCompletely', () => {
    it('should reset form values to null', () => {
      form.get('name')?.setValue('John');
      form.get('email')?.setValue('john@example.com');

      resetFormCompletely(form);

      expect(form.get('name')?.value).toBeNull();
      expect(form.get('email')?.value).toBeNull();
    });

    it('should mark all controls as untouched', () => {
      markAllAsTouched(form);
      expect(form.get('name')?.touched).toBe(true);

      resetFormCompletely(form);

      expect(form.get('name')?.touched).toBe(false);
      expect(form.get('email')?.touched).toBe(false);
      expect(form.get('age')?.touched).toBe(false);
    });

    it('should work with empty form', () => {
      const emptyForm = new FormGroup({});
      expect(() => resetFormCompletely(emptyForm)).not.toThrow();
    });
  });

  describe('hasError', () => {
    describe('when control does not exist', () => {
      it('should return false', () => {
        const result = hasError(form, 'nonexistent');
        expect(result).toBe(false);
      });
    });

    describe('when control has no errors', () => {
      it('should return false', () => {
        form.get('name')?.setValue('John');
        const result = hasError(form, 'name');
        expect(result).toBe(false);
      });
    });

    describe('when control has errors without errorType', () => {
      it('should return true if control has any error', () => {
        form.get('name')?.markAsTouched();
        const result = hasError(form, 'name');
        expect(result).toBe(true);
      });
    });

    describe('when checking for specific error type', () => {
      it('should return true if error type exists', () => {
        form.get('name')?.markAsTouched();
        const result = hasError(form, 'name', 'required');
        expect(result).toBe(true);
      });

      it('should return false if error type does not exist', () => {
        form.get('name')?.markAsTouched();
        const result = hasError(form, 'name', 'minlength');
        expect(result).toBe(false);
      });

      it('should return false if control has no errors', () => {
        form.get('name')?.setValue('John');
        const result = hasError(form, 'name', 'required');
        expect(result).toBe(false);
      });
    });
  });

  describe('getErrorMessage', () => {
    describe('when control has no errors', () => {
      it('should return empty string', () => {
        form.get('name')?.setValue('John');
        const message = getErrorMessage(form, 'name', 'Name');
        expect(message).toBe('');
      });
    });

    describe('when control does not exist', () => {
      it('should return empty string', () => {
        const message = getErrorMessage(form, 'nonexistent', 'Field');
        expect(message).toBe('');
      });
    });

    describe('when control has required error', () => {
      it('should return required error message', () => {
        form.get('name')?.markAsTouched();
        const message = getErrorMessage(form, 'name', 'Name');
        expect(message).toBe('Name is required');
      });
    });

    describe('when control has min error', () => {
      it('should return min error message', () => {
        form.get('age')?.setValue(-1);
        form.get('age')?.markAsTouched();
        const message = getErrorMessage(form, 'age', 'Age');
        expect(message).toContain('at least');
        expect(message).toContain('0');
      });
    });

    describe('when control has max error', () => {
      it('should return max error message', () => {
        form.get('age')?.setValue(200);
        form.get('age')?.markAsTouched();
        const message = getErrorMessage(form, 'age', 'Age');
        expect(message).toContain('no more than');
        expect(message).toContain('150');
      });
    });

    describe('when control has email error', () => {
      it('should return generic invalid message for unknown error types', () => {
        form.get('email')?.setValue('invalid-email');
        form.get('email')?.markAsTouched();
        const message = getErrorMessage(form, 'email', 'Email');
        expect(message).toBe('Email is invalid');
      });
    });
  });
});
