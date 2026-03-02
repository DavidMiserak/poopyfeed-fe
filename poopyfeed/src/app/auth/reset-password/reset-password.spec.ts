import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ResetPassword } from './reset-password';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let authService: AuthService;
  let accountService: AccountService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'key' ? 'reset-key-123' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    accountService = TestBed.inject(AccountService);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require password and confirmPassword', () => {
    expect(component.form.valid).toBeFalsy();
    component.form.patchValue({
      password: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!',
    });
    expect(component.form.valid).toBeTruthy();
  });

  it('should set error when passwords do not match', () => {
    component.form.patchValue({
      password: 'NewSecurePass1!',
      confirmPassword: 'DifferentPass1!',
    });

    component.onSubmit();

    expect(component.error()).toBe('Passwords do not match');
  });

  it('should call AuthService and AccountService on successful reset', () => {
    const resetSpy = vi
      .spyOn(authService, 'resetPassword')
      .mockReturnValue(of({ auth_token: 'new-token' }));
    const profileSpy = vi
      .spyOn(accountService, 'getProfile')
      .mockReturnValue(of({
        id: 1,
        email: 'test@example.com',
        first_name: '',
        last_name: '',
        timezone: 'UTC',
      }) as any);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.form.patchValue({
      password: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!',
    });

    component.onSubmit();

    expect(resetSpy).toHaveBeenCalledWith({
      key: 'reset-key-123',
      password: 'NewSecurePass1!',
    });
    expect(profileSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/children']);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should handle error from AuthService', () => {
    const resetSpy = vi
      .spyOn(authService, 'resetPassword')
      .mockReturnValue(throwError(() => new Error('Invalid or expired key')));

    component.form.patchValue({
      password: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!',
    });

    component.onSubmit();

    expect(resetSpy).toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
    expect(component.error()).toBe('Invalid or expired key');
  });
});
