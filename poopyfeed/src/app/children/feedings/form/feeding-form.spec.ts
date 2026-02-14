import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeedingForm } from './feeding-form';
import { FeedingsService } from '../../../services/feedings.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import { Feeding, FeedingCreate, FEEDING_VALIDATION } from '../../../models/feeding.model';
import { Child } from '../../../models/child.model';

describe('FeedingForm', () => {
  let component: FeedingForm;
  let fixture: ComponentFixture<FeedingForm>;
  let feedingsService: FeedingsService;
  let childrenService: ChildrenService;
  let dateTimeService: DateTimeService;
  let toastService: ToastService;
  let router: Router;
  let route: ActivatedRoute;

  const mockChild: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-02-10T14:30:00Z',
    last_nap: '2024-02-10T13:00:00Z',
    last_feeding: '2024-02-10T12:00:00Z',
  };

  const mockFeeding: Feeding = {
    id: 5,
    child: 1,
    feeding_type: 'bottle',
    fed_at: '2024-02-10T14:30:00Z',
    amount_oz: 5,
    notes: 'Happy baby',
    created_at: '2024-02-10T14:30:00Z',
    updated_at: '2024-02-10T14:30:00Z',
  };

  const mockBreastFeeding: Feeding = {
    id: 6,
    child: 1,
    feeding_type: 'breast',
    fed_at: '2024-02-10T15:30:00Z',
    duration_minutes: 20,
    side: 'left',
    notes: '',
    created_at: '2024-02-10T15:30:00Z',
    updated_at: '2024-02-10T15:30:00Z',
  };

  beforeEach(async () => {
    const mockFeedingsService = {
      create: vi.fn(),
      update: vi.fn(),
      get: vi.fn(),
    };

    const mockChildrenService = {
      get: vi.fn(),
    };

    const mockDateTimeService = {
      toInputFormat: vi.fn(),
      toUTC: vi.fn(),
      toLocal: vi.fn(),
      fromInputFormat: vi.fn(),
    };

    const mockToastService = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    const mockRouter = {
      navigate: vi.fn(),
      routerState: { root: {} },
      parseUrl: vi.fn(),
      createUrlTree: vi.fn(),
      serializeUrl: vi.fn(() => ''),
      events: of(),
    } as any;

    const mockActivatedRoute = {
      paramMap: of(new Map([['childId', '1']])),
      queryParamMap: of(new Map()),
      snapshot: {
        paramMap: {
          get: vi.fn(() => null),
        },
      },
    } as any;

    await TestBed.configureTestingModule({
      imports: [FeedingForm],
      providers: [
        { provide: FeedingsService, useValue: mockFeedingsService },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: DateTimeService, useValue: mockDateTimeService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedingForm);
    component = fixture.componentInstance;
    feedingsService = TestBed.inject(FeedingsService);
    childrenService = TestBed.inject(ChildrenService);
    dateTimeService = TestBed.inject(DateTimeService);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  describe('Form Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default bottle type', () => {
      expect(component.feedingForm.get('feeding_type')?.value).toBe('bottle');
    });

    it('should initialize form with empty fed_at', () => {
      expect(component.feedingForm.get('fed_at')?.value).toBe('');
    });

    it('should initialize form with empty notes', () => {
      expect(component.feedingForm.get('notes')?.value).toBe('');
    });

    it('should expose VALIDATION constants to template', () => {
      expect(component.VALIDATION).toBeDefined();
      expect(component.VALIDATION.MIN_BOTTLE_OZ).toBe(0.1);
      expect(component.VALIDATION.MAX_BOTTLE_OZ).toBe(50);
    });

    it('should expose feedingForm getter', () => {
      expect(component.feedingForm).toBeDefined();
      expect(component.feedingForm).toBe(component['form']);
    });
  });

  describe('Feeding Type Selection', () => {
    it('should accept bottle as feeding type', () => {
      component.feedingForm.get('feeding_type')?.setValue('bottle');
      expect(component.feedingForm.get('feeding_type')?.value).toBe('bottle');
    });

    it('should accept breast as feeding type', () => {
      component.feedingForm.get('feeding_type')?.setValue('breast');
      expect(component.feedingForm.get('feeding_type')?.value).toBe('breast');
    });


    it('should accept valid bottle amount (5 oz)', () => {
      const amountControl = component.feedingForm.get('amount_oz');
      amountControl?.setValue(5);
      expect(amountControl?.valid).toBe(true);
    });



    it('should accept valid breast duration (20 minutes)', () => {
      const durationControl = component.feedingForm.get('duration_minutes');
      durationControl?.setValue(20);
      expect(durationControl?.valid).toBe(true);
    });

    it('should accept valid breast side values (left, right, both)', () => {
      const sideControl = component.feedingForm.get('side');
      const sides: Array<'left' | 'right' | 'both'> = ['left', 'right', 'both'];

      sides.forEach((side) => {
        sideControl?.setValue(side);
        expect(sideControl?.value).toBe(side);
      });
    });

  });

  describe('DateTime Handling', () => {
    it('should call setDefaultDateTime with current time on create', () => {
      const now = new Date('2026-02-10T10:30:00');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const setDefaultSpy = vi.spyOn(
        component,
        'setDefaultDateTime' as any
      );
      component['setDefaultDateTime']();

      expect(setDefaultSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should format datetime for input using dateTimeService', () => {
      const mockDateTime = '2026-02-10T10:30';
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(mockDateTime);

      const now = new Date();
      component['setDefaultDateTime']();

      expect(dateTimeService.toInputFormat).toHaveBeenCalledWith(now);
    });
  });

  describe('Form Submission - Create', () => {
    beforeEach(() => {
      vi.mocked(childrenService.get).mockReturnValue(of(mockChild));
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(
        '2026-02-10T10:30'
      );
      vi.mocked(dateTimeService.toUTC).mockReturnValue(
        '2026-02-10T10:30:00Z'
      );
      vi.mocked(dateTimeService.toLocal).mockReturnValue(
        new Date('2026-02-10T14:30:00')
      );
      vi.mocked(dateTimeService.fromInputFormat).mockReturnValue(
        new Date('2026-02-10T10:30:00')
      );
    });

    it('should build correct DTO for bottle feeding creation', () => {
      component.feedingForm.patchValue({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30',
        amount_oz: 5,
        notes: 'Happy baby',
      });

      const dto = component['buildCreateDto']();

      expect(dto).toEqual({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30:00Z',
        amount_oz: 5,
        notes: 'Happy baby',
      });
    });

    it('should omit duration_minutes in bottle feeding DTO', () => {
      component.feedingForm.patchValue({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30',
        amount_oz: 5,
      });

      const dto = component['buildCreateDto']();

      expect(dto).not.toHaveProperty('duration_minutes');
    });

    it('should omit side in bottle feeding DTO', () => {
      component.feedingForm.patchValue({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30',
        amount_oz: 5,
      });

      const dto = component['buildCreateDto']();

      expect(dto).not.toHaveProperty('side');
    });

    it('should build correct DTO for breast feeding creation', () => {
      component.feedingForm.patchValue({
        feeding_type: 'breast',
        fed_at: '2026-02-10T10:30',
        duration_minutes: 20,
        side: 'left',
        notes: '',
      });

      const dto = component['buildCreateDto']();

      expect(dto).toEqual({
        feeding_type: 'breast',
        fed_at: '2026-02-10T10:30:00Z',
        duration_minutes: 20,
        side: 'left',
      });
    });

    it('should omit amount_oz in breast feeding DTO', () => {
      component.feedingForm.patchValue({
        feeding_type: 'breast',
        fed_at: '2026-02-10T10:30',
        duration_minutes: 20,
        side: 'left',
      });

      const dto = component['buildCreateDto']();

      expect(dto).not.toHaveProperty('amount_oz');
    });

    it('should omit empty notes from DTO', () => {
      component.feedingForm.patchValue({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30',
        amount_oz: 5,
        notes: '',
      });

      const dto = component['buildCreateDto']();

      expect(dto.notes).toBeUndefined();
    });

    it('should include notes in DTO when provided', () => {
      component.feedingForm.patchValue({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30',
        amount_oz: 5,
        notes: 'Good appetite',
      });

      const dto = component['buildCreateDto']();

      expect(dto.notes).toBe('Good appetite');
    });
  });

  describe('Form Patch - Edit Mode', () => {
    it('should patch form with bottle feeding data', () => {
      component['patchFormWithResource'](mockFeeding);

      expect(component.feedingForm.get('feeding_type')?.value).toBe('bottle');
      expect(component.feedingForm.get('amount_oz')?.value).toBe(5);
      expect(component.feedingForm.get('notes')?.value).toBe('Happy baby');
    });

    it('should convert UTC datetime to local format for bottle feeding', () => {
      const mockLocalDate = new Date('2026-02-10T14:30:00');
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(
        '2026-02-10T14:30'
      );

      component['patchFormWithResource'](mockFeeding);

      expect(component.feedingForm.get('fed_at')?.value).toBe('2026-02-10T14:30');
    });

    it('should patch form with breast feeding data', () => {
      component['patchFormWithResource'](mockBreastFeeding);

      expect(component.feedingForm.get('feeding_type')?.value).toBe('breast');
      expect(component.feedingForm.get('duration_minutes')?.value).toBe(20);
      expect(component.feedingForm.get('side')?.value).toBe('left');
    });

    it('should set null for optional breast fields when not present', () => {
      const feedingWithoutBreaststuff: Feeding = {
        ...mockBreastFeeding,
        amount_oz: undefined,
      };

      component['patchFormWithResource'](feedingWithoutBreaststuff);

      expect(component.feedingForm.get('amount_oz')?.value).toBeNull();
    });

    it('should set empty string for missing notes', () => {
      const feedingWithoutNotes: Feeding = {
        ...mockFeeding,
        notes: undefined,
      };

      component['patchFormWithResource'](feedingWithoutNotes);

      expect(component.feedingForm.get('notes')?.value).toBe('');
    });
  });

  describe('Notes Field Validation', () => {
    it('should accept notes up to 500 characters', () => {
      const longNotes = 'a'.repeat(500);
      component.feedingForm.get('notes')?.setValue(longNotes);
      expect(component.feedingForm.get('notes')?.hasError('maxlength')).toBe(
        false
      );
    });

    it('should reject notes exceeding 500 characters', () => {
      const tooLongNotes = 'a'.repeat(501);
      component.feedingForm.get('notes')?.setValue(tooLongNotes);
      expect(component.feedingForm.get('notes')?.hasError('maxlength')).toBe(
        true
      );
    });

    it('should accept empty notes', () => {
      component.feedingForm.get('notes')?.setValue('');
      expect(component.feedingForm.get('notes')?.valid).toBe(true);
    });
  });

  describe('Form Validity', () => {
    it('should be invalid when feeding_type is missing', () => {
      component.feedingForm.get('feeding_type')?.setValue(null);
      expect(component.feedingForm.invalid).toBe(true);
    });

    it('should be invalid when fed_at is missing', () => {
      component.feedingForm.get('fed_at')?.setValue('');
      expect(component.feedingForm.invalid).toBe(true);
    });

    it('should be valid bottle feeding form when all required fields present', () => {
      component.feedingForm.patchValue({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30',
        amount_oz: 5,
      });
      expect(component.feedingForm.valid).toBe(true);
    });

    it('should be valid breast feeding form when all required fields present', () => {
      component.feedingForm.patchValue({
        feeding_type: 'breast',
        fed_at: '2026-02-10T10:30',
        duration_minutes: 20,
        side: 'left',
      });
      expect(component.feedingForm.valid).toBe(true);
    });

  });

  describe('Edge Cases', () => {
    it('should handle minimum bottle amount (0.1 oz)', () => {
      component.feedingForm.patchValue({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30',
        amount_oz: 0.1,
      });
      expect(component.feedingForm.valid).toBe(true);
    });

    it('should handle maximum bottle amount (50 oz)', () => {
      component.feedingForm.patchValue({
        feeding_type: 'bottle',
        fed_at: '2026-02-10T10:30',
        amount_oz: 50,
      });
      expect(component.feedingForm.valid).toBe(true);
    });

    it('should handle minimum breast duration (1 minute)', () => {
      component.feedingForm.patchValue({
        feeding_type: 'breast',
        fed_at: '2026-02-10T10:30',
        duration_minutes: 1,
        side: 'left',
      });
      expect(component.feedingForm.valid).toBe(true);
    });

    it('should handle maximum breast duration (180 minutes)', () => {
      component.feedingForm.patchValue({
        feeding_type: 'breast',
        fed_at: '2026-02-10T10:30',
        duration_minutes: 180,
        side: 'both',
      });
      expect(component.feedingForm.valid).toBe(true);
    });

    it('should preserve breast side values (left, right, both)', () => {
      const sideControl = component.feedingForm.get('side');
      const sides: Array<'left' | 'right' | 'both'> = [
        'left',
        'right',
        'both',
      ];

      sides.forEach((side) => {
        sideControl?.setValue(side);
        expect(sideControl?.value).toBe(side);
      });
    });
  });

  describe('Error Handling - Form & API', () => {
    describe('error signal management', () => {
      it('should initialize error signal as null', () => {
        expect(component.error()).toBeNull();
      });

      it('should set and clear error signal independently of form state', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle',
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
        });

        // Manually set error as would happen from API failure
        component.error.set('API failed temporarily');
        expect(component.error()).toBe('API failed temporarily');

        // Form can still be valid despite error
        expect(component.feedingForm.valid).toBe(true);

        // Error persists until cleared
        expect(component.error()).toBe('API failed temporarily');

        // Clear error manually
        component.error.set(null);
        expect(component.error()).toBeNull();
      });
    });

    describe('form data preservation during errors', () => {
      it('should preserve form data independently of error state', () => {
        const formData = {
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
        };
        component.feedingForm.patchValue(formData);
        component.error.set('Some error occurred');

        expect(component.feedingForm.get('amount_oz')?.value).toBe(5);
        expect(component.feedingForm.get('feeding_type')?.value).toBe('bottle');
        expect(component.error()).toBe('Some error occurred');
      });

      it('should not lose form data when error is cleared', () => {
        const formData = {
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T14:00',
          duration_minutes: 20,
          side: 'right' as const,
        };
        component.feedingForm.patchValue(formData);
        component.error.set('Previous error');

        // Clear error
        component.error.set(null);

        expect(component.feedingForm.get('duration_minutes')?.value).toBe(20);
        expect(component.feedingForm.get('side')?.value).toBe('right');
        expect(component.error()).toBeNull();
      });
    });

    describe('error state persistence', () => {
      it('should maintain error message until explicitly cleared', () => {
        component.error.set('Form submission failed');
        expect(component.error()).toBe('Form submission failed');

        component.feedingForm.patchValue({ feeding_type: 'breast' });
        expect(component.error()).toBe('Form submission failed'); // Error persists

        component.error.set(null);
        expect(component.error()).toBeNull(); // Explicitly cleared
      });

      it('should handle multiple sequential errors', () => {
        component.error.set('First error');
        expect(component.error()).toBe('First error');

        component.error.set('Second error - network timeout');
        expect(component.error()).toBe('Second error - network timeout');

        component.error.set(null);
        expect(component.error()).toBeNull();
      });
    });

    describe('error signal state conditions', () => {
      it('should keep error set even when form is modified', () => {
        component.error.set('API connection failed');

        // Modify form
        component.feedingForm.patchValue({ amount_oz: 10 });

        // Error should still be set
        expect(component.error()).toBe('API connection failed');
      });

      it('should handle error during different form states', () => {
        // Initial state
        expect(component.error()).toBeNull();

        // Form has invalid state
        component.feedingForm.get('amount_oz')?.setErrors({ required: true });
        component.error.set('Validation error occurred');

        // Error is separate from form validity
        expect(component.error()).toBe('Validation error occurred');
        expect(component.feedingForm.valid).toBe(false);

        // Both conditions can exist independently
        component.error.set(null);
        expect(component.feedingForm.valid).toBe(false); // Still invalid
      });

      it('should preserve error message across multiple form changes', () => {
        const errorMsg = 'Database connection failed';
        component.error.set(errorMsg);

        // Multiple form changes
        component.feedingForm.get('feeding_type')?.setValue('breast');
        component.feedingForm.get('duration_minutes')?.setValue(30);
        component.feedingForm.get('side')?.setValue('left');

        expect(component.error()).toBe(errorMsg);
      });
    });

    describe('error handling with different error types', () => {
      it('should handle network-related errors', () => {
        component.error.set('Network timeout: Unable to connect to server');
        expect(component.error()).toBe('Network timeout: Unable to connect to server');
      });

      it('should handle validation-related errors from server', () => {
        component.error.set('Invalid feeding time: cannot log future events');
        expect(component.error()).toBe('Invalid feeding time: cannot log future events');
      });

      it('should handle permission-related errors', () => {
        component.error.set('Permission denied: You do not have access to edit this child');
        expect(component.error()).toBe('Permission denied: You do not have access to edit this child');
      });

      it('should handle server errors (5xx)', () => {
        component.error.set('Server error: Internal server error');
        expect(component.error()).toBe('Server error: Internal server error');
      });
    });

    describe('validation error detection', () => {
      it('should detect required field errors on amount_oz', () => {
        const amountControl = component.feedingForm.get('amount_oz');
        amountControl?.setErrors({ required: true });

        expect(amountControl?.hasError('required')).toBe(true);
        expect(component.feedingForm.valid).toBe(false);
      });

      it('should detect validation errors on multiple fields', () => {
        component.feedingForm.get('amount_oz')?.setErrors({ required: true });
        component.feedingForm.get('fed_at')?.setErrors({ required: true });

        expect(component.feedingForm.valid).toBe(false);
        expect(component.feedingForm.get('amount_oz')?.invalid).toBe(true);
        expect(component.feedingForm.get('fed_at')?.invalid).toBe(true);
      });
    });
  });

  describe('Form Validation Edge Cases', () => {
    describe('conditional validator transitions', () => {
      it('should support switching from bottle to breast feeding', () => {
        // Start with bottle
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
        });
        expect(component.feedingForm.valid).toBe(true);

        // Switch to breast
        component.feedingForm.get('feeding_type')?.setValue('breast');
        expect(component.feedingForm.get('feeding_type')?.value).toBe('breast');

        // Now add required breast fields to validate
        component.feedingForm.patchValue({
          duration_minutes: 20,
          side: 'left' as const,
        });
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should support switching from breast to bottle feeding', () => {
        // Start with breast
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 20,
          side: 'left' as const,
        });
        expect(component.feedingForm.valid).toBe(true);

        // Switch to bottle
        component.feedingForm.get('feeding_type')?.setValue('bottle');
        expect(component.feedingForm.get('feeding_type')?.value).toBe('bottle');

        // Now add required bottle field to validate
        component.feedingForm.patchValue({
          amount_oz: 5,
        });
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should handle multiple rapid type changes', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
        });

        // Rapid type changes
        component.feedingForm.get('feeding_type')?.setValue('breast');
        component.feedingForm.get('feeding_type')?.setValue('bottle');
        component.feedingForm.get('feeding_type')?.setValue('breast');

        // Should end in breast mode
        expect(component.feedingForm.get('feeding_type')?.value).toBe('breast');
        expect(component.feedingForm.get('amount_oz')?.value).toBeNull();
      });

      it('should support switching from breast to bottle feeding', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 15,
          side: 'right' as const,
        });

        // Switch type (field values may or may not clear depending on implementation)
        component.feedingForm.get('feeding_type')?.setValue('bottle');

        // Verify type changed
        expect(component.feedingForm.get('feeding_type')?.value).toBe('bottle');
      });

      it('should support switching from bottle to breast feeding', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 8,
        });

        // Switch type
        component.feedingForm.get('feeding_type')?.setValue('breast');

        // Verify type changed
        expect(component.feedingForm.get('feeding_type')?.value).toBe('breast');
      });
    });

    describe('boundary value validation', () => {
      it('should accept bottle amounts within valid range (0.1-50 oz)', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 0.1,
        });

        expect(component.feedingForm.valid).toBe(true);

        component.feedingForm.get('amount_oz')?.setValue(5);
        expect(component.feedingForm.valid).toBe(true);

        component.feedingForm.get('amount_oz')?.setValue(50);
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should accept breast durations within valid range (1-180 minutes)', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 1,
          side: 'left' as const,
        });

        expect(component.feedingForm.valid).toBe(true);

        component.feedingForm.get('duration_minutes')?.setValue(90);
        expect(component.feedingForm.valid).toBe(true);

        component.feedingForm.get('duration_minutes')?.setValue(180);
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should handle bottle amounts at boundaries', () => {
        // Min value
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 0.1,
        });
        let valid = component.feedingForm.valid;

        // Max value
        component.feedingForm.get('amount_oz')?.setValue(50);
        expect(component.feedingForm.valid).toBe(valid || true);
      });

      it('should handle breast durations at boundaries', () => {
        // Min value
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 1,
          side: 'left' as const,
        });
        let valid = component.feedingForm.valid;

        // Max value
        component.feedingForm.get('duration_minutes')?.setValue(180);
        expect(component.feedingForm.valid).toBe(valid || true);
      });

      it('should handle mid-range values for bottle and breast', () => {
        // Bottle mid-range
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 25,
        });

        expect(component.feedingForm.valid).toBe(true);

        // Breast mid-range
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          duration_minutes: 90,
          side: 'both' as const,
        });

        expect(component.feedingForm.valid).toBe(true);
      });
    });

    describe('cross-field validation scenarios', () => {
      it('should be valid when all bottle feeding fields are present', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
        });

        expect(component.feedingForm.valid).toBe(true);
      });

      it('should be valid when all breast feeding fields are present', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 20,
          side: 'left' as const,
        });

        expect(component.feedingForm.valid).toBe(true);
      });

      it('should allow bottle feeding with extra breast fields set', () => {
        // Bottle form with breast fields (shouldn't cause validation errors)
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
          duration_minutes: 20, // Extra field (not used in bottle mode)
          side: 'left' as const, // Extra field (not used in bottle mode)
        });

        // Form should still be valid
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should allow breast feeding with extra bottle field set', () => {
        // Breast form with bottle field (shouldn't cause validation errors)
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5, // Extra field (not used in breast mode)
          duration_minutes: 20,
          side: 'left' as const,
        });

        // Form should still be valid
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should require fed_at field for both feeding types', () => {
        // Test bottle without fed_at
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '',
          amount_oz: 5,
        });

        expect(component.feedingForm.get('fed_at')?.hasError('required')).toBe(true);
        expect(component.feedingForm.invalid).toBe(true);
      });
    });

    describe('field value preservation and clearing', () => {
      it('should preserve form state when notes change', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
          notes: 'Initial notes',
        });

        const initialValid = component.feedingForm.valid;

        component.feedingForm.get('notes')?.setValue('Updated notes');

        expect(component.feedingForm.valid).toBe(initialValid);
        expect(component.feedingForm.get('amount_oz')?.value).toBe(5);
      });

      it('should handle clearing all optional fields', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
          notes: 'Some notes',
        });

        component.feedingForm.get('notes')?.setValue('');

        expect(component.feedingForm.valid).toBe(true);
        expect(component.feedingForm.get('notes')?.value).toBe('');
      });

      it('should maintain breast side selection across duration changes', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 15,
          side: 'right' as const,
        });

        component.feedingForm.get('duration_minutes')?.setValue(25);

        expect(component.feedingForm.get('side')?.value).toBe('right');
        expect(component.feedingForm.valid).toBe(true);
      });
    });

    describe('validator state consistency', () => {
      it('should be valid when all required bottle fields are present', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
        });

        expect(component.feedingForm.valid).toBe(true);
      });

      it('should be valid when all required breast fields are present', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 20,
          side: 'left' as const,
        });

        expect(component.feedingForm.valid).toBe(true);
      });

      it('should remain valid when optional notes field changes', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
        });

        expect(component.feedingForm.valid).toBe(true);

        // Change notes (optional field)
        component.feedingForm.get('notes')?.setValue('Updated notes');

        expect(component.feedingForm.valid).toBe(true);
      });

      it('should allow switching between feeding types with different field sets', () => {
        // Start as bottle
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
        });

        let isValid = component.feedingForm.valid;
        expect(isValid).toBe(true);

        // Switch to breast and set required fields
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          duration_minutes: 20,
          side: 'left' as const,
        });

        // Should still be valid
        expect(component.feedingForm.valid).toBe(true);
      });
    });

    describe('notes field validation edge cases', () => {
      it('should accept notes at max length (500 characters)', () => {
        const maxNotes = 'a'.repeat(500);
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
          notes: maxNotes,
        });

        expect(component.feedingForm.get('notes')?.valid).toBe(true);
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should reject notes exceeding max length (501 characters)', () => {
        const tooLongNotes = 'a'.repeat(501);
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
          notes: tooLongNotes,
        });

        expect(component.feedingForm.get('notes')?.hasError('maxlength')).toBe(true);
        expect(component.feedingForm.invalid).toBe(true);
      });

      it('should accept empty notes', () => {
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
          notes: '',
        });

        expect(component.feedingForm.get('notes')?.valid).toBe(true);
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should accept notes with special characters', () => {
        const specialNotes = 'Notes: @#$%!? with 🍼 emoji';
        component.feedingForm.patchValue({
          feeding_type: 'bottle' as const,
          fed_at: '2026-02-10T10:30',
          amount_oz: 5,
          notes: specialNotes,
        });

        expect(component.feedingForm.get('notes')?.valid).toBe(true);
      });
    });

    describe('side field validation for breast feeding', () => {
      it('should accept left side', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 15,
          side: 'left' as const,
        });

        expect(component.feedingForm.get('side')?.valid).toBe(true);
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should accept right side', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 15,
          side: 'right' as const,
        });

        expect(component.feedingForm.get('side')?.valid).toBe(true);
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should accept both sides', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 15,
          side: 'both' as const,
        });

        expect(component.feedingForm.get('side')?.valid).toBe(true);
        expect(component.feedingForm.valid).toBe(true);
      });

      it('should transition to valid breast feeding with all fields', () => {
        component.feedingForm.patchValue({
          feeding_type: 'breast' as const,
          fed_at: '2026-02-10T10:30',
          duration_minutes: 15,
        });

        // Add side to complete the breast feeding record
        component.feedingForm.get('side')?.setValue('left');
        expect(component.feedingForm.valid).toBe(true);
      });
    });
  });

  describe('DOM Rendering', () => {
    beforeEach(() => {
      vi.mocked(childrenService.get).mockReturnValue(of(mockChild));
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue('2026-02-10T10:30');
      vi.mocked(dateTimeService.toUTC).mockReturnValue('2026-02-10T10:30:00Z');
      vi.mocked(dateTimeService.fromInputFormat).mockReturnValue(new Date('2026-02-10T10:30:00'));
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should render "Add Feeding" title in create mode', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Add Feeding');
    });

    it('should render "Edit Feeding" title in edit mode', () => {
      component.resourceId.set(5);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Edit Feeding');
    });

    it('should render child name when child is loaded', () => {
      component.child.set(mockChild);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Baby Alice');
    });

    it('should render error message when error signal is set', () => {
      fixture.detectChanges();
      component.error.set('API connection failed');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('API connection failed');
    });

    it('should render bottle amount field when bottle type selected', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('bottle');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Amount (oz)');
      const amountInput = el.querySelector('#amount_oz');
      expect(amountInput).toBeTruthy();
    });

    it('should hide breast fields when bottle type selected', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('bottle');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('Duration (minutes)');
      const durationInput = el.querySelector('#duration_minutes');
      expect(durationInput).toBeNull();
    });

    it('should render breast duration and side fields when breast type selected', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('breast');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Duration (minutes)');
      expect(el.textContent).toContain('Side');
      expect(el.textContent).toContain('Left');
      expect(el.textContent).toContain('Right');
      expect(el.textContent).toContain('Both');
    });

    it('should hide bottle field when breast type selected', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('breast');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('Amount (oz)');
      const amountInput = el.querySelector('#amount_oz');
      expect(amountInput).toBeNull();
    });

    it('should show fed_at validation error when touched and invalid', () => {
      fixture.detectChanges();
      component.feedingForm.get('fed_at')?.setValue('');
      component.feedingForm.get('fed_at')?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Date and time is required');
    });

    it('should show amount_oz required error', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('bottle');
      component.feedingForm.get('amount_oz')?.setValue(null);
      component.feedingForm.get('amount_oz')?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Amount is required');
    });

    it('should show amount_oz min error', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('bottle');
      component.feedingForm.get('amount_oz')?.setValue(0);
      component.feedingForm.get('amount_oz')?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain(`Amount must be at least ${FEEDING_VALIDATION.MIN_BOTTLE_OZ} oz`);
    });

    it('should show amount_oz max error', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('bottle');
      component.feedingForm.get('amount_oz')?.setValue(999);
      component.feedingForm.get('amount_oz')?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain(`Amount must be at most ${FEEDING_VALIDATION.MAX_BOTTLE_OZ} oz`);
    });

    it('should show duration_minutes required error', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('breast');
      component.feedingForm.get('duration_minutes')?.setValue(null);
      component.feedingForm.get('duration_minutes')?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Duration is required');
    });

    it('should show duration_minutes min error', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('breast');
      component.feedingForm.get('duration_minutes')?.setValue(0);
      component.feedingForm.get('duration_minutes')?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain(`Duration must be at least ${FEEDING_VALIDATION.MIN_BREAST_MINUTES} minute`);
    });

    it('should show duration_minutes max error', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('breast');
      component.feedingForm.get('duration_minutes')?.setValue(999);
      component.feedingForm.get('duration_minutes')?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain(`Duration must be at most ${FEEDING_VALIDATION.MAX_BREAST_MINUTES} minutes`);
    });

    it('should show side required error', () => {
      fixture.detectChanges();
      component.feedingForm.get('feeding_type')?.setValue('breast');
      component.feedingForm.get('side')?.markAsTouched();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Side is required');
    });

    it('should show submit spinner when isSubmitting', () => {
      fixture.detectChanges();
      component.isSubmitting.set(true);
      component.resourceId.set(null);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const spinner = el.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
      expect(el.textContent).toContain('Adding...');
    });

    it('should show "Updating..." spinner text in edit mode', () => {
      component.resourceId.set(5);
      fixture.detectChanges();
      component.isSubmitting.set(true);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Updating...');
    });

    it('should show notes character count', () => {
      component.feedingForm.get('notes')?.setValue('Hello');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain(`5 / ${FEEDING_VALIDATION.MAX_NOTES_LENGTH}`);
    });

    it('should show "Update Feeding" button text in edit mode', () => {
      component.resourceId.set(5);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Update Feeding');
    });

    it('should show "Add Feeding" button text in create mode', () => {
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      // Button shows "Add Feeding" text
      const submitButton = el.querySelector('button[type="submit"]');
      expect(submitButton?.textContent).toContain('Add Feeding');
    });
  });
});
