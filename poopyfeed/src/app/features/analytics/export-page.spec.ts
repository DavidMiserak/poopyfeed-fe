/**
 * Export page component tests.
 *
 * Tests navigation, export handling, and job status polling.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ExportPage } from './export-page';
import { AnalyticsService } from '../../services/analytics.service';
import { ToastService } from '../../services/toast.service';

describe('ExportPage', () => {
  let component: ExportPage;
  let fixture: ComponentFixture<ExportPage>;
  let analyticsService: AnalyticsService;
  let toastService: ToastService;
  let router: Router;

  beforeEach(async () => {
    const activatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => (key === 'childId' ? '1' : null),
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ExportPage],
      providers: [
        AnalyticsService,
        ToastService,
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsService);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(ExportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should extract childId from route params', () => {
      expect(component.childId()).toBe(1);
    });

    it('should handle missing childId', () => {
      component.childId.set(null);
      vi.spyOn(toastService, 'error');

      component.onExportDialogSubmit({ format: 'csv', days: 30 });

      expect(toastService.error).toHaveBeenCalledWith('Child ID is missing');
    });

    it('should navigate on cancel when childId is valid', () => {
      vi.spyOn(router, 'navigate');
      component.childId.set(1);

      component.onExportDialogCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/children/1/analytics']);
    });
  });

  describe('CSV Export', () => {
    it('should handle CSV export submission', async () => {
      const mockBlob = new Blob(['csv data']);
      vi.spyOn(analyticsService, 'exportCSV').mockReturnValue(of(mockBlob));
      vi.spyOn(toastService, 'success');
      vi.spyOn(router, 'navigate');

      component.onExportDialogSubmit({ format: 'csv', days: 30 });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(analyticsService.exportCSV).toHaveBeenCalledWith(1, 30);
      expect(toastService.success).toHaveBeenCalledWith('CSV downloaded successfully');
      expect(router.navigate).toHaveBeenCalledWith(['/children/1/analytics']);
    });

    it('should handle CSV export error', async () => {
      const testError = new Error('CSV export failed');
      vi.spyOn(analyticsService, 'exportCSV').mockReturnValue(throwError(() => testError));
      vi.spyOn(toastService, 'error');

      component.onExportDialogSubmit({ format: 'csv', days: 30 });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(toastService.error).toHaveBeenCalledWith('CSV export failed');
    });
  });

  describe('PDF Export', () => {
    it('should handle PDF export submission and show polling', async () => {
      const mockJobResponse = {
        task_id: 'test-task-123',
        status: 'pending' as const,
        created_at: '2024-01-30T12:00:00Z',
        expires_at: '2024-01-31T12:00:00Z',
      };

      vi.spyOn(analyticsService, 'exportPDFAsync').mockReturnValue(of(mockJobResponse));

      component.onExportDialogSubmit({ format: 'pdf', days: 30 });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(analyticsService.exportPDFAsync).toHaveBeenCalledWith(1, 30);
      expect(component.jobTaskId()).toBe('test-task-123');
      expect(component.showJobStatus()).toBe(true);
    });

    it('should handle PDF export error', async () => {
      const testError = new Error('PDF export failed');
      vi.spyOn(analyticsService, 'exportPDFAsync').mockReturnValue(throwError(() => testError));
      vi.spyOn(toastService, 'error');

      component.onExportDialogSubmit({ format: 'pdf', days: 30 });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(toastService.error).toHaveBeenCalledWith('PDF export failed');
    });
  });

  describe('Navigation', () => {
    it('should handle export dialog cancel', () => {
      vi.spyOn(router, 'navigate');

      component.onExportDialogCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/children/1/analytics']);
    });

    it('should handle job status dismiss', () => {
      vi.spyOn(router, 'navigate');

      component.onJobStatusDismiss();

      expect(router.navigate).toHaveBeenCalledWith(['/children/1/analytics']);
    });

    it('should navigate to children list if childId is missing on dismiss', () => {
      vi.spyOn(router, 'navigate');
      component.childId.set(null);

      component.onJobStatusDismiss();

      expect(router.navigate).toHaveBeenCalledWith(['/children']);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing childId in export submission', () => {
      vi.spyOn(toastService, 'error');
      component.childId.set(null);

      component.onExportDialogSubmit({ format: 'csv', days: 30 });

      expect(toastService.error).toHaveBeenCalledWith('Child ID is missing');
    });
  });
});
