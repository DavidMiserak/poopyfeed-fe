import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { PushNotificationService } from './push-notification.service';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        PushNotificationService,
      ],
    });
    service = TestBed.inject(PushNotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have pushEnabled initially false', () => {
    expect(service.pushEnabled()).toBe(false);
  });

  it('should detect browser support', () => {
    // In test environment (jsdom), Notification may or may not exist
    expect(typeof service.isSupported).toBe('boolean');
  });

  it('should set pushEnabled to false after unregisterDevice', async () => {
    // Manually set to true first
    service.pushEnabled.set(true);
    expect(service.pushEnabled()).toBe(true);

    // unregisterDevice with no currentToken is a no-op
    await service.unregisterDevice();
    expect(service.pushEnabled()).toBe(false);
  });

  it('should return false for isSupported on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
        PushNotificationService,
      ],
    });
    const serverService = TestBed.inject(PushNotificationService);
    expect(serverService.isSupported).toBe(false);
  });
});
