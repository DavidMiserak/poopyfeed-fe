import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ToastService, ToastType } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show()', () => {
    it('should add a toast to the list', () => {
      service.show('Test message', 'info');
      expect(service.toasts$().length).toBe(1);
    });

    it('should return a unique ID', () => {
      const id1 = service.show('Message 1', 'info');
      const id2 = service.show('Message 2', 'info');
      expect(id1).not.toBe(id2);
    });

    it('should create toast with correct properties', () => {
      const id = service.show('Test message', 'success', 3000);
      const toast = service.toasts$()[0];

      expect(toast.id).toBe(id);
      expect(toast.message).toBe('Test message');
      expect(toast.type).toBe('success');
      expect(toast.duration).toBe(3000);
    });

    it('should auto-remove toast after duration', async () => {
      vi.useFakeTimers();

      service.show('Test', 'info', 100);
      expect(service.toasts$().length).toBe(1);

      vi.advanceTimersByTime(100);
      expect(service.toasts$().length).toBe(0);

      vi.useRealTimers();
    });

    it('should not auto-remove when duration is not specified', () => {
      vi.useFakeTimers();

      service.show('Test', 'info');
      vi.advanceTimersByTime(10000);

      expect(service.toasts$().length).toBe(1);

      vi.useRealTimers();
    });
  });

  describe('success()', () => {
    it('should create a success toast', () => {
      service.success('Success message');
      const toast = service.toasts$()[0];

      expect(toast.type).toBe('success');
      expect(toast.message).toBe('Success message');
      expect(toast.duration).toBe(4000);
    });

    it('should allow custom duration', () => {
      service.success('Success message', 2000);
      const toast = service.toasts$()[0];
      expect(toast.duration).toBe(2000);
    });
  });

  describe('error()', () => {
    it('should create an error toast', () => {
      service.error('Error message');
      const toast = service.toasts$()[0];

      expect(toast.type).toBe('error');
      expect(toast.message).toBe('Error message');
      expect(toast.duration).toBe(5000);
    });
  });

  describe('warning()', () => {
    it('should create a warning toast', () => {
      service.warning('Warning message');
      const toast = service.toasts$()[0];

      expect(toast.type).toBe('warning');
      expect(toast.message).toBe('Warning message');
      expect(toast.duration).toBe(4000);
    });
  });

  describe('info()', () => {
    it('should create an info toast', () => {
      service.info('Info message');
      const toast = service.toasts$()[0];

      expect(toast.type).toBe('info');
      expect(toast.message).toBe('Info message');
      expect(toast.duration).toBe(3000);
    });
  });

  describe('remove()', () => {
    it('should remove a toast by ID', () => {
      const id = service.show('Test 1', 'info');
      service.show('Test 2', 'info');

      expect(service.toasts$().length).toBe(2);

      service.remove(id);
      expect(service.toasts$().length).toBe(1);
      expect(service.toasts$()[0].message).toBe('Test 2');
    });

    it('should handle removing non-existent ID gracefully', () => {
      service.show('Test', 'info');
      service.remove('non-existent-id');
      expect(service.toasts$().length).toBe(1);
    });
  });

  describe('clear()', () => {
    it('should remove all toasts', () => {
      service.show('Test 1', 'info');
      service.show('Test 2', 'info');
      service.show('Test 3', 'info');

      expect(service.toasts$().length).toBe(3);

      service.clear();
      expect(service.toasts$().length).toBe(0);
    });
  });

  describe('multiple toasts', () => {
    it('should handle multiple toasts of different types', () => {
      service.success('Success');
      service.error('Error');
      service.warning('Warning');
      service.info('Info');

      const toasts = service.toasts$();
      expect(toasts.length).toBe(4);
      expect(toasts[0].type).toBe('success');
      expect(toasts[1].type).toBe('error');
      expect(toasts[2].type).toBe('warning');
      expect(toasts[3].type).toBe('info');
    });
  });
});
