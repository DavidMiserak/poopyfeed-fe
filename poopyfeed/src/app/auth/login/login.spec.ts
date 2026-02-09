import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: AuthService;
  let router: Router;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
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

  it('should have a login form with email and password fields', () => {
    expect(component.loginForm.controls.email).toBeTruthy();
    expect(component.loginForm.controls.password).toBeTruthy();
  });

  it('should require email and password', () => {
    expect(component.loginForm.valid).toBeFalsy();
    component.loginForm.controls.email.setValue('test@example.com');
    expect(component.loginForm.valid).toBeFalsy();
    component.loginForm.controls.password.setValue('password123');
    expect(component.loginForm.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const email = component.loginForm.controls.email;
    email.setValue('invalid-email');
    expect(email.hasError('email')).toBeTruthy();
    email.setValue('test@example.com');
    expect(email.hasError('email')).toBeFalsy();
  });

  it('should validate password length', () => {
    const password = component.loginForm.controls.password;
    password.setValue('short');
    expect(password.hasError('minlength')).toBeTruthy();
    password.setValue('password123');
    expect(password.hasError('minlength')).toBeFalsy();
  });

  it('should not submit form when invalid', () => {
    component.loginForm.controls.email.setValue('');
    component.loginForm.controls.password.setValue('');
    component.onSubmit();
    expect(component.isSubmitting()).toBeFalsy();
  });

  it('should set isSubmitting to true when valid form is submitted', () => {
    component.loginForm.controls.email.setValue('test@example.com');
    component.loginForm.controls.password.setValue('password123');
    component.onSubmit();
    expect(component.isSubmitting()).toBeTruthy();
  });

  it('should clear error on submit', () => {
    component.error.set('Previous error');
    component.loginForm.controls.email.setValue('test@example.com');
    component.loginForm.controls.password.setValue('password123');
    component.onSubmit();
    expect(component.error()).toBeNull();
  });

  it('should render error message when error signal is set', () => {
    component.error.set('Invalid credentials');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('.border-red-500');
    expect(errorDiv?.textContent).toContain('Invalid credentials');
  });

  it('should not render error message when error signal is null', () => {
    component.error.set(null);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorDiv = compiled.querySelector('.border-red-500');
    expect(errorDiv).toBeNull();
  });

  it('should show email validation errors in template', () => {
    const emailControl = component.loginForm.controls.email;
    emailControl.setValue('invalid-email');
    emailControl.markAsTouched();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const errorText = compiled.querySelector('input[type="email"] + p');
    expect(errorText?.textContent).toContain('Please enter a valid email');
  });

  it('should show password validation errors in template', () => {
    const passwordControl = component.loginForm.controls.password;
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

  it('should disable submit button when form is invalid', () => {
    component.loginForm.controls.email.setValue('');
    component.loginForm.controls.password.setValue('');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTruthy();
  });

  it('should enable submit button when form is valid', () => {
    component.loginForm.controls.email.setValue('test@example.com');
    component.loginForm.controls.password.setValue('password123');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeFalsy();
  });

  it('should show loading spinner when submitting', () => {
    component.loginForm.controls.email.setValue('test@example.com');
    component.loginForm.controls.password.setValue('password123');
    component.onSubmit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('.animate-spin');
    const buttonText = compiled.querySelector('button[type="submit"]')?.textContent;
    expect(spinner).toBeTruthy();
    expect(buttonText).toContain('Signing in...');
  });

  it('should hide loading spinner when not submitting', () => {
    component.isSubmitting.set(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('.animate-spin');
    const buttonText = compiled.querySelector('button[type="submit"]')?.textContent;
    expect(spinner).toBeNull();
    expect(buttonText).toContain('Sign In');
  });

  it('should have link to signup page', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const signupLink = compiled.querySelector('a[routerLink="/signup"]');
    expect(signupLink?.textContent).toContain('Sign up free');
  });

  it('should set error when email or password is missing', () => {
    component.loginForm.controls.email.setValue('test@example.com');
    component.loginForm.controls.password.setValue('');
    component.loginForm.controls.password.clearValidators();
    component.loginForm.controls.password.updateValueAndValidity();
    component.onSubmit();
    expect(component.error()).toBe('Email and password are required');
  });

  describe('Async login flow', () => {
    it('should navigate to home on successful login', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      const loginSpy = vi
        .spyOn(authService, 'login')
        .mockReturnValue(of({ auth_token: 'test-token' }));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.onSubmit();

      expect(loginSpy).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.isSubmitting()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/children']);
    });

    it('should display error message on login failure', () => {
      const loginSpy = vi
        .spyOn(authService, 'login')
        .mockReturnValue(throwError(() => new Error('Invalid credentials')));

      component.loginForm.setValue({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      component.onSubmit();

      expect(loginSpy).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
      expect(component.error()).toBe('Invalid credentials');
    });
  });
});
