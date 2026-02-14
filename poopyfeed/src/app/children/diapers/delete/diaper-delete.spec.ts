import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DiaperDelete } from './diaper-delete';
import { DiapersService } from '../../../services/diapers.service';
import { ChildrenService } from '../../../services/children.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';
import { DiaperChange } from '../../../models/diaper.model';
import { Child } from '../../../models/child.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('DiaperDelete', () => {
  let component: DiaperDelete;
  let fixture: ComponentFixture<DiaperDelete>;
  let diapersService: DiapersService;
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

  const mockWetDiaper: DiaperChange = {
    id: 1,
    child: 1,
    changed_at: '2024-02-10T10:00:00Z',
    change_type: 'wet',
    notes: undefined,
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z',
  };

  const mockDirtyDiaper: DiaperChange = {
    id: 2,
    child: 1,
    changed_at: '2024-02-10T14:30:00Z',
    change_type: 'dirty',
    notes: 'Took a while',
    created_at: '2024-02-10T14:30:00Z',
    updated_at: '2024-02-10T14:30:00Z',
  };

  const mockBothDiaper: DiaperChange = {
    id: 3,
    child: 1,
    changed_at: '2024-02-10T18:00:00Z',
    change_type: 'both',
    notes: undefined,
    created_at: '2024-02-10T18:00:00Z',
    updated_at: '2024-02-10T18:00:00Z',
  };

  beforeEach(async () => {
    const diapersServiceMock = {
      get: vi.fn().mockReturnValue(of(mockWetDiaper)),
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
      imports: [DiaperDelete],
      providers: [
        { provide: DiapersService, useValue: diapersServiceMock },
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

    diapersService = TestBed.inject(DiapersService);
    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(DiaperDelete);
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

    it('should initialize with null diaper', () => {
      expect(component.diaper()).toBeNull();
    });

    it('should initialize with isDeleting=false', () => {
      expect(component.isDeleting()).toBe(false);
    });

    it('should initialize with no error', () => {
      expect(component.error()).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('should load child and diaper on init', () => {
      component.ngOnInit();

      expect(childrenService.get).toHaveBeenCalledWith(1);
      expect(diapersService.get).toHaveBeenCalledWith(1, 1);
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

    it('should populate diaper after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.diaper()).toEqual(mockWetDiaper);
    });


    it('should handle child load error', () => {
      const error = new Error('Failed to load child');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => error));

      component.loadData(1, 1);

      expect(component.error()).toBe('Failed to load child');
    });

    it('should handle diaper load error', () => {
      const error = new Error('Failed to load diaper');
      vi.mocked(diapersService.get).mockReturnValue(throwError(() => error));

      component.loadData(1, 1);

      expect(component.error()).toBe('Failed to load diaper');
    });
  });

  describe('Confirm Delete', () => {
    it('should delete diaper on confirmation', () => {
      component.childId.set(1);
      component.diaper.set(mockWetDiaper);
      vi.mocked(diapersService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();

      expect(diapersService.delete).toHaveBeenCalledWith(1, 1);
    });

    it('should set isDeleting=false after successful deletion', async () => {
      component.childId.set(1);
      component.diaper.set(mockWetDiaper);
      vi.mocked(diapersService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isDeleting()).toBe(false);
    });

    it('should navigate to diapers list on successful deletion', async () => {
      component.childId.set(1);
      component.diaper.set(mockWetDiaper);
      vi.mocked(diapersService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'diapers']);
    });

    it('should clear error on successful deletion', async () => {
      component.error.set('Previous error');
      component.childId.set(1);
      component.diaper.set(mockWetDiaper);
      vi.mocked(diapersService.delete).mockReturnValue(of(void 0));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBeNull();
    });

    it('should not delete if childId is null', () => {
      component.childId.set(null);
      component.diaper.set(mockWetDiaper);

      component.onConfirmDelete();

      expect(diapersService.delete).not.toHaveBeenCalled();
    });

    it('should not delete if diaper is null', () => {
      component.childId.set(1);
      component.diaper.set(null);

      component.onConfirmDelete();

      expect(diapersService.delete).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      const deleteError = new Error('Delete failed');
      component.childId.set(1);
      component.diaper.set(mockWetDiaper);
      vi.mocked(diapersService.delete).mockReturnValue(throwError(() => deleteError));

      component.onConfirmDelete();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBe('Delete failed');
      expect(component.isDeleting()).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Cancel', () => {
    it('should navigate to diapers list on cancel', () => {
      component.childId.set(1);

      component.onCancel();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'diapers']);
    });

    it('should not call delete service on cancel', () => {
      component.childId.set(1);
      component.diaper.set(mockWetDiaper);

      component.onCancel();

      expect(diapersService.delete).not.toHaveBeenCalled();
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
  });

  describe('Diaper Icon and Title', () => {
    it('should return wet icon for wet diaper', () => {
      const icon = component.getDiaperIcon('wet');

      expect(icon).toBe('💧');
    });

    it('should return dirty icon for dirty diaper', () => {
      const icon = component.getDiaperIcon('dirty');

      expect(icon).toBe('💩');
    });

    it('should return both icon for both diaper', () => {
      const icon = component.getDiaperIcon('both');

      expect(icon).toBe('🧷');
    });

    it('should return wet title for wet diaper', () => {
      const title = component.getDiaperTitle('wet');

      expect(title).toBe('Wet Diaper');
    });

    it('should return dirty title for dirty diaper', () => {
      const title = component.getDiaperTitle('dirty');

      expect(title).toBe('Dirty Diaper');
    });

    it('should return both title for both diaper', () => {
      const title = component.getDiaperTitle('both');

      expect(title).toBe('Wet & Dirty');
    });

    it('should display icon and title for wet diaper', () => {
      component.diaper.set(mockWetDiaper);

      const icon = component.getDiaperIcon(mockWetDiaper.change_type);
      const title = component.getDiaperTitle(mockWetDiaper.change_type);

      expect(icon).toBe('💧');
      expect(title).toBe('Wet Diaper');
    });

    it('should display icon and title for dirty diaper', () => {
      component.diaper.set(mockDirtyDiaper);

      const icon = component.getDiaperIcon(mockDirtyDiaper.change_type);
      const title = component.getDiaperTitle(mockDirtyDiaper.change_type);

      expect(icon).toBe('💩');
      expect(title).toBe('Dirty Diaper');
    });

    it('should display icon and title for both diaper', () => {
      component.diaper.set(mockBothDiaper);

      const icon = component.getDiaperIcon(mockBothDiaper.change_type);
      const title = component.getDiaperTitle(mockBothDiaper.change_type);

      expect(icon).toBe('🧷');
      expect(title).toBe('Wet & Dirty');
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

    it('should update diaper reactively', () => {
      component.diaper.set(mockWetDiaper);

      expect(component.diaper()).toEqual(mockWetDiaper);
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
      const notFoundError = new Error('Diaper not found');
      vi.mocked(diapersService.get).mockReturnValue(throwError(() => notFoundError));

      component.loadData(1, 999);

      expect(component.error()).toBe('Diaper not found');
    });

    it('should handle 401 unauthorized error', () => {
      const unauthorizedError = new Error('Your session has expired');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => unauthorizedError));

      component.loadData(1, 1);

      expect(component.error()).toBe('Your session has expired');
    });
  });

  describe('Edge Cases', () => {
    it('should handle diaper with notes', () => {
      component.diaper.set(mockDirtyDiaper);

      expect(component.diaper()?.notes).toBe('Took a while');
    });

    it('should handle diaper without notes', () => {
      component.diaper.set(mockWetDiaper);

      expect(component.diaper()?.notes).toBeUndefined();
    });
  });
});
