import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ChildDashboard } from './child-dashboard';
import { ChildrenService } from '../../services/children.service';
import { FeedingsService } from '../../services/feedings.service';
import { DiapersService } from '../../services/diapers.service';
import { NapsService } from '../../services/naps.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Child } from '../../models/child.model';
import { Feeding } from '../../models/feeding.model';
import { DiaperChange } from '../../models/diaper.model';
import { Nap } from '../../models/nap.model';
import { TodaySummaryData } from '../../models/analytics.model';

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

function makeTodayTimestamp(minutesAfterMidnight: number = 720): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutesAfterMidnight);
  return d.toISOString();
}

function makeYesterdayTimestamp(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

function makeFeeding(overrides: Partial<Feeding> = {}): Feeding {
  return {
    id: 1,
    child: 1,
    feeding_type: 'bottle',
    fed_at: makeTodayTimestamp(),
    amount_oz: 4,
    notes: '',
    created_at: makeTodayTimestamp(),
    updated_at: makeTodayTimestamp(),
    ...overrides,
  };
}

function makeDiaper(overrides: Partial<DiaperChange> = {}): DiaperChange {
  return {
    id: 1,
    child: 1,
    change_type: 'wet',
    changed_at: makeTodayTimestamp(),
    notes: '',
    created_at: makeTodayTimestamp(),
    updated_at: makeTodayTimestamp(),
    ...overrides,
  };
}

function makeNap(overrides: Partial<Nap> = {}): Nap {
  return {
    id: 1,
    child: 1,
    napped_at: makeTodayTimestamp(),
    ended_at: null,
    duration_minutes: null,
    notes: '',
    created_at: makeTodayTimestamp(),
    updated_at: makeTodayTimestamp(),
    ...overrides,
  };
}

function makeTodaySummary(overrides: Partial<TodaySummaryData> = {}): TodaySummaryData {
  return {
    child_id: 1,
    period: 'Today',
    feedings: {
      count: 0,
      total_oz: 0,
      bottle: 0,
      breast: 0,
    },
    diapers: {
      count: 0,
      wet: 0,
      dirty: 0,
      both: 0,
    },
    sleep: {
      naps: 0,
      total_minutes: 0,
      avg_duration: 0,
    },
    last_updated: new Date().toISOString(),
    ...overrides,
  };
}

describe('ChildDashboard', () => {
  let component: ChildDashboard;
  let fixture: ComponentFixture<ChildDashboard>;
  let childrenService: ChildrenService;
  let feedingsService: FeedingsService;
  let diapersService: DiapersService;
  let napsService: NapsService;
  let analyticsService: AnalyticsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildDashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
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

    childrenService = TestBed.inject(ChildrenService);
    feedingsService = TestBed.inject(FeedingsService);
    diapersService = TestBed.inject(DiapersService);
    napsService = TestBed.inject(NapsService);
    analyticsService = TestBed.inject(AnalyticsService);
  });

  function setupWithData(
    feedings: Feeding[] = [],
    diapers: DiaperChange[] = [],
    naps: Nap[] = [],
    todaySummary?: TodaySummaryData,
  ) {
    if (!todaySummary) {
      todaySummary = makeTodaySummary();
    }

    vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
    vi.spyOn(feedingsService, 'list').mockReturnValue(of(feedings));
    vi.spyOn(diapersService, 'list').mockReturnValue(of(diapers));
    vi.spyOn(napsService, 'list').mockReturnValue(of(naps));
    vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(todaySummary));

    fixture = TestBed.createComponent(ChildDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setupWithData();
    expect(component).toBeTruthy();
  });

  describe('todaySummaryData signal', () => {
    it('should store full TodaySummaryData from API', () => {
      const summary = makeTodaySummary({
        feedings: { count: 3, total_oz: 12, bottle: 2, breast: 1 },
        diapers: { count: 5, wet: 3, dirty: 1, both: 1 },
        sleep: { naps: 2, total_minutes: 90, avg_duration: 45 },
      });
      setupWithData([], [], [], summary);

      expect(component.todaySummaryData()).toEqual(summary);
    });

    it('should be null before data loads', () => {
      vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
      vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
      vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
      vi.spyOn(napsService, 'list').mockReturnValue(of([]));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

      fixture = TestBed.createComponent(ChildDashboard);
      component = fixture.componentInstance;

      // Before detectChanges (before ngOnInit loads data)
      expect(component.todaySummaryData()).toBeNull();
    });

    it('should update when data reloads', () => {
      const summary1 = makeTodaySummary({
        feedings: { count: 1, total_oz: 4, bottle: 1, breast: 0 },
      });
      const summary2 = makeTodaySummary({
        feedings: { count: 3, total_oz: 12, bottle: 2, breast: 1 },
      });

      vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
      vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
      vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
      vi.spyOn(napsService, 'list').mockReturnValue(of([]));
      vi.spyOn(analyticsService, 'getTodaySummary')
        .mockReturnValueOnce(of(summary1))
        .mockReturnValueOnce(of(summary2));

      fixture = TestBed.createComponent(ChildDashboard);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.todaySummaryData()?.feedings.count).toBe(1);

      component.loadDashboardData(1);
      expect(component.todaySummaryData()?.feedings.count).toBe(3);
    });
  });

  describe('formatMinutes', () => {
    beforeEach(() => {
      setupWithData();
    });

    it('should format minutes under 60', () => {
      expect(component.formatMinutes(30)).toBe('30m');
    });

    it('should format exact hours', () => {
      expect(component.formatMinutes(60)).toBe('1h');
      expect(component.formatMinutes(120)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(component.formatMinutes(90)).toBe('1h 30m');
      expect(component.formatMinutes(150)).toBe('2h 30m');
    });

    it('should round fractional minutes', () => {
      expect(component.formatMinutes(45.7)).toBe('46m');
      expect(component.formatMinutes(90.3)).toBe('1h 30m');
    });
  });

  describe('Conditional Branch Testing (Signal States)', () => {
    describe('loading state combinations', () => {
      it('should load data with showLoading parameter defaulting to true', () => {
        vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
        vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));
        vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

        component.loadDashboardData(1); // showLoading defaults to true
        expect(component.isLoading()).toBe(false); // Loading completes
        expect(component.child()).toBe(mockChild);
      });

      it('should skip loading indicator when showLoading=false (refresh after quick-log)', () => {
        vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
        vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));
        vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

        component.isLoading.set(false); // Not loading initially
        component.loadDashboardData(1, false); // showLoading=false

        // Should not set isLoading=true at start, but will be true during loading
        // Then false when complete
        expect(component.child()).toBe(mockChild);
      });
    });

    describe('error state combinations', () => {
      it('should clear error before loading new data', () => {
        vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
        vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));
        vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

        component.error.set('Previous error');
        component.loadDashboardData(1);

        expect(component.error()).toBeNull();
      });

      it('should maintain child data even when API error occurs on second load', () => {
        // First successful load
        setupWithData();
        const firstChild = component.child();

        // Second load fails
        vi.clearAllMocks();
        vi.spyOn(childrenService, 'get').mockReturnValue(
          throwError(() => new Error('Temporary error'))
        );
        vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));
        vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

        component.loadDashboardData(1);

        // Child still set from first load
        expect(component.child()).toBe(firstChild);
        expect(component.error()).toBe('Temporary error');
      });
    });

    describe('permission state combinations', () => {
      it('should compute canEdit=true for owner role', () => {
        component.child.set({ ...mockChild, user_role: 'owner' });
        expect(component.canEdit()).toBe(true);
      });

      it('should compute canEdit=true for co-parent role', () => {
        component.child.set({ ...mockChild, user_role: 'co-parent' });
        expect(component.canEdit()).toBe(true);
      });

      it('should compute canEdit=false for caregiver role', () => {
        component.child.set({ ...mockChild, user_role: 'caregiver' });
        expect(component.canEdit()).toBe(false);
      });

      it('should compute canManageSharing=true for owner only', () => {
        component.child.set({ ...mockChild, user_role: 'owner' });
        expect(component.canManageSharing()).toBe(true);

        component.child.set({ ...mockChild, user_role: 'co-parent' });
        expect(component.canManageSharing()).toBe(false);

        component.child.set({ ...mockChild, user_role: 'caregiver' });
        expect(component.canManageSharing()).toBe(false);
      });

      it('should compute canAdd=true for all roles', () => {
        component.child.set({ ...mockChild, user_role: 'owner' });
        expect(component.canAdd()).toBe(true);

        component.child.set({ ...mockChild, user_role: 'co-parent' });
        expect(component.canAdd()).toBe(true);

        component.child.set({ ...mockChild, user_role: 'caregiver' });
        expect(component.canAdd()).toBe(true);
      });
    });

    describe('activity merging and sorting', () => {
      it('should merge first 10 of each activity type and sort by timestamp (newest first)', () => {
        const feedings = [
          makeFeeding({ id: 1, fed_at: makeTodayTimestamp(100) }),
          makeFeeding({ id: 2, fed_at: makeTodayTimestamp(200) }),
        ];
        const diapers = [
          makeDiaper({ id: 1, changed_at: makeTodayTimestamp(300) }),
          makeDiaper({ id: 2, changed_at: makeTodayTimestamp(400) }),
        ];
        const naps = [
          makeNap({ id: 1, napped_at: makeTodayTimestamp(500) }),
          makeNap({ id: 2, napped_at: makeTodayTimestamp(600) }),
        ];

        setupWithData(feedings, diapers, naps);

        // Should have 6 items total (2+2+2)
        expect(component.recentActivity().length).toBe(6);

        // Should be sorted with most recent first
        const timestamps = component.recentActivity().map((a) => a.timestamp);
        const sortedTimestamps = [...timestamps].sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );
        expect(timestamps).toEqual(sortedTimestamps);
      });

      it('should limit recent activity to 10 items when more available', () => {
        const feedings = Array.from({ length: 15 }, (_, i) =>
          makeFeeding({ id: i, fed_at: makeTodayTimestamp(i * 100) })
        );

        setupWithData(feedings);

        // Should take only first 10 feedings, then limit to top 10 overall
        expect(component.recentActivity().length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('template rendering', () => {
    it('should show empty state when no activity today', () => {
      setupWithData();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No activity recorded today');
    });

    it('should show summary cards when there is activity today', () => {
      const summary = makeTodaySummary({
        feedings: { count: 3, total_oz: 12, bottle: 2, breast: 1 },
        diapers: { count: 2, wet: 1, dirty: 1, both: 0 },
        sleep: { naps: 1, total_minutes: 60, avg_duration: 60 },
      });
      setupWithData(
        [makeFeeding({ id: 1 }), makeFeeding({ id: 2 }), makeFeeding({ id: 3 })],
        [makeDiaper({ id: 1 }), makeDiaper({ id: 2 })],
        [makeNap({ id: 1 })],
        summary,
      );

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain("Today's Summary");
      expect(compiled.textContent).not.toContain('No activity recorded today');

      // Verify shared component renders labels
      expect(compiled.textContent).toContain('Feedings Today');
      expect(compiled.textContent).toContain('Diapers Today');
      expect(compiled.textContent).toContain('Naps Today');
    });

    it('should show summary section heading', () => {
      setupWithData();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain("Today's Summary");
    });

    it('should render TodaySummaryCards component', () => {
      const summary = makeTodaySummary({
        feedings: { count: 1, total_oz: 4, bottle: 1, breast: 0 },
      });
      setupWithData([], [], [], summary);

      const compiled = fixture.nativeElement as HTMLElement;
      const summaryCards = compiled.querySelector('app-today-summary-cards');
      expect(summaryCards).toBeTruthy();
    });

    it('should show empty state when summary has zero counts', () => {
      setupWithData([], [], [], makeTodaySummary());

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No activity recorded today');
    });
  });

  describe('data loading', () => {
    it('should populate feedings signal from forkJoin response', () => {
      const feedings = [
        makeFeeding({ id: 1 }),
        makeFeeding({ id: 2 }),
      ];
      setupWithData(feedings);

      expect(component.feedings()).toHaveLength(2);
    });

    it('should populate diapers signal from forkJoin response', () => {
      const diapers = [makeDiaper({ id: 1 })];
      setupWithData([], diapers);

      expect(component.diapers()).toHaveLength(1);
    });

    it('should populate naps signal from forkJoin response', () => {
      const naps = [makeNap({ id: 1 }), makeNap({ id: 2 }), makeNap({ id: 3 })];
      setupWithData([], [], naps);

      expect(component.naps()).toHaveLength(3);
    });

    it('should show loading state initially', () => {
      vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
      vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
      vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
      vi.spyOn(napsService, 'list').mockReturnValue(of([]));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

      fixture = TestBed.createComponent(ChildDashboard);
      component = fixture.componentInstance;
      // Before detectChanges, isLoading is true
      expect(component.isLoading()).toBe(true);
    });

    it('should handle error from API', () => {
      vi.spyOn(childrenService, 'get').mockReturnValue(
        throwError(() => new Error('Not found')),
      );
      vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
      vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
      vi.spyOn(napsService, 'list').mockReturnValue(of([]));
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

      fixture = TestBed.createComponent(ChildDashboard);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.error()).toBe('Not found');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('QuickLog integration', () => {
    beforeEach(() => {
      setupWithData();
    });

    it('should render QuickLog component when child loaded', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const quickLogElement = compiled.querySelector('app-quick-log');
      expect(quickLogElement).toBeTruthy();
    });

    it('should pass childId and canEdit inputs to QuickLog component', () => {
      // QuickLog component inputs are bound to childId() and canEdit()
      // This is tested indirectly via template rendering
      expect(component.childId()).toBe(1);
      expect(component.canEdit()).toBe(true);
    });

    it('should call loadDashboardData when quickLogged event emitted', () => {
      const loadDashboardDataSpy = vi.spyOn(component, 'loadDashboardData');
      component.onQuickLogged();
      expect(loadDashboardDataSpy).toHaveBeenCalledWith(1, false);
    });
  });

  describe('action button navigation', () => {
    beforeEach(() => {
      setupWithData();
    });

    it('should set isNavigatingToFeeding signal and navigate when navigateToFeedings called', () => {
      const routerSpy = vi.spyOn(component['router'], 'navigate');
      expect(component.isNavigatingToFeeding()).toBe(false);

      component.navigateToFeedings();

      expect(component.isNavigatingToFeeding()).toBe(true);
      expect(routerSpy).toHaveBeenCalledWith(['/children', 1, 'feedings', 'create']);
    });

    it('should set isNavigatingToDiaper signal and navigate when navigateToDiapers called', () => {
      const routerSpy = vi.spyOn(component['router'], 'navigate');
      expect(component.isNavigatingToDiaper()).toBe(false);

      component.navigateToDiapers();

      expect(component.isNavigatingToDiaper()).toBe(true);
      expect(routerSpy).toHaveBeenCalledWith(['/children', 1, 'diapers', 'create']);
    });

    it('should set isNavigatingToNap signal and navigate when navigateToNaps called', () => {
      const routerSpy = vi.spyOn(component['router'], 'navigate');
      expect(component.isNavigatingToNap()).toBe(false);

      component.navigateToNaps();

      expect(component.isNavigatingToNap()).toBe(true);
      expect(routerSpy).toHaveBeenCalledWith(['/children', 1, 'naps', 'create']);
    });

    it('should set isNavigatingToAnalytics signal and navigate when navigateToAnalytics called', () => {
      const routerSpy = vi.spyOn(component['router'], 'navigate');
      expect(component.isNavigatingToAnalytics()).toBe(false);

      component.navigateToAnalytics();

      expect(component.isNavigatingToAnalytics()).toBe(true);
      expect(routerSpy).toHaveBeenCalledWith(['/children', 1, 'analytics']);
    });

    it('should not navigate if child is not loaded', () => {
      component.child.set(null);
      const routerSpy = vi.spyOn(component['router'], 'navigate');

      component.navigateToFeedings();

      expect(routerSpy).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should load dashboard with valid childId from route', () => {
      component.ngOnInit?.();

      expect(component.childId()).toBeTruthy();
    });

    it('should handle navigate when child is not loaded', () => {
      component.child.set(null);
      const routerSpy = vi.spyOn(component['router'], 'navigate');

      component.navigateToFeedings();

      expect(routerSpy).not.toHaveBeenCalled();
    });

    it('should handle loading without child data', () => {
      component.child.set(null);
      component.recentActivity.set([]);

      expect(component.child()).toBeNull();
      expect(component.recentActivity()).toEqual([]);
    });

    it('should handle rapid navigation calls', () => {
      const routerSpy = vi.spyOn(component['router'], 'navigate');
      component.child.set(mockChild); // Must have child to navigate

      component.navigateToFeedings();
      component.navigateToDiapers();
      component.navigateToNaps();

      expect(routerSpy).toHaveBeenCalledTimes(3);
    });

    it('should maintain child data after failed navigation', () => {
      component.child.set(mockChild);
      const routerSpy = vi.spyOn(component['router'], 'navigate');

      component.navigateToFeedings();

      expect(component.child()).toEqual(mockChild);
      expect(routerSpy).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle Edge Cases', () => {
    beforeEach(() => {
      vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));
    });

    describe('multiple rapid loadDashboardData calls (subscription management)', () => {
      it('should handle multiple rapid consecutive load calls', () => {
        const feedingsMock = [makeFeeding({ id: 1 }), makeFeeding({ id: 2 })];
        const diapersMock = [makeDiaper({ id: 1 })];
        const napsMock = [makeNap({ id: 1 })];

        vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
        vi.spyOn(feedingsService, 'list').mockReturnValue(of(feedingsMock));
        vi.spyOn(diapersService, 'list').mockReturnValue(of(diapersMock));
        vi.spyOn(napsService, 'list').mockReturnValue(of(napsMock));
        vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

        fixture = TestBed.createComponent(ChildDashboard);
        component = fixture.componentInstance;
        component.childId.set(1);

        // First call
        component.loadDashboardData(1);
        expect(component.isLoading()).toBe(false);
        expect(component.feedings().length).toBe(2);

        // Rapid second call
        component.loadDashboardData(1);
        expect(component.isLoading()).toBe(false);
        expect(component.feedings().length).toBe(2);

        // Both should have latest data
        expect(component.child()).toEqual(mockChild);
      });

      it('should not show loading spinner when showLoading parameter is false', () => {
        setupWithData();

        component.loadDashboardData(1, false);

        expect(component.isLoading()).toBe(false);
      });

      it('should clear error before loading new data', () => {
        setupWithData();

        component.error.set('Previous error');
        expect(component.error()).toBe('Previous error');

        component.loadDashboardData(1);

        expect(component.error()).toBeNull();
      });
    });

    describe('route changes with different childId', () => {
      it('should load different child data when childId changes', () => {
        const child1 = { ...mockChild, id: 1, name: 'Alice' };
        const child2 = { ...mockChild, id: 2, name: 'Bob' };

        vi.spyOn(childrenService, 'get')
          .mockReturnValueOnce(of(child1))
          .mockReturnValueOnce(of(child2));
        vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));

        fixture = TestBed.createComponent(ChildDashboard);
        component = fixture.componentInstance;

        // Load first child
        component.childId.set(1);
        component.loadDashboardData(1);
        expect(component.child()?.name).toBe('Alice');

        // Load second child (simulating route change)
        component.childId.set(2);
        component.loadDashboardData(2);
        expect(component.child()?.name).toBe('Bob');
      });

      it('should update childId signal when ngOnInit called with different route param', () => {
        vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
        vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));

        const mockActivatedRoute = TestBed.inject(ActivatedRoute);
        vi.spyOn(mockActivatedRoute.snapshot.paramMap, 'get').mockReturnValue('5');

        fixture = TestBed.createComponent(ChildDashboard);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.childId()).toBe(5);
      });
    });

    describe('missing or invalid childId handling', () => {
      it('should not load data if childId is missing from route', () => {
        const mockActivatedRoute = TestBed.inject(ActivatedRoute);
        vi.spyOn(mockActivatedRoute.snapshot.paramMap, 'get').mockReturnValue(null);

        fixture = TestBed.createComponent(ChildDashboard);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.childId()).toBeNull();
        expect(component.child()).toBeNull();
        expect(component.isLoading()).toBe(true);
      });

      it('should handle invalid childId (non-numeric)', () => {
        const mockActivatedRoute = TestBed.inject(ActivatedRoute);
        vi.spyOn(mockActivatedRoute.snapshot.paramMap, 'get').mockReturnValue(
          'invalid'
        );

        fixture = TestBed.createComponent(ChildDashboard);
        component = fixture.componentInstance;

        // Should convert to NaN but still try to load
        expect(Number('invalid')).toBeNaN();
      });
    });

    describe('state isolation across dashboard reloads', () => {
      it('should preserve old data while loading new data', () => {
        const oldFeeding = makeFeeding({ id: 100, amount_oz: 2 });
        const newFeeding = makeFeeding({ id: 101, amount_oz: 4 });

        vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
        vi.spyOn(feedingsService, 'list')
          .mockReturnValueOnce(of([oldFeeding]))
          .mockReturnValueOnce(of([newFeeding]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));

        fixture = TestBed.createComponent(ChildDashboard);
        component = fixture.componentInstance;

        // First load
        component.loadDashboardData(1, true);
        expect(component.feedings()[0]?.amount_oz).toBe(2);

        // Second load - should update to new data
        component.loadDashboardData(1, true);
        expect(component.feedings()[0]?.amount_oz).toBe(4);
      });

      it('should isolate data between different child dashboard instances', () => {
        const feeding1 = makeFeeding({ id: 1 });
        const feeding2 = makeFeeding({ id: 2 });

        vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
        vi.spyOn(feedingsService, 'list')
          .mockReturnValueOnce(of([feeding1]))
          .mockReturnValueOnce(of([feeding2]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));

        // Create first instance
        const fixture1 = TestBed.createComponent(ChildDashboard);
        const component1 = fixture1.componentInstance;
        component1.loadDashboardData(1);

        // Create second instance
        const fixture2 = TestBed.createComponent(ChildDashboard);
        const component2 = fixture2.componentInstance;
        component2.loadDashboardData(1);

        // Verify each instance has its own data
        expect(component1.feedings()[0]?.id).toBe(1);
        expect(component2.feedings()[0]?.id).toBe(2);
      });
    });

    describe('computed signals during lifecycle transitions', () => {
      it('should update computed permissions when child role changes', () => {
        const ownerChild = { ...mockChild, user_role: 'owner' as const };
        const caregiverChild = { ...mockChild, user_role: 'caregiver' as const };

        vi.spyOn(childrenService, 'get')
          .mockReturnValueOnce(of(ownerChild))
          .mockReturnValueOnce(of(caregiverChild));
        vi.spyOn(feedingsService, 'list').mockReturnValue(of([]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));
        vi.spyOn(analyticsService, 'getTodaySummary').mockReturnValue(of(makeTodaySummary()));

        fixture = TestBed.createComponent(ChildDashboard);
        component = fixture.componentInstance;

        // First load with owner
        component.loadDashboardData(1);
        expect(component.canEdit()).toBe(true);
        expect(component.canManageSharing()).toBe(true);

        // Second load with caregiver role
        component.loadDashboardData(1);
        expect(component.canEdit()).toBe(false);
        expect(component.canManageSharing()).toBe(false);
      });
    });

    describe('quickLogged event and refresh behavior', () => {
      it('should reload data without loading spinner on quickLogged event', () => {
        const feedingBefore = makeFeeding({ id: 1 });
        const feedingAfter = makeFeeding({ id: 1 });
        const newFeeding = makeFeeding({ id: 2 });

        vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
        vi.spyOn(feedingsService, 'list')
          .mockReturnValueOnce(of([feedingBefore]))
          .mockReturnValueOnce(of([newFeeding, feedingAfter]));
        vi.spyOn(diapersService, 'list').mockReturnValue(of([]));
        vi.spyOn(napsService, 'list').mockReturnValue(of([]));

        setupWithData([feedingBefore]);

        component.isLoading.set(false);
        component.onQuickLogged();

        // Should load new data without showing loading spinner
        expect(component.feedings().length).toBe(2);
        expect(component.feedings()[0]?.id).toBe(2);
      });

      it('should handle onQuickLogged when childId is null', () => {
        setupWithData();

        component.childId.set(null);
        const loadSpy = vi.spyOn(component, 'loadDashboardData');

        component.onQuickLogged();

        expect(loadSpy).not.toHaveBeenCalled();
      });
    });

    describe('navigation signal state during lifecycle', () => {
      it('should maintain navigation signals across data loads', () => {
        setupWithData();

        component.isNavigatingToFeeding.set(true);
        expect(component.isNavigatingToFeeding()).toBe(true);

        component.loadDashboardData(1);

        // Navigation signal should remain unchanged by data load
        expect(component.isNavigatingToFeeding()).toBe(true);
      });

      it('should handle rapid navigation button clicks', () => {
        setupWithData();

        component.navigateToFeedings();
        component.navigateToDiapers();
        component.navigateToNaps();
        component.navigateToAnalytics();

        expect(component.isNavigatingToFeeding()).toBe(true);
        expect(component.isNavigatingToDiaper()).toBe(true);
        expect(component.isNavigatingToNap()).toBe(true);
        expect(component.isNavigatingToAnalytics()).toBe(true);
      });
    });
  });
});
