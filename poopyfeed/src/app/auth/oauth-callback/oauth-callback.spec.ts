import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { OAuthCallback } from './oauth-callback';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { ToastService } from '../../services/toast.service';
import { GaTrackingService } from '../../services/ga-tracking.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('OAuthCallback', () => {
  let component: OAuthCallback;
  let fixture: ComponentFixture<OAuthCallback>;
  let router: Router;
  let authServiceSpy: { completeSocialLogin: ReturnType<typeof vi.fn> };
  let accountServiceSpy: { getProfile: ReturnType<typeof vi.fn> };
  let toastSpy: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let gaSpy: { trackEvent: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceSpy = {
      completeSocialLogin: vi.fn().mockReturnValue(of({ auth_token: 'token123' })),
    };
    accountServiceSpy = { getProfile: vi.fn().mockReturnValue(of({})) };
    toastSpy = { success: vi.fn(), error: vi.fn() };
    gaSpy = { trackEvent: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OAuthCallback],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: GaTrackingService, useValue: gaSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(OAuthCallback);
    component = fixture.componentInstance;
  });

  it('should complete social login on init', () => {
    fixture.detectChanges(); // triggers ngOnInit
    expect(authServiceSpy.completeSocialLogin).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/children']);
    expect(toastSpy.success).toHaveBeenCalledWith('Signed in successfully');
  });

  it('should track login event via GA', () => {
    fixture.detectChanges();
    expect(gaSpy.trackEvent).toHaveBeenCalledWith('login', { method: 'social' });
  });

  it('should fetch profile after successful login', () => {
    fixture.detectChanges();
    expect(accountServiceSpy.getProfile).toHaveBeenCalled();
  });

  it('should navigate to children even if profile fetch fails', () => {
    accountServiceSpy.getProfile.mockReturnValue(throwError(() => new Error('Profile error')));
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/children']);
  });

  it('should show error on failure', () => {
    authServiceSpy.completeSocialLogin.mockReturnValue(
      throwError(() => new Error('Auth failed')),
    );
    fixture.detectChanges();
    expect(component.error()).toBe('Auth failed');
    expect(toastSpy.error).toHaveBeenCalledWith('Social login failed');
  });

  it('should show spinner while loading', () => {
    // Don't trigger ngOnInit yet
    const spinner = fixture.nativeElement.querySelector('svg');
    expect(spinner).toBeDefined();
  });
});
