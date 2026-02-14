import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NapsList } from './naps-list';
import { NapsService } from '../../../services/naps.service';
import { ChildrenService } from '../../../services/children.service';
import { FilterService, FilterCriteria } from '../../../services/filter.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { Nap } from '../../../models/nap.model';
import { Child } from '../../../models/child.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('NapsList - Batch Operations', () => {
  let component: NapsList;
  let fixture: ComponentFixture<NapsList>;
  let napsService: NapsService;
  let childrenService: ChildrenService;

  const mockChild: Child = {
    id: 1,
    name: 'Baby Alice',
    date_of_birth: '2024-01-15',
    gender: 'F',
    user_role: 'owner',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    last_diaper_change: '2024-01-15T14:30:00Z',
    last_nap: '2024-01-15T13:00:00Z',
    last_feeding: '2024-01-15T12:00:00Z',
  };

  const mockNaps: Nap[] = [
    {
      id: 1,
      child: 1,
      napped_at: '2024-01-15T10:00:00Z',
      ended_at: '2024-01-15T10:30:00Z',
      duration_minutes: 30,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      child: 1,
      napped_at: '2024-01-15T13:00:00Z',
      ended_at: '2024-01-15T14:00:00Z',
      duration_minutes: 60,
      created_at: '2024-01-15T13:00:00Z',
      updated_at: '2024-01-15T13:00:00Z',
    },
    {
      id: 3,
      child: 1,
      napped_at: '2024-01-15T18:00:00Z',
      ended_at: null,
      duration_minutes: null,
      created_at: '2024-01-15T18:00:00Z',
      updated_at: '2024-01-15T18:00:00Z',
    },
  ];

  beforeEach(async () => {
    const napsServiceMock = {
      list: vi.fn().mockReturnValue(of(mockNaps)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };
    const routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NapsList],
      providers: [
        { provide: NapsService, useValue: napsServiceMock },
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        FilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'childId' ? '1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    napsService = TestBed.inject(NapsService);
    childrenService = TestBed.inject(ChildrenService);

    fixture = TestBed.createComponent(NapsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with empty selection', () => {
    expect(component.selectedIds()).toEqual([]);
  });

  it('should have no selected items initially', () => {
    expect(component.hasSelectedItems()).toBeFalsy();
  });

  it('should toggle selection for individual naps', () => {
    component.toggleSelection(1);
    expect(component.selectedIds()).toContain(1);

    component.toggleSelection(1);
    expect(component.selectedIds()).not.toContain(1);
  });

  it('should select all naps', () => {
    component.allNaps.set(mockNaps);
    fixture.detectChanges();

    component.toggleSelectAll();

    expect(component.selectedIds()).toEqual([1, 2, 3]);
    expect(component.isAllSelected()).toBeTruthy();
  });

  it('should deselect all when toggling with all selected', () => {
    component.allNaps.set(mockNaps);
    component.selectedIds.set([1, 2, 3]);
    fixture.detectChanges();

    component.toggleSelectAll();

    expect(component.selectedIds()).toEqual([]);
    expect(component.isAllSelected()).toBeFalsy();
  });

  it('should clear selection', () => {
    component.selectedIds.set([1, 2, 3]);

    component.clearSelection();

    expect(component.selectedIds()).toEqual([]);
    expect(component.hasSelectedItems()).toBeFalsy();
  });

  it('should delete selected naps', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (napsService.delete as any).mockReturnValue(of(void 0));

    component.childId.set(1);
    component.allNaps.set(mockNaps);
    component.selectedIds.set([1, 3]);

    component.bulkDelete();

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(napsService.delete).toHaveBeenCalledWith(1, 1);
    expect(napsService.delete).toHaveBeenCalledWith(1, 3);
    expect(component.selectedIds()).toEqual([]);
    expect(component.allNaps().length).toBe(1);
    confirmSpy.mockRestore();
  });

  it('should not delete if confirmation is cancelled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.selectedIds.set([1, 2]);

    component.bulkDelete();

    expect(napsService.delete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('should manage isBulkDeleting flag correctly', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (napsService.delete as any).mockReturnValue(of(void 0));

    component.childId.set(1);
    component.allNaps.set(mockNaps);
    component.selectedIds.set([1, 2]);

    expect(component.isBulkDeleting()).toBeFalsy();

    component.bulkDelete();

    // Wait for deletion to complete and check flag is cleared
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(component.isBulkDeleting()).toBeFalsy();
    confirmSpy.mockRestore();
  });

  it('should clear isBulkDeleting after deletion completes', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (napsService.delete as any).mockReturnValue(of(void 0));

    component.childId.set(1);
    component.allNaps.set(mockNaps);
    component.selectedIds.set([1, 2]);

    component.bulkDelete();

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(component.isBulkDeleting()).toBeFalsy();
    confirmSpy.mockRestore();
  });

  it('should filter by date range and maintain selection state', () => {
    component.allNaps.set(mockNaps);
    component.selectedIds.set([1, 2, 3]);

    // Apply date filter
    component.filters.set({
      dateFrom: '2024-01-15',
      dateTo: '2024-01-15',
    });
    fixture.detectChanges();

    // Selection should persist even with filters
    expect(component.selectedIds()).toEqual([1, 2, 3]);
  });

  it('should count only filtered items in isAllSelected', () => {
    component.allNaps.set(mockNaps);
    fixture.detectChanges();

    // Apply filter for date range
    component.filters.set({
      dateFrom: '2024-01-15',
      dateTo: '2024-01-15',
    });
    fixture.detectChanges();

    // Select all filtered items
    component.toggleSelectAll();

    // Should be all selected if all filtered items are selected
    expect(component.selectedIds().length).toBeGreaterThan(0);
    expect(component.isAllSelected()).toBeTruthy();
  });
});

describe('NapsList - Core Functionality Tests', () => {
  let component: NapsList;
  let fixture: ComponentFixture<NapsList>;
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

  const mockCoParentChild: Child = {
    ...mockChild,
    id: 2,
    user_role: 'co-parent',
  };

  const mockCaregiverChild: Child = {
    ...mockChild,
    id: 3,
    user_role: 'caregiver',
  };

  const mockNaps: Nap[] = [
    {
      id: 1,
      child: 1,
      napped_at: '2024-02-10T10:00:00Z',
      ended_at: '2024-02-10T10:30:00Z',
      duration_minutes: 30,
      notes: 'Quick nap',
      created_at: '2024-02-10T10:00:00Z',
      updated_at: '2024-02-10T10:00:00Z',
    },
    {
      id: 2,
      child: 1,
      napped_at: '2024-02-10T13:00:00Z',
      ended_at: '2024-02-10T14:00:00Z',
      duration_minutes: 60,
      notes: undefined,
      created_at: '2024-02-10T13:00:00Z',
      updated_at: '2024-02-10T13:00:00Z',
    },
    {
      id: 3,
      child: 1,
      napped_at: '2024-02-10T18:00:00Z',
      ended_at: null,
      duration_minutes: null,
      notes: 'Ongoing',
      created_at: '2024-02-10T18:00:00Z',
      updated_at: '2024-02-10T18:00:00Z',
    },
  ];

  beforeEach(async () => {
    const napsServiceMock = {
      list: vi.fn().mockReturnValue(of(mockNaps)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };

    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };

    const routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NapsList],
      providers: [
        { provide: NapsService, useValue: napsServiceMock },
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        FilterService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'childId' ? '1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    napsService = TestBed.inject(NapsService);
    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(NapsList);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty naps', () => {
      expect(component.allNaps()).toEqual([]);
    });

    it('should initialize with isLoading=true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should initialize empty selection', () => {
      expect(component.selectedIds()).toEqual([]);
    });
  });

  describe('Data Loading', () => {
    it('should load child and naps on init', () => {
      component.ngOnInit();

      expect(childrenService.get).toHaveBeenCalledWith(1);
    });

    it('should populate allNaps after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.allNaps()).toHaveLength(3);
    });

    it('should set isLoading=false after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Permissions', () => {
    it('should allow edit for owner', () => {
      component.child.set(mockChild);

      expect(component.canEdit()).toBe(true);
    });

    it('should allow edit for co-parent', () => {
      component.child.set(mockCoParentChild);

      expect(component.canEdit()).toBe(true);
    });

    it('should deny edit for caregiver', () => {
      component.child.set(mockCaregiverChild);

      expect(component.canEdit()).toBe(false);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.childId.set(1);
    });

    it('should navigate to create', () => {
      component.navigateToCreate();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'naps', 'create']);
    });

    it('should navigate to edit', () => {
      component.navigateToEdit(5);

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'naps', 5, 'edit']);
    });

    it('should navigate to delete', () => {
      component.navigateToDelete(5);

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'naps', 5, 'delete']);
    });

    it('should navigate to dashboard', () => {
      component.navigateToDashboard();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'dashboard']);
    });
  });

  describe('Duration Handling', () => {
    it('should display nap duration', () => {
      component.allNaps.set([mockNaps[0]]);

      expect(component.allNaps()[0].duration_minutes).toBe(30);
    });

    it('should handle ongoing naps', () => {
      component.allNaps.set([mockNaps[2]]);

      expect(component.allNaps()[0].ended_at).toBeNull();
      expect(component.allNaps()[0].duration_minutes).toBeNull();
    });

    it('should handle mixed durations', () => {
      component.allNaps.set(mockNaps);

      expect(component.allNaps()[0].duration_minutes).toBe(30);
      expect(component.allNaps()[1].duration_minutes).toBe(60);
      expect(component.allNaps()[2].duration_minutes).toBeNull();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.allNaps.set(mockNaps);
      fixture.detectChanges();
    });

    it('should have naps computed property', () => {
      expect(component.naps).toBeDefined();
    });

    it('should return all naps when no filters', () => {
      expect(component.naps()).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors', () => {
      const error = new Error('Load failed');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => error));

      component.ngOnInit();

      expect(component.error()).toBe('Load failed');
    });

    it('should clear error on retry', () => {
      component.error.set('Previous error');
      vi.mocked(childrenService.get).mockReturnValue(of(mockChild));

      component.loadData(1);

      expect(component.error()).toBeNull();
    });
  });

  describe('Empty States', () => {
    it('should handle empty nap list', () => {
      component.allNaps.set([]);

      expect(component.naps()).toEqual([]);
    });

    it('should handle no selections', () => {
      expect(component.hasSelectedItems()).toBe(false);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update allNaps reactively', () => {
      component.allNaps.set(mockNaps);

      expect(component.allNaps()).toHaveLength(3);
    });

    it('should update filters reactively', () => {
      component.filters.set({ dateFrom: '2024-02-10' });

      expect(component.filters()).toEqual({ dateFrom: '2024-02-10' });
    });

    it('should update error reactively', () => {
      component.error.set('Test error');

      expect(component.error()).toBe('Test error');
    });
  });

  describe('Duration Formatting Edge Cases', () => {
    it('should format 0 minutes duration', () => {
      expect(component.formatDuration(0)).toBe('0m');
    });

    it('should format 1 minute duration (singular)', () => {
      expect(component.formatDuration(1)).toBe('1m');
    });

    it('should format exactly 60 minutes as hours only', () => {
      expect(component.formatDuration(60)).toBe('1h');
    });

    it('should format 24+ hours correctly', () => {
      expect(component.formatDuration(1500)).toBe('25h');
    });

    it('should handle fractional minutes by rounding', () => {
      expect(component.formatDuration(65.7)).toBe('1h 6m');
    });
  });

  describe('Ongoing Nap Display', () => {
    it('should display empty string for naps with null duration', () => {
      expect(component.formatDuration(null)).toBe('');
    });

    it('should filter ongoing naps correctly with date filters', () => {
      const ongoingNap: Nap = {
        id: 99,
        child: 1,
        napped_at: '2024-02-10T18:00:00Z',
        ended_at: null,
        duration_minutes: null,
        created_at: '2024-02-10T18:00:00Z',
        updated_at: '2024-02-10T18:00:00Z',
      };
      component.allNaps.set([mockNaps[0], ongoingNap]);
      component.filters.set({ dateFrom: '2024-02-10', dateTo: '2024-02-10' });

      expect(component.naps().length).toBeGreaterThan(0);
    });

    it('should allow selection of ongoing naps', () => {
      const ongoingNap: Nap = {
        id: 99,
        child: 1,
        napped_at: '2024-02-10T18:00:00Z',
        ended_at: null,
        duration_minutes: null,
        created_at: '2024-02-10T18:00:00Z',
        updated_at: '2024-02-10T18:00:00Z',
      };
      component.allNaps.set([ongoingNap]);
      component.toggleSelection(ongoingNap.id);

      expect(component.selectedIds()).toContain(ongoingNap.id);
    });
  });

  describe('Route Parameter Changes', () => {
    it('should reload data when childId route parameter changes', async () => {
      component.ngOnInit();
      expect(component.childId()).toBe(1);

      const mockRoute = TestBed.inject(ActivatedRoute);
      const originalGet = mockRoute.snapshot.paramMap.get;
      mockRoute.snapshot.paramMap.get = vi.fn((key: string) =>
        key === 'childId' ? '2' : null
      );
      vi.mocked(childrenService.get).mockReturnValue(
        of({ ...mockChild, id: 2, name: 'Baby Bob' })
      );

      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.childId()).toBe(2);
      expect(component.child()?.id).toBe(2);

      mockRoute.snapshot.paramMap.get = originalGet;
    });

    it('should clear previous data when childId changes', async () => {
      component.allNaps.set(mockNaps);
      expect(component.allNaps().length).toBe(3);

      const mockRoute = TestBed.inject(ActivatedRoute);
      const originalGet = mockRoute.snapshot.paramMap.get;
      mockRoute.snapshot.paramMap.get = vi.fn(() => '2');
      vi.mocked(napsService.list).mockReturnValue(of([]));

      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.allNaps()).toEqual([]);

      mockRoute.snapshot.paramMap.get = originalGet;
    });
  });

  describe('Filter State Transitions', () => {
    it('should maintain filter state during data reload', async () => {
      component.filters.set({ dateFrom: '2024-02-10', dateTo: '2024-02-12' });
      vi.mocked(napsService.list).mockReturnValue(of(mockNaps));

      component.loadData(1);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.filters().dateFrom).toBe('2024-02-10');
    });

    it('should handle concurrent filter change and selection update', () => {
      component.allNaps.set(mockNaps);
      component.filters.set({ dateFrom: '2024-02-10' });
      component.toggleSelection(1);

      expect(component.naps().length).toBeGreaterThan(0);
      expect(component.selectedIds()).toContain(1);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle filter changes during data load', async () => {
      let loadComplete = false;
      vi.mocked(napsService.list).mockImplementation(() => {
        return new Observable(subscriber => {
          setTimeout(() => {
            loadComplete = true;
            subscriber.next(mockNaps);
            subscriber.complete();
          }, 50);
        });
      });

      component.loadData(1);
      component.filters.set({ dateFrom: '2024-02-10' });

      expect(loadComplete).toBe(false);
      expect(component.filters().dateFrom).toBe('2024-02-10');

      await new Promise(resolve => setTimeout(resolve, 60));
      expect(loadComplete).toBe(true);
    });
  });
});
