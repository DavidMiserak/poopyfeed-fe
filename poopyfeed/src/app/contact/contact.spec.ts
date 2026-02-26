import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Contact } from './contact';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
    }).compileComponents();

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should have invalid form when empty', () => {
      expect(component.form.valid).toBe(false);
    });

    it('should validate name field', () => {
      const nameControl = component.form.get('name');

      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBe(true);

      nameControl?.setValue('A');
      expect(nameControl?.hasError('minlength')).toBe(true);

      nameControl?.setValue('John Doe');
      expect(nameControl?.valid).toBe(true);
    });

    it('should validate email field', () => {
      const emailControl = component.form.get('email');

      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should validate subject field', () => {
      const subjectControl = component.form.get('subject');

      subjectControl?.setValue('');
      expect(subjectControl?.hasError('required')).toBe(true);

      subjectControl?.setValue('Feedback');
      expect(subjectControl?.valid).toBe(true);
    });

    it('should validate message field', () => {
      const messageControl = component.form.get('message');

      messageControl?.setValue('');
      expect(messageControl?.hasError('required')).toBe(true);

      messageControl?.setValue('short');
      expect(messageControl?.hasError('minlength')).toBe(true);

      messageControl?.setValue('This is a valid message');
      expect(messageControl?.valid).toBe(true);
    });

    it('should have valid form when all fields are filled correctly', () => {
      component.form.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'This is a detailed inquiry message',
      });

      expect(component.form.valid).toBe(true);
    });
  });

  describe('Form Submission', () => {
    it('should disable form when submitting', () => {
      component.form.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'This is a detailed inquiry message',
      });

      expect(component.isSubmitting).toBe(false);

      // Mock form submission
      const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit');
      component.onSubmit();

      expect(component.form.disabled).toBe(true);
      expect(component.isSubmitting).toBe(true);

      submitSpy.mockRestore();
    });

    it('should not submit invalid form', () => {
      const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit');

      component.onSubmit();

      expect(submitSpy).not.toHaveBeenCalled();

      submitSpy.mockRestore();
    });

    it('should submit valid form', () => {
      component.form.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'This is a detailed inquiry message',
      });

      const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit');

      component.onSubmit();

      expect(submitSpy).toHaveBeenCalled();

      submitSpy.mockRestore();
    });
  });

  describe('Button Disabled State', () => {
    it('should disable submit button when form is invalid', () => {
      const button = fixture.nativeElement.querySelector(
        'button[type="submit"]'
      );
      expect(button.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', () => {
      component.form.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'This is a detailed inquiry message',
      });

      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        'button[type="submit"]'
      );
      expect(button.disabled).toBe(false);
    });
  });
});
