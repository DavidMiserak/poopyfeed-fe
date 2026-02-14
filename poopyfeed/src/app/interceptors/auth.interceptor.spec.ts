import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header to API requests when token exists', () => {
    // Clear and recreate with token already in localStorage
    TestBed.resetTestingModule();
    localStorage.setItem('auth_token', 'test-token-123');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService);

    httpClient.get('/api/v1/children/').subscribe();

    const req = httpMock.expectOne('/api/v1/children/');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Token test-token-123');
    req.flush({});
  });

  it('should not add Authorization header when no token exists', () => {
    httpClient.get('/api/v1/children/').subscribe();

    const req = httpMock.expectOne('/api/v1/children/');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should not add Authorization header to non-API requests', () => {
    // Clear and recreate with token already in localStorage
    TestBed.resetTestingModule();
    localStorage.setItem('auth_token', 'test-token-123');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    httpClient.get('/some-other-endpoint').subscribe();

    const req = httpMock.expectOne('/some-other-endpoint');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should add token header to different API endpoints', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('auth_token', 'my-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    // Test multiple different API endpoints
    httpClient.get('/api/v1/children/').subscribe();
    httpClient.post('/api/v1/children/1/feedings/', {}).subscribe();
    httpClient.get('/api/v1/account/').subscribe();

    const children = httpMock.expectOne('/api/v1/children/');
    const feeding = httpMock.expectOne('/api/v1/children/1/feedings/');
    const account = httpMock.expectOne('/api/v1/account/');

    expect(children.request.headers.get('Authorization')).toBe('Token my-token');
    expect(feeding.request.headers.get('Authorization')).toBe('Token my-token');
    expect(account.request.headers.get('Authorization')).toBe('Token my-token');

    children.flush({});
    feeding.flush({});
    account.flush({});
  });

  it('should not add header when token is null', () => {
    httpClient.get('/api/v1/children/').subscribe();

    const req = httpMock.expectOne('/api/v1/children/');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should handle URLs with /api/v1/ in path but non-API', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('auth_token', 'test-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    // This URL has /api/v1/ in the path - interceptor should add header
    httpClient.get('/other-service/api/v1/data').subscribe();

    const req = httpMock.expectOne('/other-service/api/v1/data');
    // Based on implementation, it checks if url.includes('/api/v1/'), so this WILL match
    expect(req.request.headers.get('Authorization')).toBe('Token test-token');
    req.flush({});
  });

  it('should preserve existing headers when adding Authorization', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('auth_token', 'test-token');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/v1/children/', {
      headers: { 'Custom-Header': 'custom-value' }
    }).subscribe();

    const req = httpMock.expectOne('/api/v1/children/');
    expect(req.request.headers.get('Authorization')).toBe('Token test-token');
    expect(req.request.headers.get('Custom-Header')).toBe('custom-value');
    req.flush({});
  });

  it('should handle empty string token', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('auth_token', '');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);

    httpClient.get('/api/v1/children/').subscribe();

    const req = httpMock.expectOne('/api/v1/children/');
    // Empty string is falsy, so no header should be added
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
