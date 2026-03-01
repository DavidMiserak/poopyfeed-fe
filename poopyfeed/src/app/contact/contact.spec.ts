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

    it('should show "Sending..." when form is submitting', () => {
      component.form.patchValue({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'This is a detailed inquiry message',
      });
      component.form.disable();
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        'button[type="submit"]'
      );
      expect(button.textContent?.trim()).toBe('Sending...');
    });

    it('should show "Send Message" when form is not submitting', () => {
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
      expect(button.textContent?.trim()).toBe('Send Message');
    });
  });

  describe('Template validation error messages', () => {
    it('should show name required error when name is empty and touched', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const nameError = el.querySelector('[data-testid="contact-name-error"]');
      expect(nameError?.textContent).toContain('Full name is required');
    });

    it('should show name minlength error when name is too short and touched', () => {
      const nameControl = component.form.get('name');
      nameControl?.setValue('A');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const nameError = el.querySelector('[data-testid="contact-name-error"]');
      expect(nameError?.textContent).toContain('at least 2 characters');
    });

    it('should show email required error when email is empty and touched', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const emailError = el.querySelector('[data-testid="contact-email-error"]');
      expect(emailError?.textContent).toContain('Email is required');
    });

    it('should show email format error when email is invalid and touched', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const emailError = el.querySelector('[data-testid="contact-email-error"]');
      expect(emailError?.textContent).toContain('valid email');
    });

    it('should show subject required error when subject is empty and touched', () => {
      const subjectControl = component.form.get('subject');
      subjectControl?.setValue('');
      subjectControl?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const subjectError = el.querySelector(
        '[data-testid="contact-subject-error"]'
      );
      expect(subjectError?.textContent).toContain('Subject is required');
    });

    it('should show message required error when message is empty and touched', () => {
      const messageControl = component.form.get('message');
      messageControl?.setValue('');
      messageControl?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const messageError = el.querySelector(
        '[data-testid="contact-message-error"]'
      );
      expect(messageError?.textContent).toContain('Message is required');
    });

    it('should show message minlength error when message is too short and touched', () => {
      const messageControl = component.form.get('message');
      messageControl?.setValue('short');
      messageControl?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const messageError = el.querySelector(
        '[data-testid="contact-message-error"]'
      );
      expect(messageError?.textContent).toContain('at least 10 characters');
    });
  });
});
