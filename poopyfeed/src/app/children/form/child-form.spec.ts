import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChildForm } from './child-form';
import { ChildrenService } from '../../services/children.service';
import { ToastService } from '../../services/toast.service';
import { Child, ChildCreate } from '../../models/child.model';

describe('ChildForm', () => {
  let component: ChildForm;
  let fixture: ComponentFixture<ChildForm>;
  let childrenService: ChildrenService;
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

  const mockChildMale: Child = {
    id: 2,
    name: 'Baby Bob',
    date_of_birth: '2023-06-20',
    gender: 'M',
    user_role: 'owner',
    created_at: '2023-06-20T10:00:00Z',
    updated_at: '2023-06-20T10:00:00Z',
    last_diaper_change: '2024-02-10T14:30:00Z',
    last_nap: '2024-02-10T13:00:00Z',
    last_feeding: '2024-02-10T12:00:00Z',
  };

  const mockChildOther: Child = {
    id: 3,
    name: 'Baby Sam',
    date_of_birth: '2023-09-10',
    gender: 'O',
    user_role: 'owner',
    created_at: '2023-09-10T10:00:00Z',
    updated_at: '2023-09-10T10:00:00Z',
    last_diaper_change: '2024-02-10T14:30:00Z',
    last_nap: '2024-02-10T13:00:00Z',
    last_feeding: '2024-02-10T12:00:00Z',
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      const mockChildrenService = {
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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
        paramMap: of(new Map()),
        queryParamMap: of(new Map()),
        snapshot: {
          paramMap: {
            get: vi.fn(() => null), // No :id parameter = create mode
          },
        },
      } as any;

      await TestBed.configureTestingModule({
        imports: [ChildForm],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: ToastService, useValue: mockToastService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ChildForm);
      component = fixture.componentInstance;
      childrenService = TestBed.inject(ChildrenService);
      toastService = TestBed.inject(ToastService);
      router = TestBed.inject(Router);
    });

    describe('Component Initialization - Create', () => {
      it('should create component', () => {
        expect(component).toBeTruthy();
      });

      it('should initialize form with empty name', () => {
        expect(component.childForm.get('name')?.value).toBe('');
      });

      it('should initialize form with empty date_of_birth', () => {
        expect(component.childForm.get('date_of_birth')?.value).toBe('');
      });

      it('should initialize form with default gender "M"', () => {
        expect(component.childForm.get('gender')?.value).toBe('M');
      });

      it('should initialize signals correctly', () => {
        expect(component.childId()).toBeNull();
        expect(component.isSubmitting()).toBe(false);
        expect(component.error()).toBeNull();
      });

      it('should detect create mode when no :id in route', () => {
        component.ngOnInit();
        expect(component.isEdit()).toBe(false);
      });
    });

    describe('Form Validation - Create', () => {
      it('should require name field', () => {
        const nameControl = component.childForm.get('name');
        nameControl?.setValue('');
        expect(nameControl?.hasError('required')).toBe(true);

        nameControl?.setValue('Baby Alice');
        expect(nameControl?.hasError('required')).toBe(false);
      });

      it('should enforce max length 100 for name', () => {
        const nameControl = component.childForm.get('name');
        const tooLongName = 'a'.repeat(101);

        nameControl?.setValue(tooLongName);
        expect(nameControl?.hasError('maxlength')).toBe(true);

        nameControl?.setValue('a'.repeat(100));
        expect(nameControl?.hasError('maxlength')).toBe(false);
      });

      it('should require date_of_birth field', () => {
        const dobControl = component.childForm.get('date_of_birth');
        dobControl?.setValue('');
        expect(dobControl?.hasError('required')).toBe(true);

        dobControl?.setValue('2024-01-15');
        expect(dobControl?.hasError('required')).toBe(false);
      });

      it('should require gender field', () => {
        const genderControl = component.childForm.get('gender');
        genderControl?.setValue(null);
        expect(genderControl?.hasError('required')).toBe(true);

        genderControl?.setValue('F');
        expect(genderControl?.hasError('required')).toBe(false);
      });

      it('should be valid with all required fields filled', () => {
        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });
        expect(component.childForm.valid).toBe(true);
      });

      it('should be invalid when name is empty', () => {
        component.childForm.patchValue({
          name: '',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });
        expect(component.childForm.invalid).toBe(true);
      });

      it('should be invalid when date_of_birth is empty', () => {
        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '',
          gender: 'F',
        });
        expect(component.childForm.invalid).toBe(true);
      });

      it('should be invalid when gender is null', () => {
        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
        });
        component.childForm.get('gender')?.setValue(null);
        expect(component.childForm.invalid).toBe(true);
      });
    });

    describe('Form Submission - Create', () => {
      it('should prevent submission when form invalid', () => {
        component.childForm.patchValue({
          name: '',
          date_of_birth: '',
          gender: null,
        });

        component.onSubmit();

        expect(childrenService.create).not.toHaveBeenCalled();
      });

      it('should call ChildrenService.create with form data', () => {
        const mockResponse = mockChild;
        vi.mocked(childrenService.create).mockReturnValue(of(mockResponse));

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();

        expect(childrenService.create).toHaveBeenCalledWith({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });
      });

      it('should show success toast on successful creation', () => {
        vi.mocked(childrenService.create).mockReturnValue(of(mockChild));

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();

        expect(toastService.success).toHaveBeenCalledWith(
          'Child created successfully'
        );
      });

      it('should navigate to /children on success', () => {
        vi.mocked(childrenService.create).mockReturnValue(of(mockChild));

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();

        expect(router.navigate).toHaveBeenCalledWith(['/children']);
      });

      it('should handle API errors and display error message', () => {
        const error = new Error('Network error');
        vi.mocked(childrenService.create).mockReturnValue(
          throwError(() => error)
        );

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();

        expect(component.error()).toBe('Network error');
        expect(toastService.error).toHaveBeenCalledWith('Network error');
      });

      it('should validate all fields required when submitting', () => {
        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        // Simulate form value with null values
        const formSpy = vi
          .spyOn(component.childForm, 'value', 'get')
          .mockReturnValue({
            name: null,
            date_of_birth: '2024-01-15',
            gender: 'F',
          });

        component.onSubmit();

        expect(component.error()).toBe('All fields are required');
        formSpy.mockRestore();
      });
    });

    describe('Loading States - Create', () => {
      it('should set isSubmitting=true during API call', () => {
        let apiCallInProgress = false;
        vi.mocked(childrenService.create).mockImplementation(() => {
          apiCallInProgress = true;
          expect(component.isSubmitting()).toBe(true);
          return of(mockChild);
        });

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();

        expect(apiCallInProgress).toBe(true);
      });

      it('should set isSubmitting=false after success', () => {
        vi.mocked(childrenService.create).mockReturnValue(of(mockChild));

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();

        expect(component.isSubmitting()).toBe(false);
      });

      it('should set isSubmitting=false after error', () => {
        const error = new Error('Network error');
        vi.mocked(childrenService.create).mockReturnValue(
          throwError(() => error)
        );

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();

        expect(component.isSubmitting()).toBe(false);
      });
    });

    describe('Gender Values', () => {
      it('should accept gender value M', () => {
        component.childForm.get('gender')?.setValue('M');
        expect(component.childForm.get('gender')?.value).toBe('M');
      });

      it('should accept gender value F', () => {
        component.childForm.get('gender')?.setValue('F');
        expect(component.childForm.get('gender')?.value).toBe('F');
      });

      it('should accept gender value O', () => {
        component.childForm.get('gender')?.setValue('O');
        expect(component.childForm.get('gender')?.value).toBe('O');
      });
    });

    describe('Name Field Edge Cases', () => {
      it('should accept name at max length (100 chars)', () => {
        const maxName = 'a'.repeat(100);
        component.childForm.get('name')?.setValue(maxName);
        expect(component.childForm.get('name')?.valid).toBe(true);
      });

      it('should reject name exceeding max length', () => {
        const tooLongName = 'a'.repeat(101);
        component.childForm.get('name')?.setValue(tooLongName);
        expect(component.childForm.get('name')?.hasError('maxlength')).toBe(
          true
        );
      });

      it('should accept name with special characters', () => {
        component.childForm.get('name')?.setValue("Baby O'Brien-Smith");
        expect(component.childForm.get('name')?.valid).toBe(true);
      });

      it('should accept name with unicode characters', () => {
        component.childForm.get('name')?.setValue('Báby José');
        expect(component.childForm.get('name')?.valid).toBe(true);
      });
    });

    describe('Cancel Button - Create', () => {
      it('should navigate to /children when cancel clicked', () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/children']);
      });
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      const mockChildrenService = {
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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
        paramMap: of(new Map([['id', '1']])),
        queryParamMap: of(new Map()),
        snapshot: {
          paramMap: {
            get: vi.fn((param) => (param === 'id' ? '1' : null)),
          },
        },
      } as any;

      await TestBed.configureTestingModule({
        imports: [ChildForm],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: ToastService, useValue: mockToastService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ChildForm);
      component = fixture.componentInstance;
      childrenService = TestBed.inject(ChildrenService);
      toastService = TestBed.inject(ToastService);
      router = TestBed.inject(Router);
    });

    describe('Component Initialization - Edit', () => {
      beforeEach(() => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChild));
      });

      it('should detect edit mode when :id present in route', () => {
        component.ngOnInit();
        expect(component.isEdit()).toBe(true);
      });

      it('should set childId signal from route parameter', () => {
        component.ngOnInit();
        expect(component.childId()).toBe(1);
      });

      it('should call loadChild() in edit mode', () => {
        const loadChildSpy = vi.spyOn(component, 'loadChild');
        component.ngOnInit();

        expect(loadChildSpy).toHaveBeenCalledWith(1);
      });
    });

    describe('Load Child for Editing', () => {
      it('should fetch child data from ChildrenService', () => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChild));

        component.loadChild(1);

        expect(childrenService.get).toHaveBeenCalledWith(1);
      });

      it('should populate form with child data on success', () => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChild));

        component.loadChild(1);

        expect(component.childForm.get('name')?.value).toBe('Baby Alice');
        expect(component.childForm.get('date_of_birth')?.value).toBe(
          '2024-01-15'
        );
        expect(component.childForm.get('gender')?.value).toBe('F');
      });

      it('should set error signal on API error', () => {
        const error = new Error('Failed to load child');
        vi.mocked(childrenService.get).mockReturnValue(
          throwError(() => error)
        );

        component.loadChild(1);

        expect(component.error()).toBe('Failed to load child');
      });

      it('should handle network errors gracefully', () => {
        const error = new Error('Network timeout');
        vi.mocked(childrenService.get).mockReturnValue(
          throwError(() => error)
        );

        component.loadChild(1);

        expect(component.error()).toBe('Network timeout');
      });
    });

    describe('Form Submission - Edit', () => {
      beforeEach(() => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChild));
      });

      it('should call ChildrenService.update with childId and form data', () => {
        vi.mocked(childrenService.update).mockReturnValue(of(mockChild));

        component.childForm.patchValue({
          name: 'Baby Alice Updated',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.childId.set(1);
        component.onSubmit();

        expect(childrenService.update).toHaveBeenCalledWith(1, {
          name: 'Baby Alice Updated',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });
      });

      it('should show "updated" toast message in edit mode', () => {
        vi.mocked(childrenService.update).mockReturnValue(of(mockChild));

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.childId.set(1);
        component.onSubmit();

        expect(toastService.success).toHaveBeenCalledWith(
          'Child updated successfully'
        );
      });

      it('should navigate to /children on success', () => {
        vi.mocked(childrenService.update).mockReturnValue(of(mockChild));

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.childId.set(1);
        component.onSubmit();

        expect(router.navigate).toHaveBeenCalledWith(['/children']);
      });

      it('should handle API errors in edit mode', () => {
        const error = new Error('Validation error');
        vi.mocked(childrenService.update).mockReturnValue(
          throwError(() => error)
        );

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.childId.set(1);
        component.onSubmit();

        expect(component.error()).toBe('Validation error');
        expect(toastService.error).toHaveBeenCalledWith('Validation error');
      });

      it('should allow updating only name field', () => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChild));
        vi.mocked(childrenService.update).mockReturnValue(of({
          ...mockChild,
          name: 'Baby Alice Updated',
        }));

        component.ngOnInit();
        component.childForm.get('name')?.setValue('Baby Alice Updated');

        component.onSubmit();

        expect(childrenService.update).toHaveBeenCalledWith(1, {
          name: 'Baby Alice Updated',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });
      });

      it('should allow updating only gender field', () => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChildMale));
        vi.mocked(childrenService.update).mockReturnValue(of({
          ...mockChildMale,
          gender: 'O' as any,
        }));

        component.ngOnInit();
        component.childForm.get('gender')?.setValue('O');

        component.onSubmit();

        expect(childrenService.update).toHaveBeenCalledWith(1, {
          name: 'Baby Bob',
          date_of_birth: '2023-06-20',
          gender: 'O',
        });
      });
    });

    describe('Edit Mode - Gender Values', () => {
      beforeEach(() => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChildMale));
      });

      it('should load male child with gender M', () => {
        component.loadChild(2);

        expect(component.childForm.get('gender')?.value).toBe('M');
      });

      it('should load other gender child with gender O', () => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChildOther));

        component.loadChild(3);

        expect(component.childForm.get('gender')?.value).toBe('O');
      });

      it('should allow changing gender from M to F', () => {
        component.loadChild(2);

        component.childForm.get('gender')?.setValue('F');

        expect(component.childForm.get('gender')?.value).toBe('F');
      });
    });

    describe('Cancel Button - Edit', () => {
      it('should navigate to /children when cancel clicked in edit mode', () => {
        component.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/children']);
      });
    });
  });

  describe('Shared Functionality', () => {
    beforeEach(async () => {
      const mockChildrenService = {
        get: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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
        paramMap: of(new Map()),
        queryParamMap: of(new Map()),
        snapshot: {
          paramMap: {
            get: vi.fn(() => null),
          },
        },
      } as any;

      await TestBed.configureTestingModule({
        imports: [ChildForm],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: ToastService, useValue: mockToastService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ChildForm);
      component = fixture.componentInstance;
      childrenService = TestBed.inject(ChildrenService);
      toastService = TestBed.inject(ToastService);
      router = TestBed.inject(Router);
    });

    describe('Form State', () => {
      it('should reset error when form is submitted successfully', () => {
        component.error.set('Previous error');
        vi.mocked(childrenService.create).mockReturnValue(of(mockChild));

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();

        expect(component.error()).toBeNull();
      });

      it('should allow retrying after error', () => {
        const error = new Error('First error');
        vi.mocked(childrenService.create)
          .mockReturnValueOnce(throwError(() => error))
          .mockReturnValueOnce(of(mockChild));

        component.childForm.patchValue({
          name: 'Baby Alice',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.onSubmit();
        expect(component.error()).toBe('First error');

        component.onSubmit();
        expect(component.error()).toBeNull();
        expect(toastService.success).toHaveBeenCalled();
      });
    });

    describe('Computed Signals', () => {
      it('isEdit should be computed from childId', () => {
        component.childId.set(null);
        expect(component.isEdit()).toBe(false);

        component.childId.set(1);
        expect(component.isEdit()).toBe(true);

        component.childId.set(2);
        expect(component.isEdit()).toBe(true);
      });
    });

    describe('Form Updates', () => {
      it('should allow updating form after initial load', () => {
        component.childForm.patchValue({
          name: 'Initial Name',
          date_of_birth: '2024-01-15',
          gender: 'F',
        });

        component.childForm.patchValue({
          name: 'Updated Name',
        });

        expect(component.childForm.get('name')?.value).toBe('Updated Name');
        expect(component.childForm.get('date_of_birth')?.value).toBe(
          '2024-01-15'
        );
      });
    });
  });
});
