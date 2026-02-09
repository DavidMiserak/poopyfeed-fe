import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
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
    it('should login successfully with allauth and store token', () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockAllauthResponse = { status: 200, data: { user: { id: 1, email: 'test@example.com' } } };
      const mockTokenResponse = { auth_token: 'test-token-123' };

      service.login(credentials).subscribe({
        next: (response) => {
          expect(response).toEqual(mockTokenResponse);
          expect(service.getToken()).toBe('test-token-123');
          expect(localStorage.getItem('auth_token')).toBe('test-token-123');
          expect(service.isAuthenticated()).toBe(true);
        },
      });

      // First request: allauth login
      const loginReq = httpMock.expectOne('/api/v1/browser/v1/auth/login');
      expect(loginReq.request.method).toBe('POST');
      expect(loginReq.request.body).toEqual(credentials);
      expect(loginReq.request.withCredentials).toBe(true);
      loginReq.flush(mockAllauthResponse);

      // Second request: get token
      const tokenReq = httpMock.expectOne('/api/v1/browser/v1/auth/token/');
      expect(tokenReq.request.method).toBe('GET');
      expect(tokenReq.request.withCredentials).toBe(true);
      tokenReq.flush(mockTokenResponse);
    });

    it('should handle login error from allauth', () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      let errorCaught = false;

      service.login(credentials).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid credentials');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/login');
      req.flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle token fetch error after successful allauth login', () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockAllauthResponse = { status: 200, data: { user: { id: 1 } } };
      let errorCaught = false;

      service.login(credentials).subscribe({
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
          errorCaught = true;
        },
      });

      // First request succeeds
      const loginReq = httpMock.expectOne('/api/v1/browser/v1/auth/login');
      loginReq.flush(mockAllauthResponse);

      // Second request fails
      const tokenReq = httpMock.expectOne('/api/v1/browser/v1/auth/token/');
      tokenReq.flush({}, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('signup', () => {
    it('should signup successfully with allauth and auto-login', () => {
      const signupData = { email: 'new@example.com', password: 'password123' };
      const mockAllauthResponse = {
        status: 200,
        data: { user: { id: 1, email: 'new@example.com' } },
      };
      const mockTokenResponse = { auth_token: 'new-token-123' };

      service.signup(signupData).subscribe({
        next: (response) => {
          expect(response).toEqual({ id: 1, email: 'new@example.com' });
          expect(service.getToken()).toBe('new-token-123');
          expect(service.isAuthenticated()).toBe(true);
        },
      });

      // First request: allauth signup
      const signupReq = httpMock.expectOne('/api/v1/browser/v1/auth/signup');
      expect(signupReq.request.method).toBe('POST');
      expect(signupReq.request.body).toEqual({ email: signupData.email, password: signupData.password });
      expect(signupReq.request.withCredentials).toBe(true);
      signupReq.flush(mockAllauthResponse);

      // Second request: get token
      const tokenReq = httpMock.expectOne('/api/v1/browser/v1/auth/token/');
      expect(tokenReq.request.method).toBe('GET');
      expect(tokenReq.request.withCredentials).toBe(true);
      tokenReq.flush(mockTokenResponse);
    });

    it('should handle signup error from allauth', () => {
      const signupData = { email: 'existing@example.com', password: 'password123' };

      service.signup(signupData).subscribe({
        error: (error) => {
          expect(error.message).toBe('email: User with this email already exists.');
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/signup');
      req.flush(
        { email: ['User with this email already exists.'] },
        { status: 409, statusText: 'Conflict' }
      );
    });

    it('should handle token fetch error after successful signup', () => {
      const signupData = { email: 'new@example.com', password: 'password123' };
      const mockAllauthResponse = {
        status: 200,
        data: { user: { id: 1, email: 'new@example.com' } },
      };
      let errorCaught = false;

      service.signup(signupData).subscribe({
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
          errorCaught = true;
        },
      });

      // First request succeeds
      const signupReq = httpMock.expectOne('/api/v1/browser/v1/auth/signup');
      signupReq.flush(mockAllauthResponse);

      // Second request fails
      const tokenReq = httpMock.expectOne('/api/v1/browser/v1/auth/token/');
      tokenReq.flush({}, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });
  });

  describe('logout', () => {
    it('should logout successfully with allauth', () => {
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

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
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

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/logout');
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

    it('should handle localStorage access safely', () => {
      // Test that getStoredToken handles the presence of localStorage
      localStorage.clear();
      const token = service['getStoredToken']();
      expect(token).toBeNull();

      localStorage.setItem('auth_token', 'test-token');
      const tokenAfter = service['getStoredToken']();
      expect(tokenAfter).toBe('test-token');
    });
  });

  describe('error handling', () => {
    it('should handle field-specific error arrays', () => {
      let errorCaught = false;

      service.signup({ email: 'bad-email', password: 'short' }).subscribe({
        error: (error) => {
          expect(error.message).toContain('password:');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/signup');
      req.flush(
        { password: ['Password must be at least 8 characters'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle non_field_errors from Django', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'wrong' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('non_field_errors: Invalid credentials, Please try again');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/login');
      req.flush(
        { non_field_errors: ['Invalid credentials', 'Please try again'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle detail field in error response', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'wrong' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('Unable to authenticate');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/login');
      req.flush({ detail: 'Unable to authenticate' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 401 Unauthorized error with generic message', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'wrong' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid email or password');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/login');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 400 Bad Request error', () => {
      let errorCaught = false;

      service.signup({ email: 'test', password: 'short' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid request. Please check your input.');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/signup');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 409 Conflict error', () => {
      let errorCaught = false;

      service.signup({ email: 'existing@example.com', password: 'password123' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('An account with this email already exists.');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/signup');
      req.flush({}, { status: 409, statusText: 'Conflict' });

      expect(errorCaught).toBe(true);
    });

    it('should handle 500 Internal Server Error', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'password' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/login');
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });

      expect(errorCaught).toBe(true);
    });

    it('should handle unexpected error types', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'password' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('An unexpected error occurred. Please try again.');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/browser/v1/auth/login');
      req.error(new ProgressEvent('error'));

      expect(errorCaught).toBe(true);
    });
  });

  describe('authentication state', () => {
    it('should correctly report unauthenticated state', () => {
      localStorage.removeItem('auth_token');
      service['authToken'].set(null);
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getToken()).toBeNull();
    });

    it('should correctly report authenticated state', () => {
      localStorage.setItem('auth_token', 'test-token');
      service['authToken'].set('test-token');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getToken()).toBe('test-token');
    });

    it('should handle empty string token as falsy', () => {
      service['authToken'].set('');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear token on clearToken call', () => {
      localStorage.setItem('auth_token', 'test-token');
      service['authToken'].set('test-token');
      expect(service.isAuthenticated()).toBe(true);

      service['clearToken']();

      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });
});
