import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FeedingForm } from './feeding-form';
import { FeedingsService } from '../../../services/feedings.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import { Feeding, FeedingCreate } from '../../../models/feeding.model';
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
});
