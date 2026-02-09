import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a signup form with required fields', () => {
    expect(component.signupForm.controls.name).toBeTruthy();
    expect(component.signupForm.controls.email).toBeTruthy();
    expect(component.signupForm.controls.password).toBeTruthy();
    expect(component.signupForm.controls.confirmPassword).toBeTruthy();
  });

  it('should require all fields', () => {
    expect(component.signupForm.valid).toBeFalsy();
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(component.signupForm.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const email = component.signupForm.controls.email;
    email.setValue('invalid-email');
    expect(email.hasError('email')).toBeTruthy();
    email.setValue('test@example.com');
    expect(email.hasError('email')).toBeFalsy();
  });

  it('should validate password length', () => {
    const password = component.signupForm.controls.password;
    password.setValue('short');
    expect(password.hasError('minlength')).toBeTruthy();
    password.setValue('password123');
    expect(password.hasError('minlength')).toBeFalsy();
  });

  it('should not submit form when invalid', () => {
    component.signupForm.controls.name.setValue('');
    component.onSubmit();
    expect(component.isSubmitting()).toBeFalsy();
  });

  it('should set error when passwords do not match', () => {
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'differentpassword',
    });
    component.onSubmit();
    expect(component.error()).toBe('Passwords do not match');
    expect(component.isSubmitting()).toBeFalsy();
  });

  it('should submit form when valid and passwords match', () => {
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.isSubmitting()).toBeTruthy();
    expect(component.error()).toBeNull();
  });

  it('should clear error on valid submit', () => {
    component.error.set('Previous error');
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.error()).toBeNull();
  });

  it('should validate name minimum length', () => {
    const name = component.signupForm.controls.name;
    name.setValue('A');
    expect(name.hasError('minlength')).toBeTruthy();
    name.setValue('John Doe');
    expect(name.hasError('minlength')).toBeFalsy();
  });

  it('should render error message when error signal is set', () => {
    component.error.set('Email already exists');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('.bg-red-50');
    expect(errorDiv?.textContent).toContain('Email already exists');
  });

  it('should not render error message when error signal is null', () => {
    component.error.set(null);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('.bg-red-50');
    expect(errorDiv).toBeNull();
  });

  it('should show name validation errors in template', () => {
    const nameControl = component.signupForm.controls.name;
    nameControl.setValue('A');
    nameControl.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorElements = compiled.querySelectorAll('p.text-red-600');
    const errorText = Array.from(errorElements).find((el) =>
      el.textContent?.includes('at least 2 characters'),
    );
    expect(errorText).toBeTruthy();
  });

  it('should show email validation errors in template', () => {
    const emailControl = component.signupForm.controls.email;
    emailControl.setValue('invalid-email');
    emailControl.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorElements = compiled.querySelectorAll('p.text-red-600');
    const errorText = Array.from(errorElements).find((el) =>
      el.textContent?.includes('valid email address'),
    );
    expect(errorText).toBeTruthy();
  });

  it('should show password validation errors in template', () => {
    const passwordControl = component.signupForm.controls.password;
    passwordControl.setValue('short');
    passwordControl.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorElements = compiled.querySelectorAll('p.text-red-600');
    const errorText = Array.from(errorElements).find((el) =>
      el.textContent?.includes('at least 8 characters'),
    );
    expect(errorText).toBeTruthy();
  });

  it('should show confirm password validation error in template', () => {
    const confirmControl = component.signupForm.controls.confirmPassword;
    confirmControl.setValue('');
    confirmControl.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorElements = compiled.querySelectorAll('p.text-red-600');
    const errorText = Array.from(errorElements).find((el) =>
      el.textContent?.includes('confirm your password'),
    );
    expect(errorText).toBeTruthy();
  });

  it('should disable submit button when form is invalid', () => {
    component.signupForm.patchValue({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTruthy();
  });

  it('should enable submit button when form is valid', () => {
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalsy();
  });

  it('should show loading spinner when submitting', () => {
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('.animate-spin');
    const buttonText = compiled.querySelector('button[type="submit"]')?.textContent;
    expect(spinner).toBeTruthy();
    expect(buttonText).toContain('Creating account...');
  });

  it('should hide loading spinner when not submitting', () => {
    component.isSubmitting.set(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('.animate-spin');
    const buttonText = compiled.querySelector('button[type="submit"]')?.textContent;
    expect(spinner).toBeNull();
    expect(buttonText).toContain('Create account');
  });

  it('should have social signup buttons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const socialButtons = compiled.querySelectorAll('button[type="button"]');
    expect(socialButtons.length).toBe(2);
    expect(socialButtons[0].textContent).toContain('Google');
    expect(socialButtons[1].textContent).toContain('GitHub');
  });

  it('should have link to login page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const loginLink = compiled.querySelector('a[routerLink="/login"]');
    expect(loginLink?.textContent).toContain('Sign in');
  });

  it('should validate email is required in template', () => {
    const emailControl = component.signupForm.controls.email;
    emailControl.setValue('');
    emailControl.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorElements = compiled.querySelectorAll('p.text-red-600');
    const errorText = Array.from(errorElements).find((el) =>
      el.textContent?.includes('Email is required'),
    );
    expect(errorText).toBeTruthy();
  });

  it('should validate password is required in template', () => {
    const passwordControl = component.signupForm.controls.password;
    passwordControl.setValue('');
    passwordControl.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorElements = compiled.querySelectorAll('p.text-red-600');
    const errorText = Array.from(errorElements).find((el) =>
      el.textContent?.includes('Password is required'),
    );
    expect(errorText).toBeTruthy();
  });

  it('should validate name is required in template', () => {
    const nameControl = component.signupForm.controls.name;
    nameControl.setValue('');
    nameControl.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorElements = compiled.querySelectorAll('p.text-red-600');
    const errorText = Array.from(errorElements).find((el) =>
      el.textContent?.includes('Name is required'),
    );
    expect(errorText).toBeTruthy();
  });

  it('should complete async submission and reset isSubmitting', () => {
    vi.useFakeTimers();
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.isSubmitting()).toBeTruthy();

    vi.advanceTimersByTime(1000); // Advance time by 1 second to trigger setTimeout callback

    expect(component.isSubmitting()).toBeFalsy();
    vi.useRealTimers();
  });

  it('should log form values on successful submission', () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, 'log');
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onSubmit();
    vi.advanceTimersByTime(1000);

    expect(consoleSpy).toHaveBeenCalledWith('Signup submitted:', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    vi.useRealTimers();
  });
});
