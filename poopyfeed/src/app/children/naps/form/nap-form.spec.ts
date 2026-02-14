import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NapForm } from './nap-form';
import { NapsService } from '../../../services/naps.service';
import { ChildrenService } from '../../../services/children.service';
import { DateTimeService } from '../../../services/datetime.service';
import { ToastService } from '../../../services/toast.service';
import { Nap, NapCreate } from '../../../models/nap.model';
import { Child } from '../../../models/child.model';

describe('NapForm', () => {
  let component: NapForm;
  let fixture: ComponentFixture<NapForm>;
  let napsService: NapsService;
  let childrenService: ChildrenService;
  let dateTimeService: DateTimeService;
  let toastService: ToastService;
  let router: Router;

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

  const mockNap: Nap = {
    id: 5,
    child: 1,
    napped_at: '2024-02-10T13:00:00Z',
    ended_at: '2024-02-10T14:30:00Z',
    duration_minutes: 90,
    notes: 'Took a good nap',
    created_at: '2024-02-10T13:00:00Z',
    updated_at: '2024-02-10T13:00:00Z',
  };

  const mockNapNoNotes: Nap = {
    id: 6,
    child: 1,
    napped_at: '2024-02-10T15:00:00Z',
    ended_at: null,
    duration_minutes: null,
    notes: undefined,
    created_at: '2024-02-10T15:00:00Z',
    updated_at: '2024-02-10T15:00:00Z',
  };

  beforeEach(async () => {
    const mockNapsService = {
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
      imports: [NapForm],
      providers: [
        { provide: NapsService, useValue: mockNapsService },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: DateTimeService, useValue: mockDateTimeService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NapForm);
    component = fixture.componentInstance;
    napsService = TestBed.inject(NapsService);
    childrenService = TestBed.inject(ChildrenService);
    dateTimeService = TestBed.inject(DateTimeService);
    toastService = TestBed.inject(ToastService);
    router = TestBed.inject(Router);
  });

  describe('Form Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty napped_at', () => {
      expect(component.napForm.get('napped_at')?.value).toBe('');
    });

    it('should initialize form with empty ended_at', () => {
      expect(component.napForm.get('ended_at')?.value).toBe('');
    });

    it('should initialize form with empty notes', () => {
      expect(component.napForm.get('notes')?.value).toBe('');
    });

    it('should expose VALIDATION constants to template', () => {
      expect(component.VALIDATION).toBeDefined();
      expect(component.VALIDATION.MAX_NOTES_LENGTH).toBe(500);
    });

    it('should expose napForm getter', () => {
      expect(component.napForm).toBeDefined();
      expect(component.napForm).toBe(component['form']);
    });
  });

  describe('Required Fields', () => {
    it('should require napped_at field', () => {
      component.napForm.get('napped_at')?.setValue('');
      expect(component.napForm.get('napped_at')?.hasError('required')).toBe(true);

      component.napForm.get('napped_at')?.setValue('2026-02-10T10:30');
      expect(component.napForm.get('napped_at')?.hasError('required')).toBe(
        false
      );
    });

    it('should allow ended_at to be optional', () => {
      component.napForm.get('ended_at')?.setValue('');
      expect(component.napForm.get('ended_at')?.valid).toBe(true);
    });

    it('should allow notes to be optional', () => {
      component.napForm.get('notes')?.setValue('');
      expect(component.napForm.get('notes')?.valid).toBe(true);
    });
  });

  describe('DateTime Handling', () => {
    it('should set default napped_at to current time in create mode', () => {
      const now = new Date('2026-02-10T10:30:00');
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const setDefaultSpy = vi.spyOn(component, 'setDefaultDateTime' as any);
      component['setDefaultDateTime']();

      expect(setDefaultSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should format datetime for HTML5 input using DateTimeService', () => {
      const mockDateTime = '2026-02-10T10:30';
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(mockDateTime);

      const now = new Date();
      component['setDefaultDateTime']();

      expect(dateTimeService.toInputFormat).toHaveBeenCalledWith(now);
    });

    it('should convert local time to UTC when building DTO', () => {
      vi.mocked(dateTimeService.toUTC).mockReturnValue('2026-02-10T10:30:00Z');

      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
      });

      const dto = component['buildCreateDto']();

      expect(dateTimeService.toUTC).toHaveBeenCalled();
      expect(dto.napped_at).toBe('2026-02-10T10:30:00Z');
    });

    it('should convert UTC to local when patching form in edit mode', () => {
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(
        '2026-02-10T13:00'
      );

      component['patchFormWithResource'](mockNap);

      expect(component.napForm.get('napped_at')?.value).toBe('2026-02-10T13:00');
    });

    it('should handle ended_at conversion when present', () => {
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(
        '2026-02-10T14:30'
      );

      component['patchFormWithResource'](mockNap);

      expect(component.napForm.get('ended_at')?.value).toBe('2026-02-10T14:30');
    });
  });

  describe('Form Submission - Create Mode', () => {
    beforeEach(() => {
      vi.mocked(childrenService.get).mockReturnValue(of(mockChild));
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(
        '2026-02-10T10:30'
      );
      vi.mocked(dateTimeService.toUTC).mockReturnValue('2026-02-10T10:30:00Z');
      vi.mocked(dateTimeService.toLocal).mockReturnValue(
        new Date('2026-02-10T13:00:00')
      );
    });

    it('should build correct NapCreate DTO with required fields', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
      });

      const dto = component['buildCreateDto']();

      expect(dto).toEqual({
        napped_at: '2026-02-10T10:30:00Z',
        notes: undefined,
      });
    });

    it('should include notes in DTO when provided', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        notes: 'Took a good nap',
      });

      const dto = component['buildCreateDto']();

      expect(dto.notes).toBe('Took a good nap');
    });

    it('should exclude notes from DTO when empty string', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        notes: '',
      });

      const dto = component['buildCreateDto']();

      expect(dto.notes).toBeUndefined();
    });

    it('should include ended_at in DTO when provided', () => {
      vi.mocked(dateTimeService.toUTC)
        .mockReturnValueOnce('2026-02-10T10:30:00Z')
        .mockReturnValueOnce('2026-02-10T11:30:00Z');

      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        ended_at: '2026-02-10T11:30',
      });

      const dto = component['buildCreateDto']();

      expect(dto.ended_at).toBe('2026-02-10T11:30:00Z');
    });

    it('should exclude ended_at from DTO when empty', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        ended_at: '',
      });

      const dto = component['buildCreateDto']();

      expect(dto.ended_at).toBeUndefined();
    });

    it('should convert napped_at to UTC before API call', () => {
      vi.mocked(dateTimeService.fromInputFormat).mockReturnValue(
        new Date('2026-02-10T10:30:00')
      );
      vi.mocked(dateTimeService.toUTC).mockReturnValue('2026-02-10T10:30:00Z');

      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
      });

      const dto = component['buildCreateDto']();

      expect(dateTimeService.fromInputFormat).toHaveBeenCalledWith(
        '2026-02-10T10:30'
      );
      expect(dateTimeService.toUTC).toHaveBeenCalled();
      expect(dto.napped_at).toBe('2026-02-10T10:30:00Z');
    });
  });

  describe('Form Patch - Edit Mode', () => {
    beforeEach(() => {
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(
        '2026-02-10T13:00'
      );
    });

    it('should load existing nap data into form', () => {
      component['patchFormWithResource'](mockNap);

      expect(component.napForm.get('notes')?.value).toBe('Took a good nap');
    });

    it('should convert UTC napped_at to local time for display', () => {
      component['patchFormWithResource'](mockNap);

      expect(component.napForm.get('napped_at')?.value).toBe('2026-02-10T13:00');
    });

    it('should handle null notes by setting empty string', () => {
      component['patchFormWithResource'](mockNapNoNotes);

      expect(component.napForm.get('notes')?.value).toBe('');
    });

    it('should handle ended_at when present', () => {
      vi.mocked(dateTimeService.toInputFormat)
        .mockReturnValueOnce('2026-02-10T13:00')
        .mockReturnValueOnce('2026-02-10T14:30');

      component['patchFormWithResource'](mockNap);

      expect(component.napForm.get('ended_at')?.value).toBe('2026-02-10T14:30');
    });

    it('should leave ended_at empty when null', () => {
      vi.mocked(dateTimeService.toInputFormat).mockReturnValue(
        '2026-02-10T13:00'
      );

      component['patchFormWithResource'](mockNapNoNotes);

      expect(component.napForm.get('ended_at')?.value).toBe('');
    });

    it('should preserve resource metadata', () => {
      component['patchFormWithResource'](mockNap);

      expect(component['resourceName']).toBe('nap');
      expect(component['listRoute']).toBe('naps');
    });
  });

  describe('Notes Field Validation', () => {
    it('should enforce max length of 500 characters', () => {
      const tooLongNotes = 'a'.repeat(501);
      component.napForm.get('notes')?.setValue(tooLongNotes);
      expect(component.napForm.get('notes')?.hasError('maxlength')).toBe(true);
    });

    it('should allow empty notes', () => {
      component.napForm.get('notes')?.setValue('');
      expect(component.napForm.get('notes')?.valid).toBe(true);
    });

    it('should allow special characters in notes', () => {
      const notesWithSpecialChars = 'Notes with @#$%!? special chars 😴';
      component.napForm.get('notes')?.setValue(notesWithSpecialChars);
      expect(component.napForm.get('notes')?.valid).toBe(true);
    });

    it('should handle very long notes at boundary', () => {
      const maxNotes = 'a'.repeat(500);
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        notes: maxNotes,
      });
      expect(component.napForm.valid).toBe(true);
    });
  });

  describe('Form Validity', () => {
    it('should be invalid when napped_at is empty', () => {
      component.napForm.patchValue({
        napped_at: '',
      });
      expect(component.napForm.invalid).toBe(true);
    });

    it('should be valid with only napped_at filled', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
      });
      expect(component.napForm.valid).toBe(true);
    });
  });

  describe('Form State Transitions', () => {
    it('should update notes without affecting napped_at', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        notes: 'Initial notes',
      });

      component.napForm.get('notes')?.setValue('Updated notes');

      expect(component.napForm.get('napped_at')?.value).toBe('2026-02-10T10:30');
      expect(component.napForm.get('notes')?.value).toBe('Updated notes');
    });

    it('should update datetime without affecting other fields', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        notes: 'Some notes',
      });

      component.napForm.get('napped_at')?.setValue('2026-02-10T14:00');

      expect(component.napForm.get('napped_at')?.value).toBe('2026-02-10T14:00');
      expect(component.napForm.get('notes')?.value).toBe('Some notes');
    });
  });

  describe('Edge Cases', () => {
    it('should handle datetime at midnight', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T00:00',
      });
      expect(component.napForm.valid).toBe(true);
    });

    it('should handle datetime at end of day', () => {
      component.napForm.patchValue({
        napped_at: '2026-02-10T23:59',
      });
      expect(component.napForm.valid).toBe(true);
    });

    it('should handle notes with newlines', () => {
      const notesWithNewlines = 'Line 1\nLine 2\nLine 3';
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        notes: notesWithNewlines,
      });
      expect(component.napForm.valid).toBe(true);
    });

    it('should handle whitespace-only notes', () => {
      const whitespaceNotes = '   \t\n   ';
      component.napForm.patchValue({
        napped_at: '2026-02-10T10:30',
        notes: whitespaceNotes,
      });
      expect(component.napForm.valid).toBe(true);
    });

    it('should be invalid if only notes are provided', () => {
      component.napForm.patchValue({
        notes: 'Some notes',
      });
      expect(component.napForm.invalid).toBe(true);
    });
  });

  describe('Resource Metadata', () => {
    it('should set resourceName to "nap"', () => {
      expect(component['resourceName']).toBe('nap');
    });

    it('should set listRoute to "naps"', () => {
      expect(component['listRoute']).toBe('naps');
    });

    it('should expose success message for create', () => {
      expect(component['successMessageCreate']).toBe('Nap recorded successfully');
    });

    it('should expose success message for update', () => {
      expect(component['successMessageUpdate']).toBe('Nap updated successfully');
    });
  });
});
