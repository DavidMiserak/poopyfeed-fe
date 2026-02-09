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

    it('should handle logout when no token exists', () => {
      // Clear any existing token
      localStorage.removeItem('auth_token');
      service['authToken'].set(null);

      let errorCaught = false;

      service.logout().subscribe({
        error: (error) => {
          expect(error.message).toBe('No token found');
          expect(service.getToken()).toBeNull();
          errorCaught = true;
        },
      });

      // Should not make HTTP request when no token
      expect(errorCaught).toBe(true);
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
    it('should handle non_field_errors from Django', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'wrong' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('non_field_errors: Invalid credentials, Please try again');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
      req.flush(
        { non_field_errors: ['Invalid credentials', 'Please try again'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle 401 Unauthorized error with specific message', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'wrong' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid email or password');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
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

      const req = httpMock.expectOne('/api/v1/auth/users/');
      req.flush({}, { status: 400, statusText: 'Bad Request' });

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

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
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

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
      req.error(new ProgressEvent('error'));

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

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
      req.flush({ detail: 'Unable to authenticate' }, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle field-specific error arrays', () => {
      let errorCaught = false;

      service.signup({ email: 'bad-email', password: 'short' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('password: Password must be at least 8 characters');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/users/');
      req.flush(
        { password: ['Password must be at least 8 characters'] },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(errorCaught).toBe(true);
    });

    it('should handle error when no error object present', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'password' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('An unexpected error occurred. Please try again.');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
      // Simulate network error with no response body
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(errorCaught).toBe(true);
    });

    it('should handle error response with empty error object', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'password' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid email or password');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
    });

    it('should handle error response with null error object', () => {
      let errorCaught = false;

      service.login({ email: 'test@example.com', password: 'password' }).subscribe({
        error: (error) => {
          expect(error.message).toBe('An unexpected error occurred. Please try again.');
          errorCaught = true;
        },
      });

      const req = httpMock.expectOne('/api/v1/auth/token/login/');
      req.flush(null, { status: 503, statusText: 'Service Unavailable' });

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

    it('should clear token on logout', () => {
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
