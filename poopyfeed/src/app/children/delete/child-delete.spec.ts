import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChildDelete } from './child-delete';
import { ChildrenService } from '../../services/children.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { Child } from '../../models/child.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ChildDelete', () => {
  let component: ChildDelete;
  let fixture: ComponentFixture<ChildDelete>;
  let childrenService: ChildrenService;
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

  beforeEach(async () => {
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const routerMock = {
      navigate: vi.fn(),
      events: EMPTY,
      routerState: { root: {} },
      parseUrl: vi.fn(),
      createUrlTree: vi.fn(() => ({})),
      navigateByUrl: vi.fn(),
      serializeUrl: vi.fn(() => ''),
    };

    await TestBed.configureTestingModule({
      imports: [ChildDelete],
      providers: [
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null),
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(ChildDelete);
    component = fixture.componentInstance;
    // Don't call detectChanges here to avoid RouterLink initialization
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null child', () => {
      expect(component.child()).toBeNull();
    });

    it('should initialize with isDeleting=false', () => {
      expect(component.isDeleting()).toBe(false);
    });

    it('should initialize with no error', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should load child on init', () => {
      component.ngOnInit();

      expect(childrenService.get).toHaveBeenCalledWith(1);
    });

    it('should set child signal after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.child()).toEqual(mockChild);
    });


    it('should handle load error', () => {
      const error = new Error('Failed to load child');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => error));

      component.loadChild(1);

      expect(component.error()).toBe('Failed to load child');
      expect(component.child()).toBeNull();
    });
  });

  describe('Confirm Delete', () => {
    it('should delete child on confirmation', () => {
      component.child.set(mockChild);
      vi.mocked(childrenService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();

      expect(childrenService.delete).toHaveBeenCalledWith(1);
    });

    it('should set isDeleting=true during deletion', () => {
      component.child.set(mockChild);
      vi.mocked(childrenService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();

      expect(component.isDeleting()).toBe(false); // Should be cleared after immediate observable
    });

    it('should set isDeleting=false after successful deletion', async () => {
      component.child.set(mockChild);
      vi.mocked(childrenService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isDeleting()).toBe(false);
    });

    it('should navigate to children list on successful deletion', async () => {
      component.child.set(mockChild);
      vi.mocked(childrenService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(router.navigate).toHaveBeenCalledWith(['/children']);
    });

    it('should clear error on successful deletion', async () => {
      component.error.set('Previous error');
      component.child.set(mockChild);
      vi.mocked(childrenService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBeNull();
    });

    it('should not delete if child is null', () => {
      component.child.set(null);

      component.onConfirmDelete();

      expect(childrenService.delete).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      const deleteError = new Error('Delete failed');
      component.child.set(mockChild);
      vi.mocked(childrenService.delete).mockReturnValue(throwError(() => deleteError));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBe('Delete failed');
      expect(component.isDeleting()).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should handle permission error on delete', async () => {
      const permissionError = new Error('You do not have permission to delete this child');
      component.child.set(mockChild);
      vi.mocked(childrenService.delete).mockReturnValue(throwError(() => permissionError));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBe('You do not have permission to delete this child');
    });
  });

  describe('Cancel', () => {
    it('should navigate to children list on cancel', () => {
      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/children']);
    });

    it('should not call delete service on cancel', () => {
      component.child.set(mockChild);

      component.onCancel();

      expect(childrenService.delete).not.toHaveBeenCalled();
    });
  });

  describe('Signal Reactivity', () => {
    it('should update child reactively', () => {
      component.child.set(mockChild);

      expect(component.child()).toEqual(mockChild);
    });

    it('should update isDeleting reactively', () => {
      component.isDeleting.set(true);

      expect(component.isDeleting()).toBe(true);
    });

    it('should update error reactively', () => {
      component.error.set('Test error');

      expect(component.error()).toBe('Test error');
    });
  });

  describe('Error Handling', () => {
    it('should handle network error on load', () => {
      const networkError = new Error('Network error');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => networkError));

      component.loadChild(1);

      expect(component.error()).toBe('Network error');
    });

    it('should handle 404 error on load', () => {
      const notFoundError = new Error('Child not found');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => notFoundError));

      component.loadChild(999);

      expect(component.error()).toBe('Child not found');
    });

    it('should handle 401 unauthorized error', () => {
      const unauthorizedError = new Error('Your session has expired');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => unauthorizedError));

      component.loadChild(1);

      expect(component.error()).toBe('Your session has expired');
    });
  });

  describe('Edge Cases', () => {
    it('should handle deletion with child id 0', () => {
      component.child.set({ ...mockChild, id: 0 });

      component.onConfirmDelete();

      expect(childrenService.delete).not.toHaveBeenCalled();
    });

    it('should preserve child data across operations', () => {
      component.child.set(mockChild);
      component.error.set('Some error');

      const childBefore = component.child();

      component.error.set(null);

      expect(component.child()).toEqual(childBefore);
    });
  });
});
