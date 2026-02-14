import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NapDelete } from './nap-delete';
import { NapsService } from '../../../services/naps.service';
import { ChildrenService } from '../../../services/children.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { Nap } from '../../../models/nap.model';
import { Child } from '../../../models/child.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('NapDelete', () => {
  let component: NapDelete;
  let fixture: ComponentFixture<NapDelete>;
  let napsService: NapsService;
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

  const mockNap: Nap = {
    id: 1,
    child: 1,
    napped_at: '2024-02-10T10:00:00Z',
    ended_at: '2024-02-10T10:30:00Z',
    duration_minutes: 30,
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z',
  };

  const mockOngoingNap: Nap = {
    id: 2,
    child: 1,
    napped_at: '2024-02-10T14:00:00Z',
    ended_at: null,
    duration_minutes: null,
    created_at: '2024-02-10T14:00:00Z',
    updated_at: '2024-02-10T14:00:00Z',
  };

  beforeEach(async () => {
    const napsServiceMock = {
      get: vi.fn().mockReturnValue(of(mockNap)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
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
      imports: [NapDelete],
      providers: [
        { provide: NapsService, useValue: napsServiceMock },
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'childId') return '1';
                  if (key === 'id') return '1';
                  return null;
                },
              },
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    napsService = TestBed.inject(NapsService);
    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(NapDelete);
    component = fixture.componentInstance;
    // Don't call detectChanges here to avoid RouterLink initialization
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with null childId', () => {
      expect(component.childId()).toBeNull();
    });

    it('should initialize with null child', () => {
      expect(component.child()).toBeNull();
    });

    it('should initialize with null nap', () => {
      expect(component.nap()).toBeNull();
    });

    it('should initialize with isDeleting=false', () => {
      expect(component.isDeleting()).toBe(false);
    });

    it('should initialize with no error', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should load child and nap on init', () => {
      component.ngOnInit();

      expect(childrenService.get).toHaveBeenCalledWith(1);
      expect(napsService.get).toHaveBeenCalledWith(1, 1);
    });

    it('should set childId from route', () => {
      component.ngOnInit();

      expect(component.childId()).toBe(1);
    });

    it('should populate child after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.child()).toEqual(mockChild);
    });

    it('should populate nap after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.nap()).toEqual(mockNap);
    });


    it('should handle child load error', () => {
      const error = new Error('Failed to load child');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => error));

      component.loadData(1, 1);

      expect(component.error()).toBe('Failed to load child');
    });

    it('should handle nap load error', () => {
      const error = new Error('Failed to load nap');
      vi.mocked(napsService.get).mockReturnValue(throwError(() => error));

      component.loadData(1, 1);

      expect(component.error()).toBe('Failed to load nap');
    });
  });

  describe('Confirm Delete', () => {
    it('should delete nap on confirmation', () => {
      component.childId.set(1);
      component.nap.set(mockNap);
      vi.mocked(napsService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();

      expect(napsService.delete).toHaveBeenCalledWith(1, 1);
    });

    it('should set isDeleting=false after successful deletion', async () => {
      component.childId.set(1);
      component.nap.set(mockNap);
      vi.mocked(napsService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isDeleting()).toBe(false);
    });

    it('should navigate to naps list on successful deletion', async () => {
      component.childId.set(1);
      component.nap.set(mockNap);
      vi.mocked(napsService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'naps']);
    });

    it('should clear error on successful deletion', async () => {
      component.error.set('Previous error');
      component.childId.set(1);
      component.nap.set(mockNap);
      vi.mocked(napsService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBeNull();
    });

    it('should not delete if childId is null', () => {
      component.childId.set(null);
      component.nap.set(mockNap);

      component.onConfirmDelete();

      expect(napsService.delete).not.toHaveBeenCalled();
    });

    it('should not delete if nap is null', () => {
      component.childId.set(1);
      component.nap.set(null);

      component.onConfirmDelete();

      expect(napsService.delete).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      const deleteError = new Error('Delete failed');
      component.childId.set(1);
      component.nap.set(mockNap);
      vi.mocked(napsService.delete).mockReturnValue(throwError(() => deleteError));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBe('Delete failed');
      expect(component.isDeleting()).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Cancel', () => {
    it('should navigate to naps list on cancel', () => {
      component.childId.set(1);

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'naps']);
    });

    it('should not call delete service on cancel', () => {
      component.childId.set(1);
      component.nap.set(mockNap);

      component.onCancel();

      expect(napsService.delete).not.toHaveBeenCalled();
    });

    it('should not navigate if childId is null', () => {
      component.childId.set(null);

      component.onCancel();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('DateTime Formatting', () => {
    it('should format datetime with locale string', () => {
      const formatted = component.formatDateTime('2024-02-10T14:30:00Z');

      expect(formatted).toContain('Feb');
      expect(formatted).toContain('10');
      expect(formatted).toContain('2024');
    });

    it('should format nap with duration', () => {
      component.nap.set(mockNap);

      const nap = component.nap();
      expect(nap?.duration_minutes).toBe(30);
    });

    it('should handle ongoing nap without ended_at', () => {
      component.nap.set(mockOngoingNap);

      const nap = component.nap();
      expect(nap?.ended_at).toBeNull();
      expect(nap?.duration_minutes).toBeNull();
    });
  });

  describe('Signal Reactivity', () => {
    it('should update childId reactively', () => {
      component.childId.set(5);

      expect(component.childId()).toBe(5);
    });

    it('should update child reactively', () => {
      component.child.set(mockChild);

      expect(component.child()).toEqual(mockChild);
    });

    it('should update nap reactively', () => {
      component.nap.set(mockNap);

      expect(component.nap()).toEqual(mockNap);
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

      component.loadData(1, 1);

      expect(component.error()).toBe('Network error');
    });

    it('should handle 404 error on load', () => {
      const notFoundError = new Error('Nap not found');
      vi.mocked(napsService.get).mockReturnValue(throwError(() => notFoundError));

      component.loadData(1, 999);

      expect(component.error()).toBe('Nap not found');
    });

    it('should handle 401 unauthorized error', () => {
      const unauthorizedError = new Error('Your session has expired');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => unauthorizedError));

      component.loadData(1, 1);

      expect(component.error()).toBe('Your session has expired');
    });
  });

  describe('Edge Cases', () => {
    it('should handle completed nap with duration', () => {
      component.nap.set(mockNap);

      const nap = component.nap();
      expect(nap?.duration_minutes).toBe(30);
      expect(nap?.ended_at).not.toBeNull();
    });

    it('should handle ongoing nap without duration', () => {
      component.nap.set(mockOngoingNap);

      const nap = component.nap();
      expect(nap?.duration_minutes).toBeNull();
      expect(nap?.ended_at).toBeNull();
    });
  });
});
