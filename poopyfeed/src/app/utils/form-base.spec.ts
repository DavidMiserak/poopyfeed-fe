import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TrackingFormBase, TrackingService } from './form-base';
import { ChildrenService } from '../services/children.service';
import { DateTimeService } from '../services/datetime.service';
import { ToastService } from '../services/toast.service';
import { Child } from '../models/child.model';
import { Component, inject, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock resource type for testing
interface MockResource {
  id: number;
  name: string;
  timestamp: string;
}

interface MockCreate {
  name: string;
  timestamp: string;
}

// Mock service implementation
class MockTrackingService implements TrackingService<MockResource, MockCreate> {
  get() {
    return of({ id: 1, name: 'Test', timestamp: '2024-01-15T10:00:00Z' });
  }
  create() {
    return of({ id: 1, name: 'Test', timestamp: '2024-01-15T10:00:00Z' });
  }
  update() {
    return of({ id: 1, name: 'Test', timestamp: '2024-01-15T10:00:00Z' });
  }
}

// Concrete test implementation
@Component({
  selector: 'app-test-form',
  template: '',
  standalone: true,
})
class TestForm extends TrackingFormBase<MockResource, MockCreate, MockTrackingService> {
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected service = inject(MockTrackingService);
  protected childrenService = inject(ChildrenService);
  protected datetimeService = inject(DateTimeService);
  protected toast = inject(ToastService);

  protected form = new FormGroup({
    name: new FormControl('', Validators.required),
    timestamp: new FormControl('', Validators.required),
  });

  protected resourceName = 'test';
  protected listRoute = 'test-list';
  protected successMessageCreate = 'Created successfully';
  protected successMessageUpdate = 'Updated successfully';

  // Public accessors for testing
  getForm() {
    return this.form;
  }

  protected setDefaultDateTime() {
    const now = new Date();
    this.form.patchValue({
      timestamp: this.datetimeService.toInputFormat(now),
    });
  }

  protected buildCreateDto(): MockCreate {
    const formValue = this.form.value;
    const timestamp = this.convertLocalToUtc(formValue.timestamp!);
    return {
      name: formValue.name!,
      timestamp,
    };
  }

  protected patchFormWithResource(resource: MockResource) {
    const localDate = this.convertUtcToLocal(resource.timestamp);
    this.form.patchValue({
      name: resource.name,
      timestamp: this.formatForInput(localDate),
    });
  }
}

describe('TrackingFormBase', () => {
  let component: TestForm;
  let fixture: ComponentFixture<TestForm>;
  let router: Router;
  let childrenService: ChildrenService;
  let datetimeService: DateTimeService;
  let toastService: ToastService;
  let mockService: MockTrackingService;

  const mockChild: Child = {
    id: 1,
    name: 'Test Child',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: null,
    last_nap: null,
    last_feeding: null,
  };

  beforeEach(async () => {
    const mockRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => {
            const params: { [key: string]: string } = {
              childId: '1',
            };
            return params[key] || null;
          },
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [TestForm],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: mockRoute,
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
          },
        },
        {
          provide: MockTrackingService,
          useClass: MockTrackingService,
        },
        {
          provide: ChildrenService,
          useValue: {
            get: vi.fn().mockReturnValue(of(mockChild)),
          },
        },
        {
          provide: DateTimeService,
          useClass: DateTimeService,
        },
        {
          provide: ToastService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestForm);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    childrenService = TestBed.inject(ChildrenService);
    datetimeService = TestBed.inject(DateTimeService);
    toastService = TestBed.inject(ToastService);
    mockService = TestBed.inject(MockTrackingService);
  });

  describe('Route Loading', () => {
    it('should load childId from route params', () => {
      component['initializeForm']();
      expect(component.childId()).toBe(1);
    });

    it('should load child from API', () => {
      component['initializeForm']();
      expect(childrenService.get).toHaveBeenCalledWith(1);
      expect(component.child()).toEqual(mockChild);
    });

    it('should set childId signal to null if not in params', () => {
      const mockRoute = TestBed.inject(ActivatedRoute);
      mockRoute.snapshot.paramMap.get = () => null;
      component['initializeForm']();
      expect(component.childId()).toBeNull();
    });
  });

  describe('Create vs Edit Detection', () => {
    it('should detect create mode when resourceId is null', () => {
      component['initializeForm']();
      expect(component.isEdit()).toBe(false);
    });

    it('should detect edit mode when resourceId is set', () => {
      const mockRoute = TestBed.inject(ActivatedRoute);
      mockRoute.snapshot.paramMap.get = (key: string) => {
        const params: { [key: string]: string } = {
          childId: '1',
          id: '99',
        };
        return params[key] || null;
      };
      vi.spyOn(mockService, 'get').mockReturnValue(
        of({ id: 99, name: 'Test', timestamp: '2024-01-15T10:00:00Z' })
      );
      component['initializeForm']();
      expect(component.isEdit()).toBe(true);
      expect(component.resourceId()).toBe(99);
    });
  });

  describe('Default DateTime', () => {
    it('should set default datetime for new records', () => {
      component['initializeForm']();
      const timestampValue = component.getForm().get('timestamp')?.value;
      expect(timestampValue).toBeTruthy();
    });

    it('should not load resource when in create mode', () => {
      vi.spyOn(mockService, 'get');
      component['initializeForm']();
      expect(mockService.get).not.toHaveBeenCalled();
    });
  });

  describe('Resource Loading', () => {
    it('should load resource when resourceId is present', () => {
      const mockRoute = TestBed.inject(ActivatedRoute);
      mockRoute.snapshot.paramMap.get = (key: string) => {
        const params: { [key: string]: string } = {
          childId: '1',
          id: '99',
        };
        return params[key] || null;
      };
      vi.spyOn(mockService, 'get').mockReturnValue(
        of({ id: 99, name: 'Loaded', timestamp: '2024-01-15T14:00:00Z' })
      );
      component['initializeForm']();
      expect(mockService.get).toHaveBeenCalledWith(1, 99);
    });

    it('should patch form with loaded resource data', () => {
      const mockRoute = TestBed.inject(ActivatedRoute);
      mockRoute.snapshot.paramMap.get = (key: string) => {
        const params: { [key: string]: string } = {
          childId: '1',
          id: '99',
        };
        return params[key] || null;
      };
      vi.spyOn(mockService, 'get').mockReturnValue(
        of({ id: 99, name: 'Loaded', timestamp: '2024-01-15T14:00:00Z' })
      );
      component['initializeForm']();
      expect(component.getForm().get('name')?.value).toBe('Loaded');
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component['initializeForm']();
      component.getForm().patchValue({
        name: 'Test Item',
        timestamp: datetimeService.toInputFormat(new Date()),
      });
    });

    it('should not submit invalid form', () => {
      vi.spyOn(mockService, 'create');
      component.getForm().get('name')?.setValue('');
      component.onSubmit();
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('should mark fields as touched on invalid submission', () => {
      component.getForm().get('name')?.setValue('');
      component.onSubmit();
      expect(component.getForm().get('name')?.touched).toBe(true);
    });

    it('should create resource on create submission', () => {
      vi.spyOn(mockService, 'create').mockReturnValue(
        of({ id: 1, name: 'Test Item', timestamp: '2024-01-15T10:00:00Z' })
      );
      component.onSubmit();
      expect(mockService.create).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should update resource on update submission', () => {
      const mockRoute = TestBed.inject(ActivatedRoute);
      mockRoute.snapshot.paramMap.get = (key: string) => {
        const params: { [key: string]: string } = {
          childId: '1',
          id: '99',
        };
        return params[key] || null;
      };
      vi.spyOn(mockService, 'get').mockReturnValue(
        of({ id: 99, name: 'Test', timestamp: '2024-01-15T10:00:00Z' })
      );
      vi.spyOn(mockService, 'update').mockReturnValue(
        of({ id: 99, name: 'Updated', timestamp: '2024-01-15T10:00:00Z' })
      );
      component['initializeForm']();
      component.getForm().patchValue({
        name: 'Updated',
      });
      component.onSubmit();
      expect(mockService.update).toHaveBeenCalledWith(1, 99, expect.any(Object));
    });

    it('should show success toast on create', async () => {
      vi.spyOn(mockService, 'create').mockReturnValue(
        of({ id: 1, name: 'Test Item', timestamp: '2024-01-15T10:00:00Z' })
      );
      component.onSubmit();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(toastService.success).toHaveBeenCalledWith('Created successfully');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component['initializeForm']();
    });

    it('should handle error during submission', async () => {
      const error = new Error('Submission failed');
      vi.spyOn(mockService, 'create').mockReturnValue(throwError(() => error));
      component.getForm().patchValue({
        name: 'Test',
        timestamp: datetimeService.toInputFormat(new Date()),
      });
      component.onSubmit();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(toastService.error).toHaveBeenCalledWith('Submission failed');
    });
  });

  describe('Navigation', () => {
    it('should navigate to list on cancel', () => {
      component.childId.set(1);
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'test-list']);
    });
  });
});
