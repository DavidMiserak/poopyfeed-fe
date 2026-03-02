import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ForgotPassword } from './forgot-password';
import { AuthService } from '../../services/auth.service';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an email control', () => {
    expect(component.form.controls.email).toBeTruthy();
  });

  it('should require a valid email', () => {
    const email = component.form.controls.email;
    email.setValue('');
    expect(component.form.valid).toBeFalsy();
    email.setValue('invalid-email');
    expect(email.hasError('email')).toBeTruthy();
    email.setValue('valid@example.com');
    expect(email.hasError('email')).toBeFalsy();
  });

  it('should not submit when form is invalid', () => {
    component.form.controls.email.setValue('');
    component.onSubmit();
    expect(component.isSubmitting()).toBeFalsy();
  });

  it('should call AuthService on valid submit', () => {
    const spy = vi
      .spyOn(authService, 'requestPasswordReset')
      .mockReturnValue(of(void 0));

    component.form.controls.email.setValue('user@example.com');
    component.onSubmit();

    expect(spy).toHaveBeenCalledWith({ email: 'user@example.com' });
    expect(component.isSubmitting()).toBe(false);
    expect(component.success()).toBeTruthy();
  });

  it('should handle error from AuthService', () => {
    const spy = vi
      .spyOn(authService, 'requestPasswordReset')
      .mockReturnValue(throwError(() => new Error('Request failed')));

    component.form.controls.email.setValue('user@example.com');
    component.onSubmit();

    expect(spy).toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
    expect(component.error()).toBe('Request failed');
  });
});
