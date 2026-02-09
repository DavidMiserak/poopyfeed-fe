import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { Header } from './header';
import { AuthService } from '../../services/auth.service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show login and signup links when not authenticated', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const loginLink = compiled.querySelector('a[routerLink="/login"]');
    const signupLink = compiled.querySelector('a[routerLink="/signup"]');
    expect(loginLink?.textContent?.trim()).toBe('Login');
    expect(signupLink?.textContent?.trim()).toBe('Get Started');
  });

  it('should show logout button when authenticated', () => {
    // Set a token to simulate authenticated state
    localStorage.setItem('auth_token', 'test-token');
    authService['authToken'].set('test-token');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector('button');
    expect(logoutButton?.textContent?.trim()).toBe('Logout');
  });

  it('should show "Active" indicator when authenticated', () => {
    localStorage.setItem('auth_token', 'test-token');
    authService['authToken'].set('test-token');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusText = compiled.querySelector('.text-sm.font-medium.text-emerald-700');
    expect(statusText?.textContent).toContain('Active');
  });

  it('should have PoopyFeed brand link', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const brandLink = compiled.querySelector('a[routerLink="/"]');
    expect(brandLink?.textContent).toContain('Poopy');
    expect(brandLink?.textContent).toContain('Feed');
  });

  describe('Logout functionality', () => {
    it('should call authService.logout() when logout button clicked', () => {
      localStorage.setItem('auth_token', 'test-token');
      authService['authToken'].set('test-token');
      fixture.detectChanges();

      const logoutSpy = vi.spyOn(authService, 'logout').mockReturnValue(of(undefined));

      const logoutButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      logoutButton.click();

      expect(logoutSpy).toHaveBeenCalledOnce();
    });

    it('should handle successful logout', () => {
      localStorage.setItem('auth_token', 'test-token');
      authService['authToken'].set('test-token');

      const logoutSpy = vi.spyOn(authService, 'logout').mockReturnValue(of(undefined));

      component.logout();

      expect(logoutSpy).toHaveBeenCalledOnce();
    });

    it('should handle logout API failure gracefully', () => {
      localStorage.setItem('auth_token', 'test-token');
      authService['authToken'].set('test-token');

      const logoutSpy = vi
        .spyOn(authService, 'logout')
        .mockReturnValue(throwError(() => new Error('Logout failed')));

      // Should not throw error
      expect(() => component.logout()).not.toThrow();
      expect(logoutSpy).toHaveBeenCalledOnce();
    });
  });
});
