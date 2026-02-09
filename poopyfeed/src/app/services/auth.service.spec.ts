import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token', () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { auth_token: 'test-token-123' };

      service.login(credentials).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(service.getToken()).toBe('test-token-123');
          expect(localStorage.getItem('auth_token')).toBe('test-token-123');
          expect(service.isAuthenticated()).toBe(true);
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      let errorCaught = false;

      service.login(credentials).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid credentials');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
      req.flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('signup', () => {
    it('should signup successfully', () => {
      const signupData = { email: 'new@example.com', password: 'password123' };
      const mockResponse = { id: 1, email: 'new@example.com' };

      service.signup(signupData).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/users/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(signupData);
      req.flush(mockResponse);
    });

    it('should handle signup error', () => {
      const signupData = { email: 'existing@example.com', password: 'password123' };

      service.signup(signupData).subscribe({
        error: (error) => {
          expect(error.message).toContain('email:');
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/users/');
      req.flush(
        { email: ['User with this email already exists.'] },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', () => {
      // Set a token first
      localStorage.setItem('auth_token', 'test-token');
      service['authToken'].set('test-token');

      service.logout().subscribe({
        next: () => {
          expect(service.getToken()).toBeNull();
          expect(localStorage.getItem('auth_token')).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/logout/');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should clear token even if logout API fails', () => {
      localStorage.setItem('auth_token', 'test-token');
      service['authToken'].set('test-token');

      service.logout().subscribe({
        error: () => {
          expect(service.getToken()).toBeNull();
          expect(localStorage.getItem('auth_token')).toBeNull();
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/logout/');
      req.flush({ detail: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('token persistence', () => {
    it('should load token from localStorage on init', () => {
      // Clear and recreate the testing module with token already in localStorage
      TestBed.resetTestingModule();
      localStorage.setItem('auth_token', 'stored-token');

      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
        ],
      });

      const newService = TestBed.inject(AuthService);
      expect(newService.getToken()).toBe('stored-token');
      expect(newService.isAuthenticated()).toBe(true);
    });
  });
});
