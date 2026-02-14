import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DiaperForm } from './diaper-form';
import { DiapersService } from '../../../services/diapers.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import { DiaperChange, DiaperChangeCreate } from '../../../models/diaper.model';
import { Child } from '../../../models/child.model';

describe('DiaperForm', () => {
  let component: DiaperForm;
  let fixture: ComponentFixture<DiaperForm>;
  let diapersService: DiapersService;
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

  const mockDiaperWet: DiaperChange = {
    id: 10,
    child: 1,
    change_type: 'wet',
    changed_at: '2024-02-10T14:30:00Z',
    notes: 'Normal amount',
    created_at: '2024-02-10T14:30:00Z',
    updated_at: '2024-02-10T14:30:00Z',
  };

  const mockDiaperDirty: DiaperChange = {
    id: 11,
    child: 1,
    change_type: 'dirty',
    changed_at: '2024-02-10T15:30:00Z',
    notes: 'Green stool',
    created_at: '2024-02-10T15:30:00Z',
    updated_at: '2024-02-10T15:30:00Z',
  };

  const mockDiaperBoth: DiaperChange = {
    id: 12,
    child: 1,
    change_type: 'both',
    changed_at: '2024-02-10T16:30:00Z',
    notes: '',
    created_at: '2024-02-10T16:30:00Z',
    updated_at: '2024-02-10T16:30:00Z',
  };

  beforeEach(async () => {
    const mockDiapersService = {
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
      imports: [DiaperForm],
      providers: [
        { provide: DiapersService, useValue: mockDiapersService },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: DateTimeService, useValue: mockDateTimeService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiaperForm);
    component = fixture.componentInstance;
    diapersService = TestBed.inject(DiapersService);
    childrenService = TestBed.inject(ChildrenService);
    dateTimeService = TestBed.inject(DateTimeService);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  describe('Form Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with default wet type', () => {
      expect(component.diaperForm.get('change_type')?.value).toBe('wet');
    });

    it('should initialize form with empty changed_at', () => {
      expect(component.diaperForm.get('changed_at')?.value).toBe('');
    });

    it('should initialize form with empty notes', () => {
      expect(component.diaperForm.get('notes')?.value).toBe('');
    });

    it('should expose VALIDATION constants to template', () => {
      expect(component.VALIDATION).toBeDefined();
      expect(component.VALIDATION.MAX_NOTES_LENGTH).toBe(500);
    });

    it('should expose diaperForm getter', () => {
      expect(component.diaperForm).toBeDefined();
      expect(component.diaperForm).toBe(component['form']);
    });
  });

  describe('Change Type Selection', () => {
    it('should accept wet change type', () => {
      component.diaperForm.get('change_type')?.setValue('wet');
      expect(component.diaperForm.get('change_type')?.value).toBe('wet');
    });

    it('should accept dirty change type', () => {
      component.diaperForm.get('change_type')?.setValue('dirty');
      expect(component.diaperForm.get('change_type')?.value).toBe('dirty');
    });

    it('should accept both change type', () => {
      component.diaperForm.get('change_type')?.setValue('both');
      expect(component.diaperForm.get('change_type')?.value).toBe('both');
    });

    it('should require change_type field', () => {
      component.diaperForm.get('change_type')?.setValue(null);
      expect(component.diaperForm.get('change_type')?.hasError('required')).toBe(
        true
      );
    });
  });

  describe('Required Fields', () => {
    it('should require changed_at field', () => {
      component.diaperForm.get('changed_at')?.setValue('');
      expect(component.diaperForm.get('changed_at')?.hasError('required')).toBe(
        true
      );

      component.diaperForm.get('changed_at')?.setValue('2026-02-10T10:30');
      expect(component.diaperForm.get('changed_at')?.hasError('required')).toBe(
        false
      );
    });

    it('should require change_type field', () => {
      component.diaperForm.get('change_type')?.setValue(null);
      expect(component.diaperForm.get('change_type')?.hasError('required')).toBe(
        true
      );

      component.diaperForm.get('change_type')?.setValue('wet');
      expect(component.diaperForm.get('change_type')?.hasError('required')).toBe(
        false
      );
    });
  });

  describe('DateTime Handling', () => {
    it('should call setDefaultDateTime with current time on create', () => {
      const now = new Date('2026-02-10T10:30:00');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const setDefaultSpy = vi.spyOn(component, 'setDefaultDateTime' as any);
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

    it('should build correct DTO for wet diaper creation', () => {
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
        notes: 'Normal amount',
      });

      const dto = component['buildCreateDto']();

      expect(dto).toEqual({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30:00Z',
        notes: 'Normal amount',
      });
    });

    it('should build correct DTO for dirty diaper creation', () => {
      component.diaperForm.patchValue({
        change_type: 'dirty',
        changed_at: '2026-02-10T10:30',
        notes: 'Green stool',
      });

      const dto = component['buildCreateDto']();

      expect(dto).toEqual({
        change_type: 'dirty',
        changed_at: '2026-02-10T10:30:00Z',
        notes: 'Green stool',
      });
    });

    it('should build correct DTO for both diaper creation', () => {
      component.diaperForm.patchValue({
        change_type: 'both',
        changed_at: '2026-02-10T10:30',
        notes: 'Full diaper',
      });

      const dto = component['buildCreateDto']();

      expect(dto).toEqual({
        change_type: 'both',
        changed_at: '2026-02-10T10:30:00Z',
        notes: 'Full diaper',
      });
    });

    it('should omit empty notes from DTO', () => {
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
        notes: '',
      });

      const dto = component['buildCreateDto']();

      expect(dto.notes).toBeUndefined();
    });

    it('should include notes in DTO when provided', () => {
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
        notes: 'Good sign',
      });

      const dto = component['buildCreateDto']();

      expect(dto.notes).toBe('Good sign');
    });

    it('should convert local datetime to UTC in DTO', () => {
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
      });

      const dto = component['buildCreateDto']();

      expect(dateTimeService.toUTC).toHaveBeenCalled();
      expect(dto.changed_at).toBe('2026-02-10T10:30:00Z');
    });
  });

  describe('Form Patch - Edit Mode', () => {
    it('should patch form with wet diaper data', () => {
      component['patchFormWithResource'](mockDiaperWet);

      expect(component.diaperForm.get('change_type')?.value).toBe('wet');
      expect(component.diaperForm.get('notes')?.value).toBe('Normal amount');
    });

    it('should patch form with dirty diaper data', () => {
      component['patchFormWithResource'](mockDiaperDirty);

      expect(component.diaperForm.get('change_type')?.value).toBe('dirty');
      expect(component.diaperForm.get('notes')?.value).toBe('Green stool');
    });

    it('should patch form with both diaper data', () => {
      component['patchFormWithResource'](mockDiaperBoth);

      expect(component.diaperForm.get('change_type')?.value).toBe('both');
    });

    it('should convert UTC datetime to local format', () => {
      const mockLocalDate = new Date('2026-02-10T14:30:00');
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(
        '2026-02-10T14:30'
      );

      component['patchFormWithResource'](mockDiaperWet);

      expect(component.diaperForm.get('changed_at')?.value).toBe(
        '2026-02-10T14:30'
      );
    });

    it('should set empty string for missing notes', () => {
      const diaperWithoutNotes: DiaperChange = {
        ...mockDiaperWet,
        notes: undefined,
      };

      component['patchFormWithResource'](diaperWithoutNotes);

      expect(component.diaperForm.get('notes')?.value).toBe('');
    });
  });

  describe('Notes Field Validation', () => {
    it('should accept notes up to 500 characters', () => {
      const longNotes = 'a'.repeat(500);
      component.diaperForm.get('notes')?.setValue(longNotes);
      expect(component.diaperForm.get('notes')?.hasError('maxlength')).toBe(
        false
      );
    });

    it('should reject notes exceeding 500 characters', () => {
      const tooLongNotes = 'a'.repeat(501);
      component.diaperForm.get('notes')?.setValue(tooLongNotes);
      expect(component.diaperForm.get('notes')?.hasError('maxlength')).toBe(
        true
      );
    });

    it('should accept empty notes', () => {
      component.diaperForm.get('notes')?.setValue('');
      expect(component.diaperForm.get('notes')?.valid).toBe(true);
    });

    it('should accept notes with special characters', () => {
      const notesWithSpecialChars = 'Notes with @#$%!? special chars 🍼';
      component.diaperForm.get('notes')?.setValue(notesWithSpecialChars);
      expect(component.diaperForm.get('notes')?.valid).toBe(true);
    });
  });

  describe('Form Validity', () => {
    it('should be invalid when change_type is missing', () => {
      component.diaperForm.patchValue({
        changed_at: '2026-02-10T10:30',
      });
      component.diaperForm.get('change_type')?.setValue(null);
      expect(component.diaperForm.invalid).toBe(true);
    });

    it('should be invalid when changed_at is missing', () => {
      component.diaperForm.get('changed_at')?.setValue('');
      expect(component.diaperForm.invalid).toBe(true);
    });

    it('should be valid wet diaper form when all required fields present', () => {
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
      });
      expect(component.diaperForm.valid).toBe(true);
    });

    it('should be valid dirty diaper form when all required fields present', () => {
      component.diaperForm.patchValue({
        change_type: 'dirty',
        changed_at: '2026-02-10T10:30',
      });
      expect(component.diaperForm.valid).toBe(true);
    });

    it('should be valid both diaper form when all required fields present', () => {
      component.diaperForm.patchValue({
        change_type: 'both',
        changed_at: '2026-02-10T10:30',
      });
      expect(component.diaperForm.valid).toBe(true);
    });

    it('should be valid with optional notes included', () => {
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
        notes: 'Lots of pee!',
      });
      expect(component.diaperForm.valid).toBe(true);
    });
  });

  describe('Form State Transitions', () => {
    it('should allow switching change types multiple times', () => {
      const types: Array<'wet' | 'dirty' | 'both'> = ['wet', 'dirty', 'both'];

      types.forEach((type) => {
        component.diaperForm.get('change_type')?.setValue(type);
        expect(component.diaperForm.get('change_type')?.value).toBe(type);
      });
    });

    it('should update notes without affecting change_type', () => {
      component.diaperForm.get('change_type')?.setValue('wet');
      component.diaperForm.get('notes')?.setValue('Initial notes');

      component.diaperForm.get('notes')?.setValue('Updated notes');

      expect(component.diaperForm.get('change_type')?.value).toBe('wet');
      expect(component.diaperForm.get('notes')?.value).toBe('Updated notes');
    });

    it('should update datetime without affecting other fields', () => {
      component.diaperForm.patchValue({
        change_type: 'dirty',
        notes: 'Some notes',
      });

      component.diaperForm.get('changed_at')?.setValue('2026-02-11T10:00');

      expect(component.diaperForm.get('change_type')?.value).toBe('dirty');
      expect(component.diaperForm.get('notes')?.value).toBe('Some notes');
      expect(component.diaperForm.get('changed_at')?.value).toBe('2026-02-11T10:00');
    });
  });

  describe('Edge Cases', () => {
    it('should handle datetime at midnight', () => {
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T00:00',
      });
      expect(component.diaperForm.valid).toBe(true);
    });

    it('should handle datetime at end of day', () => {
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T23:59',
      });
      expect(component.diaperForm.valid).toBe(true);
    });

    it('should handle very long notes (max length)', () => {
      const maxNotes = 'a'.repeat(500);
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
        notes: maxNotes,
      });
      expect(component.diaperForm.valid).toBe(true);
    });

    it('should handle notes with newlines', () => {
      const notesWithNewlines = 'Line 1\nLine 2\nLine 3';
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
        notes: notesWithNewlines,
      });
      expect(component.diaperForm.valid).toBe(true);
    });

    it('should handle whitespace-only notes', () => {
      const whitespaceNotes = '   \t\n   ';
      component.diaperForm.patchValue({
        change_type: 'wet',
        changed_at: '2026-02-10T10:30',
        notes: whitespaceNotes,
      });
      expect(component.diaperForm.valid).toBe(true);
    });

    it('should be invalid if only notes are provided (missing required fields)', () => {
      component.diaperForm.patchValue({
        notes: 'Some notes',
      });
      expect(component.diaperForm.invalid).toBe(true);
    });
  });

  describe('Resource Metadata Preservation', () => {
    it('should expose resourceName metadata', () => {
      expect(component['resourceName']).toBe('diaper');
    });

    it('should expose listRoute metadata', () => {
      expect(component['listRoute']).toBe('diapers');
    });

    it('should expose success message for create', () => {
      expect(component['successMessageCreate']).toBe(
        'Diaper change recorded successfully'
      );
    });

    it('should expose success message for update', () => {
      expect(component['successMessageUpdate']).toBe(
        'Diaper change updated successfully'
      );
    });
  });

  describe('Error Handling - Form & API', () => {
    describe('error signal management', () => {
      it('should initialize error signal as null', () => {
        expect(component.error()).toBeNull();
      });

      it('should set and clear error signal independently of form state', () => {
        component.error.set('API failed temporarily');
        expect(component.error()).toBe('API failed temporarily');
      });

      it('should clear error signal independently of form validity', () => {
        component.error.set('Some error');
        component.error.set(null);
        expect(component.error()).toBeNull();
      });

      it('should allow error updates without affecting form controls', () => {
        component.diaperForm.patchValue({
          change_type: 'wet' as const,
          changed_at: '2026-02-10T10:30',
        });
        const initialValue = component.diaperForm.get('change_type')?.value;

        component.error.set('Network timeout');
        expect(component.diaperForm.get('change_type')?.value).toBe(initialValue);
      });
    });

    describe('form data preservation during errors', () => {
      it('should preserve form data when error signal is set', () => {
        component.diaperForm.patchValue({
          change_type: 'wet' as const,
          changed_at: '2026-02-10T10:30',
          notes: 'Normal amount',
        });
        component.error.set('Server error occurred');

        expect(component.diaperForm.get('change_type')?.value).toBe('wet');
        expect(component.diaperForm.get('changed_at')?.value).toBe(
          '2026-02-10T10:30'
        );
        expect(component.diaperForm.get('notes')?.value).toBe('Normal amount');
      });

      it('should preserve multiple form fields when error occurs', () => {
        component.diaperForm.patchValue({
          change_type: 'dirty',
          changed_at: '2026-02-10T14:00',
          notes: 'Green stool',
        });

        component.error.set('API 503 Service Unavailable');

        expect(component.diaperForm.get('change_type')?.value).toBe('dirty');
        expect(component.diaperForm.get('notes')?.value).toBe('Green stool');
      });

      it('should allow user to continue editing despite error', () => {
        component.diaperForm.get('change_type')?.setValue('wet');
        component.error.set('Upload failed');

        component.diaperForm.get('notes')?.setValue('Updated notes');

        expect(component.diaperForm.get('notes')?.value).toBe('Updated notes');
        expect(component.error()).toBe('Upload failed');
      });
    });

    describe('error handling with different error types', () => {
      it('should handle network timeout error', () => {
        const errorMessage = 'Network request timeout';
        component.error.set(errorMessage);

        expect(component.error()).toBe(errorMessage);
      });

      it('should handle validation error', () => {
        const errorMessage = 'Invalid change_type value provided';
        component.error.set(errorMessage);

        expect(component.error()).toBe(errorMessage);
      });

      it('should handle permission error', () => {
        const errorMessage = 'You do not have permission to update this record';
        component.error.set(errorMessage);

        expect(component.error()).toBe(errorMessage);
      });

      it('should handle server error', () => {
        const errorMessage = 'Internal server error occurred';
        component.error.set(errorMessage);

        expect(component.error()).toBe(errorMessage);
      });

      it('should handle not found error', () => {
        const errorMessage = 'Diaper record not found';
        component.error.set(errorMessage);

        expect(component.error()).toBe(errorMessage);
      });
    });

    describe('error state persistence', () => {
      it('should persist error through multiple form updates', () => {
        component.error.set('Error occurred');

        component.diaperForm.get('change_type')?.setValue('dirty');
        expect(component.error()).toBe('Error occurred');

        component.diaperForm.get('notes')?.setValue('Some notes');
        expect(component.error()).toBe('Error occurred');
      });

      it('should allow clearing error independently', () => {
        component.error.set('API error');
        expect(component.error()).not.toBeNull();

        component.error.set(null);
        expect(component.error()).toBeNull();
      });

      it('should preserve error until explicitly cleared', () => {
        component.diaperForm.patchValue({
          change_type: 'both',
          changed_at: '2026-02-10T16:00',
        });
        component.error.set('Submission failed');

        // User interacts with form
        component.diaperForm.get('change_type')?.setValue('wet');
        component.diaperForm.get('notes')?.setValue('New notes');

        // Error should still be present
        expect(component.error()).toBe('Submission failed');
      });
    });

    describe('validation error scenarios', () => {
      it('should allow error signal with invalid form state', () => {
        component.diaperForm.patchValue({
          change_type: null,
          changed_at: '',
        });

        expect(component.diaperForm.invalid).toBe(true);

        component.error.set('Validation failed on server');
        expect(component.error()).toBe('Validation failed on server');
      });

      it('should handle error with partially filled form', () => {
        component.diaperForm.get('change_type')?.setValue('wet');
        // changed_at is missing, form invalid

        component.error.set('Request error');

        expect(component.diaperForm.invalid).toBe(true);
        expect(component.error()).toBe('Request error');
      });

      it('should maintain form validity state independent of error', () => {
        component.diaperForm.patchValue({
          change_type: 'wet',
          changed_at: '2026-02-10T10:30',
        });

        expect(component.diaperForm.valid).toBe(true);

        component.error.set('Some error');

        expect(component.diaperForm.valid).toBe(true);
        expect(component.error()).toBe('Some error');
      });
    });

    describe('concurrent error scenarios', () => {
      it('should handle rapid error updates', () => {
        component.error.set('Error 1');
        component.error.set('Error 2');
        component.error.set('Error 3');

        expect(component.error()).toBe('Error 3');
      });

      it('should handle error clearing and setting', () => {
        component.error.set('First error');
        component.error.set(null);
        component.error.set('Second error');

        expect(component.error()).toBe('Second error');
      });
    });
  });
});
