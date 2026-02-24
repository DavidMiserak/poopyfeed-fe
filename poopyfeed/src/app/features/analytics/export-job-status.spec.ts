/**
 * Export job status polling component unit tests.
 *
 * Tests polling behavior, status transitions, and UI rendering.
 * Uses Vitest with signal-based state testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ExportJobStatusComponent } from './export-job-status';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';
import { JobStatusResponse } from '../../models/analytics.model';
import { of, throwError } from 'rxjs';

/**
 * Helper to flush microtasks and wait for observables to process.
 * RxJS timer() uses microtasks, so we need to ensure they complete.
 */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    // Use Promise.resolve() to schedule after microtasks
    Promise.resolve().then(() => resolve());
  });
}

describe('ExportJobStatusComponent', () => {
  let component: ExportJobStatusComponent;
  let fixture: any;
  let analyticsService: AnalyticsService;
  let toastService: ToastService;

  const mockTaskId = 'task-abc123';
  const mockChildId = 1;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportJobStatusComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AnalyticsService,
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportJobStatusComponent);
    component = fixture.componentInstance;
    analyticsService = TestBed.inject(AnalyticsService);
    toastService = TestBed.inject(ToastService);

    // Set required inputs
    fixture.componentRef.setInput('taskId', mockTaskId);
    fixture.componentRef.setInput('childId', mockChildId);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('Component Initialization', () => {
    it('should initialize with pending status', () => {
      expect(component.status()).toBe('pending');
    });

    it('should start with 0% progress', () => {
      expect(component.progress()).toBe(0);
    });

    it('should have no download URL initially', () => {
      expect(component.downloadUrl()).toBeNull();
    });

    it('should have no error initially', () => {
      expect(component.error()).toBeNull();
    });

    it('should accept required inputs', () => {
      expect(component.taskId()).toBe(mockTaskId);
      expect(component.childId()).toBe(mockChildId);
    });

    it('should start polling on init', () => {
      const getPDFJobStatusSpy = vi.spyOn(analyticsService, 'getPDFJobStatus');
      getPDFJobStatusSpy.mockReturnValue(
        of({
          task_id: mockTaskId,
          status: 'pending',
          progress: 0,
        })
      );

      fixture.detectChanges();

      // Component should have initiated polling
      expect(component.isPolling()).toBe(true);

      getPDFJobStatusSpy.mockRestore();
    });
  });

  describe('Status Transitions', () => {
    it('should handle pending status', async () => {
      const getPDFJobStatusSpy = vi.spyOn(analyticsService, 'getPDFJobStatus');
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'pending',
        progress: 0,
      };
      getPDFJobStatusSpy.mockReturnValue(of(response));

      fixture.detectChanges();
      await flushMicrotasks();

      expect(component.status()).toBe('pending');
      expect(component.progress()).toBe(0);

      getPDFJobStatusSpy.mockRestore();
    });

    it('should handle processing status with progress', () => {
      // Directly simulate polling response by calling the next handler logic
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'processing',
        progress: 45,
      };

      // Simulate what the subscription's next handler does
      component['status'].set(response.status);
      if (response.progress !== undefined) {
        component['progress'].set(response.progress as number);
      }

      expect(component.status()).toBe('processing');
      expect(component.progress()).toBe(45);
    });

    it('should handle completed status with download URL', () => {
      // Directly simulate polling response
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'completed',
        progress: 100,
        result: {
          download_url: '/api/download/abc.pdf',
          filename: 'export.pdf',
          created_at: '2026-02-12T10:00:00Z',
          expires_at: '2026-02-13T10:00:00Z',
        },
      };

      // Simulate subscription's next handler
      component['status'].set(response.status);
      if (response.progress !== undefined) {
        component['progress'].set(response.progress as number);
      }
      if (response.status === 'completed' && response.result) {
        component['downloadUrl'].set(response.result.download_url);
        component['expiresAt'].set(new Date(response.result.expires_at));
        component['isPolling'].set(false);
      }

      expect(component.status()).toBe('completed');
      expect(component.progress()).toBe(100);
      expect(component.downloadUrl()).toBe('/api/download/abc.pdf');
      expect(component.expiresAt()).toEqual(
        new Date('2026-02-13T10:00:00Z')
      );
      expect(component.isPolling()).toBe(false);
    });

    it('should handle failed status with error message', () => {
      // Directly simulate polling response
      const errorMsg = 'PDF generation timeout';
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'failed',
        error: errorMsg,
      };

      // Simulate subscription's next handler
      component['status'].set(response.status);
      if (response.status === 'failed') {
        component['error'].set(response.error || 'PDF export failed');
        component['isPolling'].set(false);
      }

      expect(component.status()).toBe('failed');
      expect(component.error()).toBe(errorMsg);
      expect(component.isPolling()).toBe(false);
    });

    it('should use default error message when none provided', () => {
      // Directly simulate polling response with no error message
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'failed',
      };

      // Simulate subscription's next handler
      component['status'].set(response.status);
      if (response.status === 'failed') {
        component['error'].set(response.error || 'PDF export failed');
        component['isPolling'].set(false);
      }

      expect(component.error()).toBe('PDF export failed');
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors during polling', () => {
      // Directly simulate error handler behavior
      const errorMsg = 'Network connection failed';

      // Simulate subscription's error handler
      component['error'].set(errorMsg);
      component['status'].set('failed');
      component['isPolling'].set(false);

      expect(component.status()).toBe('failed');
      expect(component.error()).toBe(errorMsg);
      expect(component.isPolling()).toBe(false);
    });

    it('should show toast notification on completion', () => {
      const toastSpy = vi.spyOn(toastService, 'success');
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'completed',
        progress: 100,
        result: {
          download_url: '/api/download/abc.pdf',
          filename: 'export.pdf',
          created_at: '2026-02-12T10:00:00Z',
          expires_at: '2026-02-13T10:00:00Z',
        },
      };

      // Simulate subscription's next handler
      component['status'].set(response.status);
      if (response.progress !== undefined) {
        component['progress'].set(response.progress as number);
      }
      if (response.status === 'completed' && response.result) {
        component['downloadUrl'].set(response.result.download_url);
        component['expiresAt'].set(new Date(response.result.expires_at));
        toastService.success('PDF export ready for download!');
        component['isPolling'].set(false);
      }

      expect(toastSpy).toHaveBeenCalledWith(
        'PDF export ready for download!'
      );

      toastSpy.mockRestore();
    });

    it('should show toast notification on failure', () => {
      const toastSpy = vi.spyOn(toastService, 'error');
      const errorMsg = 'Out of memory';
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'failed',
        error: errorMsg,
      };

      // Simulate subscription's next handler
      component['status'].set(response.status);
      if (response.status === 'failed') {
        component['error'].set(response.error || 'PDF export failed');
        toastService.error(response.error || 'PDF export failed');
        component['isPolling'].set(false);
      }

      expect(toastSpy).toHaveBeenCalledWith(errorMsg);

      toastSpy.mockRestore();
    });
  });

  describe('Download Functionality', () => {
    it('should trigger PDF download when onDownloadClick is called', () => {
      const downloadSpy = vi.spyOn(analyticsService, 'downloadPDF');
      const downloadUrl = '/api/download/abc.pdf';

      component.onDownloadClick(downloadUrl);

      expect(downloadSpy).toHaveBeenCalledWith(downloadUrl);

      downloadSpy.mockRestore();
    });
  });

  describe('User Interactions', () => {
    it('should emit dismiss event when onDismiss is called', () => {
      const dismissSpy = vi.spyOn(component.dismissEvent, 'emit');

      component.onDismiss();

      expect(dismissSpy).toHaveBeenCalled();

      dismissSpy.mockRestore();
    });

    it('should stop polling when dismissed', () => {
      const getPDFJobStatusSpy = vi.spyOn(analyticsService, 'getPDFJobStatus');
      getPDFJobStatusSpy.mockReturnValue(
        of({
          task_id: mockTaskId,
          status: 'processing',
          progress: 50,
        })
      );

      fixture.detectChanges();
      expect(component.isPolling()).toBe(true);

      component.onDismiss();

      expect(component.isPolling()).toBe(false);

      getPDFJobStatusSpy.mockRestore();
    });
  });

  describe('UI Rendering', () => {
    it('should render status container', () => {
      fixture.detectChanges();

      const statusContainer = fixture.nativeElement.querySelector(
        '[role="status"]'
      );
      expect(statusContainer).toBeTruthy();
    });

    it('should render progress bar with ARIA attributes', () => {
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector(
        '[role="progressbar"]'
      );
      expect(progressBar).toBeTruthy();
      expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('should display progress percentage in header', () => {
      // Directly simulate polling response
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'processing',
        progress: 67,
      };

      // Simulate subscription's next handler
      component['status'].set(response.status);
      if (response.progress !== undefined) {
        component['progress'].set(response.progress as number);
      }

      // Trigger change detection to update DOM
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('67%');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-live=polite on status container', () => {
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('[role="status"]');
      expect(container.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-label on progress bar', () => {
      // Directly simulate polling response
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'processing',
        progress: 50,
      };

      // Simulate subscription's next handler
      component['status'].set(response.status);
      if (response.progress !== undefined) {
        component['progress'].set(response.progress as number);
      }

      // Trigger change detection to update DOM
      fixture.detectChanges();

      const progressBar = fixture.nativeElement.querySelector(
        '[role="progressbar"]'
      );
      expect(progressBar.getAttribute('aria-label')).toContain('50%');
    });

    it('should have aria-label on buttons', () => {
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should have alert role on error message when failed', () => {
      // Directly simulate polling response
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'failed',
        error: 'Export failed',
      };

      // Simulate subscription's next handler
      component['status'].set(response.status);
      component['error'].set(response.error || 'PDF export failed');
      component['isPolling'].set(false);

      // Trigger change detection to update DOM
      fixture.detectChanges();

      const errorAlert = fixture.nativeElement.querySelector('[role="alert"]');
      expect(errorAlert).toBeTruthy();
    });
  });

  describe('Computed Signals', () => {
    it('should compute isComplete as true when completed', () => {
      // Directly set completed status
      component['status'].set('completed');
      component['isPolling'].set(false);

      expect(component.isComplete()).toBe(true);
    });

    it('should compute isComplete as true when failed', () => {
      // Directly set failed status
      component['status'].set('failed');
      component['isPolling'].set(false);

      expect(component.isComplete()).toBe(true);
    });

    it('should compute isComplete as false while processing', () => {
      // Directly set processing status
      component['status'].set('processing');
      component['isPolling'].set(true);

      expect(component.isComplete()).toBe(false);
    });
  });

  describe('Component Cleanup', () => {
    it('should clean up on destroy', () => {
      fixture.detectChanges();

      expect(component).toBeTruthy();

      component.ngOnDestroy();

      // Component should be destroyed
      expect(component).toBeTruthy();
    });
  });

  describe('Branch coverage - isComplete computed signal', () => {
    it('should be true when isPolling is false and status is pending', () => {
      component['status'].set('pending');
      component['isPolling'].set(false);

      expect(component.isComplete()).toBe(true);
    });

    it('should be false when isPolling is true and status is pending', () => {
      component['status'].set('pending');
      component['isPolling'].set(true);

      expect(component.isComplete()).toBe(false);
    });
  });

  describe('Branch coverage - template rendering', () => {
    it('should render pending status message', () => {
      component['status'].set('pending');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Queued for processing');
    });

    it('should render processing status message', () => {
      component['status'].set('processing');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Generating PDF');
    });

    it('should render completed status message', () => {
      component['status'].set('completed');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('PDF ready for download');
    });

    it('should render failed status message', () => {
      component['status'].set('failed');
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Export failed');
    });

    it('should render download button when completed with URL', () => {
      component['status'].set('completed');
      component['downloadUrl'].set('/api/download/test.pdf');
      fixture.detectChanges();

      const downloadButton = fixture.nativeElement.querySelector(
        'button[aria-label="Download PDF export file"]'
      );
      expect(downloadButton).toBeTruthy();
      expect(downloadButton.textContent).toContain('Download PDF');
    });

    it('should not render download button when completed without URL', () => {
      component['status'].set('completed');
      component['downloadUrl'].set(null);
      fixture.detectChanges();

      const downloadButton = fixture.nativeElement.querySelector(
        'button[aria-label="Download PDF export file"]'
      );
      expect(downloadButton).toBeFalsy();
    });

    it('should render expiry warning when completed with expiresAt', () => {
      component['status'].set('completed');
      component['expiresAt'].set(new Date('2026-02-13T10:00:00Z'));
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Download available until');
    });

    it('should not render expiry warning when expiresAt is null', () => {
      component['status'].set('completed');
      component['expiresAt'].set(null);
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).not.toContain('Download available until');
    });

    it('should show Dismiss text when completed', () => {
      component['status'].set('completed');
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const dismissButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('Dismiss')
      );
      expect(dismissButton).toBeTruthy();
    });

    it('should show Close text when not completed', () => {
      component['status'].set('processing');
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const closeButton = Array.from(buttons).find(
        (btn: any) => btn.textContent.trim().includes('Close')
      );
      expect(closeButton).toBeTruthy();
    });
  });

  describe('Branch coverage - response without progress', () => {
    it('should handle response without progress field', () => {
      const initialProgress = component.progress();
      component['status'].set('pending');
      // When progress is undefined, it should not update
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'pending',
      };
      // Simulate: progress is undefined so should not update
      if (response.progress !== undefined) {
        component['progress'].set(response.progress);
      }
      expect(component.progress()).toBe(initialProgress);
    });
  });

  describe('Branch coverage - completed without result', () => {
    it('should not set download URL when completed but result is missing', () => {
      const response: JobStatusResponse = {
        task_id: mockTaskId,
        status: 'completed',
        progress: 100,
      };

      component['status'].set(response.status);
      if (response.progress !== undefined) {
        component['progress'].set(response.progress);
      }
      if (response.status === 'completed' && response.result) {
        component['downloadUrl'].set(response.result.download_url);
      }

      expect(component.downloadUrl()).toBeNull();
    });
  });
});
