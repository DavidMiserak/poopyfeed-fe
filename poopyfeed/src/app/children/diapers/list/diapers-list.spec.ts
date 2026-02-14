import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, Observable } from 'rxjs';
import { DiapersList } from './diapers-list';
import { DiapersService } from '../../../services/diapers.service';
import { ChildrenService } from '../../../services/children.service';
import { FilterService, FilterCriteria } from '../../../services/filter.service';
import { TrackingFilterComponent } from '../../../components/tracking-filter/tracking-filter';
import { DiaperChange } from '../../../models/diaper.model';
import { Child } from '../../../models/child.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('DiapersList - Batch Operations', () => {
  let component: DiapersList;
  let fixture: ComponentFixture<DiapersList>;
  let diapersService: DiapersService;
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

  const mockDiapers: DiaperChange[] = [
    {
      id: 1,
      child: 1,
      change_type: 'wet',
      changed_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      child: 1,
      change_type: 'dirty',
      changed_at: '2024-01-15T14:30:00Z',
      created_at: '2024-01-15T14:30:00Z',
      updated_at: '2024-01-15T14:30:00Z',
    },
    {
      id: 3,
      child: 1,
      change_type: 'both',
      changed_at: '2024-01-15T18:00:00Z',
      created_at: '2024-01-15T18:00:00Z',
      updated_at: '2024-01-15T18:00:00Z',
    },
  ];

  beforeEach(async () => {
    const diapersServiceMock = {
      list: vi.fn().mockReturnValue(of(mockDiapers)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };
    const routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DiapersList],
      providers: [
        { provide: DiapersService, useValue: diapersServiceMock },
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

    diapersService = TestBed.inject(DiapersService);
    childrenService = TestBed.inject(ChildrenService);

    fixture = TestBed.createComponent(DiapersList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with empty selection', () => {
    expect(component.selectedIds()).toEqual([]);
  });

  it('should toggle selection for individual items', () => {
    component.toggleSelection(1);
    expect(component.selectedIds()).toContain(1);

    component.toggleSelection(1);
    expect(component.selectedIds()).not.toContain(1);
  });

  it('should select all diapers', () => {
    component.allDiapers.set(mockDiapers);
    fixture.detectChanges();

    component.toggleSelectAll();

    expect(component.selectedIds()).toEqual([1, 2, 3]);
    expect(component.isAllSelected()).toBeTruthy();
  });

  it('should clear selection', () => {
    component.selectedIds.set([1, 2, 3]);

    component.clearSelection();

    expect(component.selectedIds()).toEqual([]);
    expect(component.hasSelectedItems()).toBeFalsy();
  });

  it('should delete selected diapers', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    (diapersService.delete as any).mockReturnValue(of(void 0));

    component.childId.set(1);
    component.allDiapers.set(mockDiapers);
    component.selectedIds.set([1, 2]);

    component.bulkDelete();

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(diapersService.delete).toHaveBeenCalledWith(1, 1);
    expect(diapersService.delete).toHaveBeenCalledWith(1, 2);
    expect(component.selectedIds()).toEqual([]);
    confirmSpy.mockRestore();
  });

  it('should handle confirmation cancellation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.selectedIds.set([1, 2]);

    component.bulkDelete();

    expect(diapersService.delete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('should filter selection by type', () => {
    component.allDiapers.set(mockDiapers);
    fixture.detectChanges();

    component.filters.set({ type: 'wet' }); // Only id 1 is wet
    fixture.detectChanges();

    component.toggleSelectAll();

    expect(component.selectedIds()).toEqual([1]);
    expect(component.isAllSelected()).toBeTruthy();
  });
});

describe('DiapersList - Comprehensive Tests', () => {
  let component: DiapersList;
  let fixture: ComponentFixture<DiapersList>;
  let diapersService: DiapersService;
  let childrenService: ChildrenService;
  let filterService: FilterService;
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

  const mockDiapers: DiaperChange[] = [
    {
      id: 1,
      child: 1,
      change_type: 'wet',
      changed_at: '2024-02-10T14:00:00Z',
      notes: 'Heavy',
      created_at: '2024-02-10T14:00:00Z',
      updated_at: '2024-02-10T14:00:00Z',
    },
    {
      id: 2,
      child: 1,
      change_type: 'dirty',
      changed_at: '2024-02-10T13:00:00Z',
      notes: undefined,
      created_at: '2024-02-10T13:00:00Z',
      updated_at: '2024-02-10T13:00:00Z',
    },
    {
      id: 3,
      child: 1,
      change_type: 'both',
      changed_at: '2024-02-10T12:00:00Z',
      notes: 'Major blowout',
      created_at: '2024-02-10T12:00:00Z',
      updated_at: '2024-02-10T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    const diapersServiceMock = {
      list: vi.fn().mockReturnValue(of(mockDiapers)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };

    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };

    const routerMock = {
      navigate: vi.fn(),
      routerState: { root: {} },
      parseUrl: vi.fn(),
      events: of(),
    } as any;

    const activatedRouteMock = {
      paramMap: of(new Map([['childId', '1']])),
      queryParamMap: of(new Map()),
      snapshot: {
        paramMap: {
          get: (key: string) => (key === 'childId' ? '1' : null),
        },
      },
    } as any;

    await TestBed.configureTestingModule({
      imports: [DiapersList, TrackingFilterComponent],
      providers: [
        { provide: DiapersService, useValue: diapersServiceMock },
        { provide: ChildrenService, useValue: childrenServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        FilterService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiapersList);
    component = fixture.componentInstance;
    diapersService = TestBed.inject(DiapersService);
    childrenService = TestBed.inject(ChildrenService);
    filterService = TestBed.inject(FilterService);
    router = TestBed.inject(Router);
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

    it('should initialize with empty diapers', () => {
      expect(component.allDiapers()).toEqual([]);
    });

    it('should initialize with isLoading=true', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should initialize with no error', () => {
      expect(component.error()).toBeNull();
    });

    it('should expose changeTypeOptions for filter', () => {
      expect(component.changeTypeOptions).toHaveLength(3);
      expect(component.changeTypeOptions[0].value).toBe('wet');
    });
  });

  describe('Data Loading', () => {
    it('should load child data on ngOnInit', () => {
      component.ngOnInit();

      expect(childrenService.get).toHaveBeenCalledWith(1);
    });

    it('should set childId from route', () => {
      component.ngOnInit();

      expect(component.childId()).toBe(1);
    });

    it('should load diapers after child loads', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(diapersService.list).toHaveBeenCalledWith(1);
    });

    it('should populate child signal', () => {
      component.ngOnInit();

      expect(component.child()).toEqual(mockChild);
    });

    it('should populate allDiapers signal', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.allDiapers()).toEqual(mockDiapers);
    });

    it('should set isLoading=false after load', async () => {
      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.isLoading()).toBe(false);
    });

    it('should handle child loading error', () => {
      const error = new Error('Child not found');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => error));

      component.ngOnInit();

      expect(component.error()).toBe('Child not found');
    });

    it('should handle diaper loading error', async () => {
      const error = new Error('Failed to load');
      vi.mocked(diapersService.list).mockReturnValue(throwError(() => error));

      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.error()).toBe('Failed to load');
    });
  });

  describe('Permissions - canEdit', () => {
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

    it('should be false with no child', () => {
      expect(component.canEdit()).toBe(false);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      component.childId.set(1);
    });

    it('should navigate to create', () => {
      component.navigateToCreate();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'diapers', 'create']);
    });

    it('should navigate to edit', () => {
      component.navigateToEdit(5);

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'diapers', 5, 'edit']);
    });

    it('should navigate to delete', () => {
      component.navigateToDelete(5);

      expect(router.navigate).toHaveBeenCalledWith([
        '/children',
        1,
        'diapers',
        5,
        'delete',
      ]);
    });

    it('should navigate to dashboard', () => {
      component.navigateToDashboard();

      expect(router.navigate).toHaveBeenCalledWith(['/children', 1, 'dashboard']);
    });
  });

  describe('DateTime Formatting', () => {
    it('should format datetime', () => {
      const result = component.formatDateTime('2024-02-10T14:30:00Z');

      expect(typeof result).toBe('string');
      expect(result).toContain('Feb');
    });

    it('should format time ago in minutes', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-10T14:30:00Z'));

      const result = component.formatTimeAgo('2024-02-10T14:15:00Z');

      expect(result).toContain('15 mins ago');
      vi.useRealTimers();
    });

    it('should format time ago in hours', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-10T16:30:00Z'));

      const result = component.formatTimeAgo('2024-02-10T14:30:00Z');

      expect(result).toContain('2 hours ago');
      vi.useRealTimers();
    });

    it('should format time ago in days', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-02-12T14:30:00Z'));

      const result = component.formatTimeAgo('2024-02-10T14:30:00Z');

      expect(result).toContain('2 days ago');
      vi.useRealTimers();
    });
  });

  describe('Diaper Icons and Titles', () => {
    it('should return wet icon', () => {
      expect(component.getDiaperIcon('wet')).toBe('💧');
    });

    it('should return dirty icon', () => {
      expect(component.getDiaperIcon('dirty')).toBe('💩');
    });

    it('should return both icon', () => {
      expect(component.getDiaperIcon('both')).toBe('🧷');
    });

    it('should return wet title', () => {
      expect(component.getDiaperTitle('wet')).toBe('Wet Diaper');
    });

    it('should return dirty title', () => {
      expect(component.getDiaperTitle('dirty')).toBe('Dirty Diaper');
    });

    it('should return both title', () => {
      expect(component.getDiaperTitle('both')).toBe('Wet & Dirty');
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.allDiapers.set(mockDiapers);
      fixture.detectChanges();
    });

    it('should have diapers computed property', () => {
      expect(component.diapers).toBeDefined();
    });

    it('should return all when no filters', () => {
      expect(component.diapers()).toHaveLength(3);
    });

    it('should apply filter criteria', () => {
      const criteria: FilterCriteria = { type: 'wet' };
      vi.spyOn(filterService, 'filter').mockReturnValue([mockDiapers[0]]);

      component.onFilterChange(criteria);

      expect(component.filters()).toEqual(criteria);
    });
  });

  describe('Change Type Handling', () => {
    it('should have wet option', () => {
      const wet = component.changeTypeOptions.find(o => o.value === 'wet');
      expect(wet?.label).toBe('Wet');
    });

    it('should have dirty option', () => {
      const dirty = component.changeTypeOptions.find(o => o.value === 'dirty');
      expect(dirty?.label).toBe('Dirty');
    });

    it('should have both option', () => {
      const both = component.changeTypeOptions.find(o => o.value === 'both');
      expect(both?.label).toBe('Both');
    });
  });

  describe('Empty States', () => {
    it('should handle empty diaper list', () => {
      component.allDiapers.set([]);

      expect(component.diapers()).toEqual([]);
    });

    it('should handle no child', () => {
      expect(component.child()).toBeNull();
      expect(component.canEdit()).toBe(false);
    });

    it('should handle no selections', () => {
      expect(component.hasSelectedItems()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should clear error on retry', () => {
      component.error.set('Previous error');
      vi.mocked(childrenService.get).mockReturnValue(of(mockChild));

      component.loadData(1);

      expect(component.error()).toBeNull();
    });

    it('should set new error on failure', () => {
      const error = new Error('New error');
      vi.mocked(childrenService.get).mockReturnValue(throwError(() => error));

      component.loadData(1);

      expect(component.error()).toBe('New error');
    });

    it('should preserve diapers on error', () => {
      component.allDiapers.set(mockDiapers);
      const error = new Error('Load failed');
      vi.mocked(diapersService.list).mockReturnValue(throwError(() => error));

      component.loadDiapers(1);

      expect(component.allDiapers()).toEqual(mockDiapers);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update childId', () => {
      component.childId.set(5);

      expect(component.childId()).toBe(5);
    });

    it('should update child', () => {
      component.child.set(mockCoParentChild);

      expect(component.child()).toEqual(mockCoParentChild);
    });

    it('should update allDiapers', () => {
      component.allDiapers.set(mockDiapers);

      expect(component.allDiapers()).toHaveLength(3);
    });

    it('should update filters', () => {
      const criteria: FilterCriteria = { type: 'wet' };
      component.filters.set(criteria);

      expect(component.filters()).toEqual(criteria);
    });

    it('should update isLoading', () => {
      component.isLoading.set(false);

      expect(component.isLoading()).toBe(false);
    });

    it('should update error', () => {
      component.error.set('Test error');

      expect(component.error()).toBe('Test error');
    });
  });

  describe('Multiple Change Types', () => {
    it('should handle wet diapers', () => {
      component.allDiapers.set([mockDiapers[0]]);

      expect(component.allDiapers()[0].change_type).toBe('wet');
    });

    it('should handle dirty diapers', () => {
      component.allDiapers.set([mockDiapers[1]]);

      expect(component.allDiapers()[0].change_type).toBe('dirty');
    });

    it('should handle both diapers', () => {
      component.allDiapers.set([mockDiapers[2]]);

      expect(component.allDiapers()[0].change_type).toBe('both');
    });

    it('should handle mixed types', () => {
      component.allDiapers.set(mockDiapers);

      expect(component.allDiapers()).toHaveLength(3);
      expect(component.allDiapers()[0].change_type).toBe('wet');
      expect(component.allDiapers()[1].change_type).toBe('dirty');
      expect(component.allDiapers()[2].change_type).toBe('both');
    });
  });
});

describe('DiapersList - Route and Concurrent Operations', () => {
  let component: DiapersList;
  let fixture: ComponentFixture<DiapersList>;
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
    last_diaper_change: '2024-01-15T14:30:00Z',
    last_nap: '2024-01-15T13:00:00Z',
    last_feeding: '2024-01-15T12:00:00Z',
  };

  const mockDiapers: DiaperChange[] = [
    {
      id: 1,
      child: 1,
      change_type: 'wet',
      changed_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      child: 1,
      change_type: 'dirty',
      changed_at: '2024-01-15T14:30:00Z',
      created_at: '2024-01-15T14:30:00Z',
      updated_at: '2024-01-15T14:30:00Z',
    },
    {
      id: 3,
      child: 1,
      change_type: 'both',
      changed_at: '2024-01-15T18:00:00Z',
      created_at: '2024-01-15T18:00:00Z',
      updated_at: '2024-01-15T18:00:00Z',
    },
  ];

  beforeEach(async () => {
    const diapersServiceMock = {
      list: vi.fn().mockReturnValue(of(mockDiapers)),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };
    const childrenServiceMock = {
      get: vi.fn().mockReturnValue(of(mockChild)),
    };
    const routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DiapersList],
      providers: [
        { provide: DiapersService, useValue: diapersServiceMock },
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

    diapersService = TestBed.inject(DiapersService);
    childrenService = TestBed.inject(ChildrenService);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(DiapersList);
    component = fixture.componentInstance;
    fixture.detectChanges();
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
      component.allDiapers.set(mockDiapers);
      expect(component.allDiapers().length).toBe(3);

      const mockRoute = TestBed.inject(ActivatedRoute);
      const originalGet = mockRoute.snapshot.paramMap.get;
      mockRoute.snapshot.paramMap.get = vi.fn(() => '2');
      vi.mocked(diapersService.list).mockReturnValue(of([]));

      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(component.allDiapers()).toEqual([]);

      mockRoute.snapshot.paramMap.get = originalGet;
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle empty filtered results after selection', () => {
      component.allDiapers.set(mockDiapers);
      component.selectedIds.set([1, 2]);

      component.filters.set({ type: 'dirty' });

      expect(component.selectedIds()).toEqual([1, 2]);
      expect(component.isAllSelected()).toBe(false);
    });
  });
});
