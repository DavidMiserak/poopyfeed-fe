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
    expect(loginLink?.textContent?.trim()).toBe('Log in');
    expect(signupLink?.textContent?.trim()).toBe('Get Started');
  });

  it('should show logout button when authenticated', () => {
    localStorage.setItem('auth_token', 'test-token');
    authService['authToken'].set('test-token');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector('button[aria-label="Log out"]');
    expect(logoutButton).toBeTruthy();
    expect(logoutButton?.textContent).toContain('Log out');
  });

  it('should show My Children link when authenticated', () => {
    localStorage.setItem('auth_token', 'test-token');
    authService['authToken'].set('test-token');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const childrenLink = compiled.querySelector('a[routerLink="/children"]');
    expect(childrenLink?.textContent?.trim()).toBe('My Children');
  });

  it('should have PoopyFeed brand link', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const brandLink = compiled.querySelector('a[routerLink="/"]');
    expect(brandLink?.textContent).toContain('Poopy');
    expect(brandLink?.textContent).toContain('Feed');
  });

  describe('Mobile menu', () => {
    it('should start with menu closed', () => {
      expect(component.menuOpen()).toBe(false);
    });

    it('should toggle menu open and closed', () => {
      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);

      component.toggleMenu();
      expect(component.menuOpen()).toBe(false);
    });

    it('should render hamburger button', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('button[aria-label="Toggle navigation menu"]');
      expect(hamburger).toBeTruthy();
    });

    it('should update aria-expanded when toggled', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger = compiled.querySelector('button[aria-label="Toggle navigation menu"]');
      expect(hamburger?.getAttribute('aria-expanded')).toBe('false');

      component.toggleMenu();
      fixture.detectChanges();
      expect(hamburger?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should close menu on logout', () => {
      localStorage.setItem('auth_token', 'test-token');
      authService['authToken'].set('test-token');

      component.menuOpen.set(true);
      const logoutSpy = vi.spyOn(authService, 'logout').mockReturnValue(of(undefined));

      component.logout();

      expect(component.menuOpen()).toBe(false);
      expect(logoutSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Logout functionality', () => {
    it('should call authService.logout() when logout button clicked', () => {
      localStorage.setItem('auth_token', 'test-token');
      authService['authToken'].set('test-token');
      fixture.detectChanges();

      const logoutSpy = vi.spyOn(authService, 'logout').mockReturnValue(of(undefined));

      const logoutButton = fixture.nativeElement.querySelector(
        'button[aria-label="Log out"]',
      ) as HTMLButtonElement;
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
