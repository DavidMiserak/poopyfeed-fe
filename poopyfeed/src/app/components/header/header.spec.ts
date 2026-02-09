import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Header } from './header';
import { AuthService } from '../../services/auth.service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    await fixture.whenStable();
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
    expect(signupLink?.textContent?.trim()).toBe('Sign Up');
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

  it('should show "Logged in" indicator when authenticated', () => {
    localStorage.setItem('auth_token', 'test-token');
    authService['authToken'].set('test-token');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusText = compiled.querySelector('.text-sm.text-gray-600');
    expect(statusText?.textContent).toContain('Logged in');
  });

  it('should have PoopyFeed brand link', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const brandLink = compiled.querySelector('a[routerLink="/"]');
    expect(brandLink?.textContent?.trim()).toBe('PoopyFeed');
  });
});
