import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { provideRouter } from '@angular/router';

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
});
