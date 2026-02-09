import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { Signup } from './signup';
import { AuthService } from '../../services/auth.service';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let authService: AuthService;
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
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

  it('should set isSubmitting to true when valid form is submitted', () => {
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
    const errorDiv = compiled.querySelector('.border-red-500');
    expect(errorDiv?.textContent).toContain('Email already exists');
  });

  it('should not render error message when error signal is null', () => {
    component.error.set(null);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('.border-red-500');
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
      el.textContent?.includes('At least 2 characters'),
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
      el.textContent?.includes('Please enter a valid email'),
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
      el.textContent?.includes('Must be 8+ characters'),
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
    expect(buttonText).toContain('Create Account');
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

  it('should not submit when passwords do not match', () => {
    component.signupForm.patchValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    component.onSubmit();
    expect(component.error()).toBe('Passwords do not match');
    expect(component.isSubmitting()).toBe(false);
  });

  describe('Full signup and auto-login flow', () => {
    it('should signup then auto-login on success', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const signupSpy = vi
        .spyOn(authService, 'signup')
        .mockReturnValue(of({ id: 1, email: 'test@example.com' }));
      const loginSpy = vi
        .spyOn(authService, 'login')
        .mockReturnValue(of({ auth_token: 'test-token' }));

      component.signupForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      component.onSubmit();

      expect(signupSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.isSubmitting()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });

    it('should handle signup error', () => {
      const signupSpy = vi
        .spyOn(authService, 'signup')
        .mockReturnValue(throwError(() => new Error('Email already exists')));

      component.signupForm.patchValue({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      component.onSubmit();

      expect(signupSpy).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
      expect(component.error()).toBe('Email already exists');
    });

    it('should handle login error after successful signup', () => {
      const signupSpy = vi
        .spyOn(authService, 'signup')
        .mockReturnValue(of({ id: 1, email: 'test@example.com' }));
      const loginSpy = vi
        .spyOn(authService, 'login')
        .mockReturnValue(throwError(() => new Error('Login failed')));

      component.signupForm.patchValue({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      component.onSubmit();

      expect(signupSpy).toHaveBeenCalled();
      expect(loginSpy).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
      expect(component.error()).toBe('Login failed');
    });

    it('should set error when email is missing despite validators', () => {
      // Clear all validators to bypass form validation
      component.signupForm.controls.name.clearValidators();
      component.signupForm.controls.email.clearValidators();
      component.signupForm.controls.password.clearValidators();
      component.signupForm.controls.confirmPassword.clearValidators();

      component.signupForm.patchValue({
        name: 'Test User',
        email: '',
        password: 'password123',
        confirmPassword: 'password123',
      });

      component.signupForm.controls.name.updateValueAndValidity();
      component.signupForm.controls.email.updateValueAndValidity();
      component.signupForm.controls.password.updateValueAndValidity();
      component.signupForm.controls.confirmPassword.updateValueAndValidity();

      component.onSubmit();

      expect(component.error()).toBe('Email and password are required');
      expect(component.isSubmitting()).toBe(false);
    });
  });
});
