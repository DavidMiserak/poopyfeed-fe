import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SwCacheService } from './sw-cache.service';

describe('SwCacheService', () => {
  describe('server platform', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          SwCacheService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
    });

    it('should be created', () => {
      const service = TestBed.inject(SwCacheService);
      expect(service).toBeTruthy();
    });

    it('should no-op when evictReadonlyListCaches is called', () => {
      const service = TestBed.inject(SwCacheService);
      expect(() => service.evictReadonlyListCaches(1)).not.toThrow();
    });
  });

  describe('browser with Cache API', () => {
    beforeEach(() => {
      const mockOpen = vi.fn().mockResolvedValue({
        keys: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(true),
      });
      vi.stubGlobal('caches', {
        keys: vi.fn().mockResolvedValue(['ngsw:data']),
        open: mockOpen,
      });

      TestBed.configureTestingModule({
        providers: [
          SwCacheService,
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
    });

    it('should be created', () => {
      const service = TestBed.inject(SwCacheService);
      expect(service).toBeTruthy();
    });

    it('should call caches when evictReadonlyListCaches is called', () => {
      const keysFn = vi.mocked(globalThis.caches.keys);
      const service = TestBed.inject(SwCacheService);
      service.evictReadonlyListCaches(5);
      expect(keysFn).toHaveBeenCalled();
    });
  });

});
