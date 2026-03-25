import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialLoginButtons } from './social-login-buttons';
import { AuthService } from '../../services/auth.service';
import { vi } from 'vitest';

describe('SocialLoginButtons', () => {
  let component: SocialLoginButtons;
  let fixture: ComponentFixture<SocialLoginButtons>;
  let authServiceSpy: { socialRedirect: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceSpy = { socialRedirect: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SocialLoginButtons],
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SocialLoginButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render Google and Facebook buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Google');
    expect(buttons[1].textContent).toContain('Facebook');
  });

  it('should call socialRedirect with google on Google click', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    expect(authServiceSpy.socialRedirect).toHaveBeenCalledWith(
      'google',
      expect.stringContaining('/auth/callback'),
      'login',
    );
  });

  it('should call socialRedirect with facebook on Facebook click', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    expect(authServiceSpy.socialRedirect).toHaveBeenCalledWith(
      'facebook',
      expect.stringContaining('/auth/callback'),
      'login',
    );
  });

  it('should render or separator', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('or');
  });
});
