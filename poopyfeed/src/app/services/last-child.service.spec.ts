import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { LastChildService } from './last-child.service';

describe('LastChildService', () => {
  let routerEvents$: Subject<unknown>;
  let mockRouter: { events: Subject<unknown>; url: string };
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    routerEvents$ = new Subject();
    mockRouter = {
      events: routerEvents$,
      url: '/children/42/dashboard',
    };
    localStorageStore = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageStore[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageStore[key];
      }),
    });

    TestBed.configureTestingModule({
      providers: [
        LastChildService,
        { provide: Router, useValue: mockRouter },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  describe('browser platform', () => {
    it('should be created', () => {
      const service = TestBed.inject(LastChildService);
      expect(service).toBeTruthy();
    });

    it('should return null when no last child stored', () => {
      const service = TestBed.inject(LastChildService);
      expect(service.getLastChildId()).toBeNull();
    });

    it('should read initial value from localStorage', () => {
      localStorageStore['last-child-id'] = '99';
      const service = TestBed.inject(LastChildService);
      expect(service.getLastChildId()).toBe(99);
    });

    it('should ignore invalid localStorage value', () => {
      localStorageStore['last-child-id'] = 'not-a-number';
      const service = TestBed.inject(LastChildService);
      expect(service.getLastChildId()).toBeNull();
    });

    it('setLastChildId should update signal and localStorage', () => {
      const service = TestBed.inject(LastChildService);
      service.setLastChildId(5);
      expect(service.getLastChildId()).toBe(5);
      expect(localStorageStore['last-child-id']).toBe('5');
    });

    it('clear should reset signal and remove from localStorage', () => {
      const service = TestBed.inject(LastChildService);
      service.setLastChildId(3);
      service.clear();
      expect(service.getLastChildId()).toBeNull();
      expect(localStorageStore['last-child-id']).toBeUndefined();
    });

    it('should update last child on NavigationEnd when URL has child id', () => {
      const service = TestBed.inject(LastChildService);
      expect(service.getLastChildId()).toBeNull();

      routerEvents$.next(new NavigationEnd(1, mockRouter.url, mockRouter.url));
      expect(service.getLastChildId()).toBe(42);
    });

    it('should not update on NavigationEnd when URL has no child segment', () => {
      mockRouter.url = '/children';
      const service = TestBed.inject(LastChildService);
      service.setLastChildId(10);

      routerEvents$.next(new NavigationEnd(1, '/children', '/children'));
      expect(service.getLastChildId()).toBe(10);
    });

    it('should handle localStorage setItem failure', () => {
      const setItem = vi.mocked(localStorage.setItem);
      setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceeded');
      });
      const service = TestBed.inject(LastChildService);
      expect(() => service.setLastChildId(1)).not.toThrow();
      expect(service.getLastChildId()).toBe(1);
    });

    it('should handle localStorage removeItem failure in clear()', () => {
      const removeItem = vi.mocked(localStorage.removeItem);
      removeItem.mockImplementationOnce(() => {
        throw new Error('SecurityError');
      });
      const service = TestBed.inject(LastChildService);
      service.setLastChildId(1);
      expect(() => service.clear()).not.toThrow();
      expect(service.getLastChildId()).toBeNull();
    });
  });

  describe('server platform', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LastChildService,
          { provide: Router, useValue: mockRouter },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
    });

    it('should not read from localStorage on server', () => {
      localStorageStore['last-child-id'] = '77';
      const service = TestBed.inject(LastChildService);
      expect(service.getLastChildId()).toBeNull();
    });

    it('setLastChildId and getLastChildId still work in memory on server', () => {
      const service = TestBed.inject(LastChildService);
      service.setLastChildId(12);
      expect(service.getLastChildId()).toBe(12);
    });
  });
});
