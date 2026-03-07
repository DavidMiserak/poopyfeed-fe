import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  describe('browser platform', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: true },
        configurable: true,
      });
      TestBed.configureTestingModule({
        providers: [
          NetworkStatusService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('should be created', () => {
      const service = TestBed.inject(NetworkStatusService);
      expect(service).toBeTruthy();
    });

    it('should report initial isOnline from navigator.onLine', () => {
      const service = TestBed.inject(NetworkStatusService);
      expect(service.isOnline()).toBe(true);
    });
  });

  describe('browser platform when navigator reports offline', () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, 'navigator', {
        value: { onLine: false },
        configurable: true,
      });
      TestBed.configureTestingModule({
        providers: [
          NetworkStatusService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('should report isOnline false', () => {
      const service = TestBed.inject(NetworkStatusService);
      expect(service.isOnline()).toBe(false);
    });
  });

  describe('server platform', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          NetworkStatusService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
    });

    it('should default isOnline to true on server', () => {
      const service = TestBed.inject(NetworkStatusService);
      expect(service.isOnline()).toBe(true);
    });
  });
});
