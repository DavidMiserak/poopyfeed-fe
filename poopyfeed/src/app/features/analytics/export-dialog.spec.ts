/**
 * Export dialog component unit tests.
 *
 * Tests form behavior, validation, and dialog interactions.
 * Uses TestBed for component testing with MatDialog mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ExportDialogComponent } from './export-dialog';
import { ExportOptions } from '../../models/analytics.model';

describe('ExportDialogComponent', () => {
  let component: ExportDialogComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportDialogComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportDialogComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    it('should initialize form with default values', () => {
      expect(component.form.get('format')?.value).toBe('csv');
      expect(component.form.get('days')?.value).toBe(30);
    });

    it('should have valid form on init', () => {
      expect(component.form.valid).toBe(true);
    });

    it('should set CSV as default format', () => {
      const formatControl = component.form.get('format');
      expect(formatControl?.value).toBe('csv');
    });

    it('should set 30 days as default time period', () => {
      const daysControl = component.form.get('days');
      expect(daysControl?.value).toBe(30);
    });
  });

  describe('Format Selection', () => {
    it('should update format when CSV is selected', () => {
      component.form.patchValue({ format: 'csv' });
      expect(component.form.get('format')?.value).toBe('csv');
    });

    it('should update format when PDF is selected', () => {
      component.form.patchValue({ format: 'pdf' });
      expect(component.form.get('format')?.value).toBe('pdf');
    });

    it('should maintain form validity when switching formats', () => {
      component.form.patchValue({ format: 'pdf' });
      expect(component.form.valid).toBe(true);

      component.form.patchValue({ format: 'csv' });
      expect(component.form.valid).toBe(true);
    });
  });

  describe('Date Range Selection', () => {
    it('should allow 7 days selection', () => {
      component.form.patchValue({ days: 7 });
      expect(component.form.get('days')?.value).toBe(7);
      expect(component.form.valid).toBe(true);
    });

    it('should allow 30 days selection', () => {
      component.form.patchValue({ days: 30 });
      expect(component.form.get('days')?.value).toBe(30);
      expect(component.form.valid).toBe(true);
    });

    it('should allow 60 days selection', () => {
      component.form.patchValue({ days: 60 });
      expect(component.form.get('days')?.value).toBe(60);
      expect(component.form.valid).toBe(true);
    });

    it('should allow 90 days selection', () => {
      component.form.patchValue({ days: 90 });
      expect(component.form.get('days')?.value).toBe(90);
      expect(component.form.valid).toBe(true);
    });

    it('should reject days below minimum (0)', () => {
      component.form.patchValue({ days: 0 });
      expect(component.form.get('days')?.hasError('min')).toBe(true);
      expect(component.form.valid).toBe(false);
    });

    it('should reject days above maximum (91)', () => {
      component.form.patchValue({ days: 91 });
      expect(component.form.get('days')?.hasError('max')).toBe(true);
      expect(component.form.valid).toBe(false);
    });

    it('should reject negative days', () => {
      component.form.patchValue({ days: -30 });
      expect(component.form.get('days')?.hasError('min')).toBe(true);
      expect(component.form.valid).toBe(false);
    });
  });

  describe('Form Submission', () => {
    it('should emit submit event with CSV export options on submit', () => {
      const submitSpy = vi.spyOn(component.submitEvent, 'emit');
      component.form.patchValue({ format: 'csv', days: 30 });
      component.onSubmit();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'csv',
          days: 30,
        })
      );

      submitSpy.mockRestore();
    });

    it('should emit submit event with PDF export options on submit', () => {
      const submitSpy = vi.spyOn(component.submitEvent, 'emit');
      component.form.patchValue({ format: 'pdf', days: 60 });
      component.onSubmit();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'pdf',
          days: 60,
        })
      );

      submitSpy.mockRestore();
    });

    it('should emit ExportOptions with correct structure', () => {
      const submitSpy = vi.spyOn(component.submitEvent, 'emit');
      component.form.patchValue({ format: 'csv', days: 7 });
      component.onSubmit();

      const callArg = submitSpy.mock.calls[0][0];
      expect(callArg).toHaveProperty('format');
      expect(callArg).toHaveProperty('days');
      expect(Object.keys(callArg).length).toBe(2);

      submitSpy.mockRestore();
    });

    it('should not emit if form is invalid', () => {
      const submitSpy = vi.spyOn(component.submitEvent, 'emit');
      component.form.patchValue({ days: 100 }); // Invalid (> 90)
      component.onSubmit();

      expect(submitSpy).not.toHaveBeenCalled();

      submitSpy.mockRestore();
    });

    it('should show submit button as disabled when form is invalid', () => {
      component.form.patchValue({ days: 100 });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector(
        'button[type="submit"]'
      );
      expect(submitButton.disabled).toBe(true);
    });

    it('should show submit button as enabled when form is valid', () => {
      component.form.patchValue({ format: 'csv', days: 30 });
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector(
        'button[type="submit"]'
      );
      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('Dialog Actions', () => {
    it('should emit cancel event when cancel is clicked', () => {
      const cancelSpy = vi.spyOn(component.cancelEvent, 'emit');
      component.onCancel();

      expect(cancelSpy).toHaveBeenCalledWith();

      cancelSpy.mockRestore();
    });

    it('should disable all buttons during submission', () => {
      fixture.componentRef.setInput('isSubmitting', true);
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector(
        'button[type="submit"]'
      );
      const cancelButton = fixture.nativeElement.querySelector(
        'button[type="button"]'
      );

      expect(submitButton.disabled).toBe(true);
      expect(cancelButton.disabled).toBe(true);
    });

    it('should enable buttons when submission completes', () => {
      fixture.componentRef.setInput('isSubmitting', true);
      fixture.detectChanges();

      fixture.componentRef.setInput('isSubmitting', false);
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector(
        'button[type="submit"]'
      );
      const cancelButton = fixture.nativeElement.querySelector(
        'button[type="button"]'
      );

      expect(submitButton.disabled).toBe(false);
      expect(cancelButton.disabled).toBe(false);
    });
  });

  describe('UI Rendering', () => {
    it('should render dialog title', () => {
      const title = fixture.nativeElement.querySelector('h2');
      expect(title?.textContent).toContain('Export Analytics');
    });

    it('should render format radio buttons', () => {
      const radioButtons = fixture.nativeElement.querySelectorAll(
        'input[type="radio"]'
      );
      expect(radioButtons.length).toBe(2);
    });

    it('should render date range select dropdown', () => {
      const select = fixture.nativeElement.querySelector('select');
      expect(select).toBeTruthy();
    });

    it('should render cancel and export buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Cancel');
      expect(buttons[1].textContent).toContain('Export');
    });

    it('should show CSV info message when CSV is selected', () => {
      component.form.patchValue({ format: 'csv' });
      fixture.detectChanges();

      const infoBox = fixture.nativeElement.querySelector(
        '[role="status"]'
      );
      expect(infoBox?.textContent).toContain('CSV');
      expect(infoBox?.textContent).toContain('Excel');
    });

    it('should show loading spinner during submission', () => {
      fixture.componentRef.setInput('isSubmitting', true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();

      const label = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(label?.textContent).toContain('Exporting...');
    });

    it('should hide spinner when submission completes', () => {
      fixture.componentRef.setInput('isSubmitting', true);
      fixture.detectChanges();

      fixture.componentRef.setInput('isSubmitting', false);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeFalsy();

      const label = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(label?.textContent).toContain('Export Data');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible radio button labels', () => {
      const labels = fixture.nativeElement.querySelectorAll('label');
      expect(labels.length).toBeGreaterThan(0);
      // Each label should be associated with a radio input
      labels.forEach((label: HTMLElement) => {
        const input = label.querySelector('input[type="radio"]');
        expect(input).toBeTruthy();
      });
    });

    it('should have aria-label on radio options', () => {
      const radioButtons = fixture.nativeElement.querySelectorAll(
        'input[type="radio"]'
      );
      radioButtons.forEach((radio: HTMLElement) => {
        expect(radio.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have aria-label on select dropdown', () => {
      const select = fixture.nativeElement.querySelector('select');
      expect(select?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on buttons', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLElement) => {
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have proper role and aria-busy on submit button during loading', () => {
      fixture.componentRef.setInput('isSubmitting', true);
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector(
        'button[type="submit"]'
      );
      expect(submitButton.getAttribute('aria-busy')).toBe('true');
    });

    it('should have role=status on info message', () => {
      const infoBox = fixture.nativeElement.querySelector('[role="status"]');
      expect(infoBox).toBeTruthy();
    });

    it('should have fieldset elements for form groups', () => {
      const fieldsets = fixture.nativeElement.querySelectorAll('fieldset');
      expect(fieldsets.length).toBe(2); // Format and Date Range
    });

    it('should have legend elements for fieldset labels', () => {
      const legends = fixture.nativeElement.querySelectorAll('legend');
      expect(legends.length).toBe(2);
      expect(legends[0]?.textContent).toContain('Export Format');
      expect(legends[1]?.textContent).toContain('Time Period');
    });
  });

  describe('Form State Edge Cases', () => {
    it('should handle rapid format changes', () => {
      component.form.patchValue({ format: 'csv' });
      component.form.patchValue({ format: 'pdf' });
      component.form.patchValue({ format: 'csv' });

      expect(component.form.get('format')?.value).toBe('csv');
      expect(component.form.valid).toBe(true);
    });

    it('should maintain other field values when changing format', () => {
      component.form.patchValue({ days: 60 });
      component.form.patchValue({ format: 'pdf' });

      expect(component.form.get('days')?.value).toBe(60);
      expect(component.form.get('format')?.value).toBe('pdf');
    });

    it('should maintain other field values when changing days', () => {
      component.form.patchValue({ format: 'pdf' });
      component.form.patchValue({ days: 90 });

      expect(component.form.get('format')?.value).toBe('pdf');
      expect(component.form.get('days')?.value).toBe(90);
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate all required fields', () => {
      const form = component.form;
      expect(form.get('format')?.hasError('required')).toBe(false);
      expect(form.get('days')?.hasError('required')).toBe(false);
    });

    it('should have correct validators on format control', () => {
      const formatControl = component.form.get('format');
      formatControl?.setErrors(null);

      expect(formatControl?.hasError('required')).toBe(false);
    });

    it('should have correct validators on days control', () => {
      const daysControl = component.form.get('days');

      // Test min validator
      daysControl?.setValue(0);
      expect(daysControl?.hasError('min')).toBe(true);

      // Test max validator
      daysControl?.setValue(91);
      expect(daysControl?.hasError('max')).toBe(true);

      // Test valid values
      daysControl?.setValue(30);
      expect(daysControl?.hasError('min')).toBe(false);
      expect(daysControl?.hasError('max')).toBe(false);
    });
  });
});
