import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChildForm } from './child-form';
import { ChildrenService } from '../../services/children.service';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { Child, ChildCreate } from '../../models/child.model';
import type { NotificationPreference } from '../../models/notification.model';

describe('ChildForm', () => {
  let component: ChildForm;
  let fixture: ComponentFixture<ChildForm>;
  let childrenService: ChildrenService;
  let notificationService: NotificationService;
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
        custom_bottle_low_oz: null,
        custom_bottle_mid_oz: null,
        custom_bottle_high_oz: null,
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
        custom_bottle_low_oz: null,
        custom_bottle_mid_oz: null,
        custom_bottle_high_oz: null,
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
        custom_bottle_low_oz: null,
        custom_bottle_mid_oz: null,
        custom_bottle_high_oz: null,
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

      const mockNotificationService = {
        getPreferences: vi.fn(),
        updatePreference: vi.fn(),
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
          { provide: NotificationService, useValue: mockNotificationService },
          { provide: ToastService, useValue: mockToastService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ChildForm);
      component = fixture.componentInstance;
      childrenService = TestBed.inject(ChildrenService);
      notificationService = TestBed.inject(NotificationService);
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
          custom_bottle_low_oz: null,
          custom_bottle_mid_oz: null,
          custom_bottle_high_oz: null,
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

      const mockPreference: NotificationPreference = {
        id: 10,
        child_id: 1,
        child_name: 'Baby Alice',
        notify_feedings: true,
        notify_diapers: true,
        notify_naps: false,
      };

      const mockNotificationService = {
        getPreferences: vi.fn().mockReturnValue(of([mockPreference])),
        updatePreference: vi.fn().mockReturnValue(of({ ...mockPreference, notify_feedings: false })),
      };

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
          { provide: NotificationService, useValue: mockNotificationService },
          { provide: ToastService, useValue: mockToastService },
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: mockActivatedRoute },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ChildForm);
      component = fixture.componentInstance;
      childrenService = TestBed.inject(ChildrenService);
      notificationService = TestBed.inject(NotificationService);
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

    describe('Notification preferences', () => {
      beforeEach(() => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChild));
      });

      it('should call getPreferences after child load in edit mode', () => {
        component.loadChild(1);

        expect(notificationService.getPreferences).toHaveBeenCalled();
      });

      it('should set notificationPreference when preference found for child', () => {
        component.loadChild(1);

        const pref = component.notificationPreference();
        expect(pref).not.toBeNull();
        expect(pref?.child_id).toBe(1);
        expect(pref?.notify_feedings).toBe(true);
        expect(pref?.notify_diapers).toBe(true);
        expect(pref?.notify_naps).toBe(false);
      });

      it('should set notificationPreference to null when no preference for child', () => {
        vi.mocked(notificationService.getPreferences).mockReturnValue(
          of([{ id: 99, child_id: 999, child_name: 'Other', notify_feedings: true, notify_diapers: true, notify_naps: true }])
        );

        component.loadChild(1);

        expect(component.notificationPreference()).toBeNull();
      });

      it('should set preferenceError when getPreferences fails', () => {
        vi.mocked(notificationService.getPreferences).mockReturnValue(
          throwError(() => new Error('Preferences load failed'))
        );

        component.loadChild(1);

        expect(component.preferenceError()).toBe('Preferences load failed');
      });

      it('should call updatePreference when toggle changed', () => {
        component.loadChild(1);
        const pref = component.notificationPreference();
        expect(pref).not.toBeNull();

        component.onPreferenceToggle('notify_feedings', false);

        expect(notificationService.updatePreference).toHaveBeenCalledWith(pref!.id, { notify_feedings: false });
      });

      it('should update notificationPreference signal on successful toggle', () => {
        const updated = {
          id: 10,
          child_id: 1,
          child_name: 'Baby Alice',
          notify_feedings: false,
          notify_diapers: true,
          notify_naps: false,
        };
        vi.mocked(notificationService.updatePreference).mockReturnValue(of(updated));

        component.loadChild(1);
        component.onPreferenceToggle('notify_feedings', false);

        expect(component.notificationPreference()).toEqual(updated);
      });

      it('should show success toast on successful preference update', () => {
        component.loadChild(1);
        component.onPreferenceToggle('notify_diapers', false);

        expect(toastService.success).toHaveBeenCalledWith('Notification preference updated');
      });

      it('should show error toast and clear preferenceSaving on update error', () => {
        component.loadChild(1);
        vi.mocked(notificationService.updatePreference).mockReturnValue(
          throwError(() => new Error('Update failed'))
        );

        component.onPreferenceToggle('notify_naps', true);

        expect(toastService.error).toHaveBeenCalledWith('Update failed');
        expect(component.preferenceSaving()).toBe(false);
      });

      it('should do nothing when onPreferenceToggle called with no preference', () => {
        component.notificationPreference.set(null);
        component.onPreferenceToggle('notify_feedings', false);

        expect(notificationService.updatePreference).not.toHaveBeenCalled();
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
          custom_bottle_low_oz: null,
          custom_bottle_mid_oz: null,
          custom_bottle_high_oz: null,
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
          custom_bottle_low_oz: null,
          custom_bottle_mid_oz: null,
          custom_bottle_high_oz: null,
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
          custom_bottle_low_oz: null,
          custom_bottle_mid_oz: null,
          custom_bottle_high_oz: null,
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

      const mockNotificationService = {
        getPreferences: vi.fn(),
        updatePreference: vi.fn(),
      };

      await TestBed.configureTestingModule({
        imports: [ChildForm],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
          { provide: NotificationService, useValue: mockNotificationService },
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

  describe('DOM Rendering', () => {
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
          createUrlTree: vi.fn(),
          serializeUrl: vi.fn(() => ''),
          events: of(),
        } as any;

        const mockNotificationService = {
          getPreferences: vi.fn(),
          updatePreference: vi.fn(),
        };

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
            { provide: NotificationService, useValue: mockNotificationService },
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

      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should render "Add New Baby" title in create mode', () => {
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Add New Baby');
      });

      it('should render subtitle for create mode', () => {
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Add your little one to start tracking');
      });

      it('should render error message when error signal is set', () => {
        fixture.detectChanges();
        component.error.set('Something went wrong');
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Something went wrong');
      });

      it('should show name required validation error when touched', () => {
        fixture.detectChanges();
        component.childForm.controls.name.setValue('');
        component.childForm.controls.name.markAsTouched();
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Name is required');
      });

      it('should show name maxlength validation error when touched', () => {
        component.childForm.controls.name.setValue('a'.repeat(101));
        component.childForm.controls.name.markAsTouched();
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Name must be 100 characters or less');
      });

      it('should show date_of_birth validation error when touched', () => {
        fixture.detectChanges();
        component.childForm.controls.date_of_birth.setValue('');
        component.childForm.controls.date_of_birth.markAsTouched();
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Date of birth is required');
      });

      it('should render submit spinner when isSubmitting', () => {
        fixture.detectChanges();
        component.isSubmitting.set(true);
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const spinner = el.querySelector('.animate-spin');
        expect(spinner).toBeTruthy();
        expect(el.textContent).toContain('Saving...');
      });

      it('should render "Add Baby" button text in create mode', () => {
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const submitButton = el.querySelector('button[type="submit"]');
        expect(submitButton?.textContent).toContain('Add Baby');
      });

      it('should disable submit button when form is invalid', () => {
        component.childForm.controls.name.setValue('');
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const submitButton = el.querySelector('button[type="submit"]') as HTMLButtonElement;
        expect(submitButton.disabled).toBe(true);
      });

      it('should not render error message when error is null', () => {
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const errorBanner = el.querySelector('.border-red-500');
        expect(errorBanner).toBeNull();
      });
    });

    describe('Edit Mode', () => {
      beforeEach(async () => {
        const mockChildrenService = {
          get: vi.fn().mockReturnValue(of(mockChild)),
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
          createUrlTree: vi.fn(),
          serializeUrl: vi.fn(() => ''),
          events: of(),
        } as any;

        const mockActivatedRoute = {
          paramMap: of(new Map([['id', '1']])),
          queryParamMap: of(new Map()),
          snapshot: {
            paramMap: {
              get: vi.fn((param: string) => (param === 'id' ? '1' : null)),
            },
          },
        } as any;

        const mockPreference: NotificationPreference = {
          id: 10,
          child_id: 1,
          child_name: 'Baby Alice',
          notify_feedings: true,
          notify_diapers: true,
          notify_naps: false,
        };
        const mockNotificationService = {
          getPreferences: vi.fn().mockReturnValue(of([mockPreference])),
          updatePreference: vi.fn(),
        };

        await TestBed.configureTestingModule({
          imports: [ChildForm],
          providers: [
            { provide: ChildrenService, useValue: mockChildrenService },
            { provide: NotificationService, useValue: mockNotificationService },
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

      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should render "Edit Baby" title in edit mode', () => {
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Edit Baby');
      });

      it('should render subtitle for edit mode', () => {
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain("Update your baby's information");
      });

      it('should render "Update Baby" button text in edit mode', () => {
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const submitButton = el.querySelector('button[type="submit"]');
        expect(submitButton?.textContent).toContain('Update Baby');
      });

      it('should render notification preferences section when preference loaded in edit mode', () => {
        vi.mocked(childrenService.get).mockReturnValue(of(mockChild));
        component.ngOnInit();
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Notification Preferences');
        expect(el.textContent).toContain('Feedings');
        expect(el.textContent).toContain('Diaper changes');
        expect(el.textContent).toContain('Naps');
      });
    });
  });

  describe('Branch coverage - restoreDefaultBottleAmounts', () => {
    it('should clear custom bottle amounts to null', () => {
      component.childForm.patchValue({
        custom_bottle_low_oz: 2,
        custom_bottle_mid_oz: 4,
        custom_bottle_high_oz: 6,
      });

      component.restoreDefaultBottleAmounts();

      expect(component.childForm.get('custom_bottle_low_oz')?.value).toBeNull();
      expect(component.childForm.get('custom_bottle_mid_oz')?.value).toBeNull();
      expect(component.childForm.get('custom_bottle_high_oz')?.value).toBeNull();
    });
  });

  describe('Branch coverage - create mode (no id in route)', () => {
    it('should not be in edit mode when no id in route', async () => {
      const createModeRoute = {
        paramMap: of(new Map()),
        queryParamMap: of(new Map()),
        snapshot: {
          paramMap: {
            get: vi.fn(() => null),
          },
        },
      } as any;

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [ChildForm],
        providers: [
          { provide: ChildrenService, useValue: { get: vi.fn(), create: vi.fn(), update: vi.fn() } },
          { provide: NotificationService, useValue: { getPreferences: vi.fn(), updatePreference: vi.fn() } },
          { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
          { provide: Router, useValue: { navigate: vi.fn(), parseUrl: vi.fn(), createUrlTree: vi.fn(), serializeUrl: vi.fn(() => ''), events: of() } as any },
          { provide: ActivatedRoute, useValue: createModeRoute },
        ],
      }).compileComponents();

      const createFixture = TestBed.createComponent(ChildForm);
      const createComponent = createFixture.componentInstance;
      createFixture.detectChanges();

      expect(createComponent.isEdit()).toBe(false);
    });
  });
});
