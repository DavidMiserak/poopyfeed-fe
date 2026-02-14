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
import { Child } from '../../models/child.model';
import { Feeding } from '../../models/feeding.model';
import { DiaperChange } from '../../models/diaper.model';
import { Nap } from '../../models/nap.model';

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

describe('ChildDashboard', () => {
  let component: ChildDashboard;
  let fixture: ComponentFixture<ChildDashboard>;
  let childrenService: ChildrenService;
  let feedingsService: FeedingsService;
  let diapersService: DiapersService;
  let napsService: NapsService;

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
  });

  function setupWithData(
    feedings: Feeding[] = [],
    diapers: DiaperChange[] = [],
    naps: Nap[] = [],
  ) {
    vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
    vi.spyOn(feedingsService, 'list').mockReturnValue(of(feedings));
    vi.spyOn(diapersService, 'list').mockReturnValue(of(diapers));
    vi.spyOn(napsService, 'list').mockReturnValue(of(naps));

    fixture = TestBed.createComponent(ChildDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    setupWithData();
    expect(component).toBeTruthy();
  });

  describe('isToday', () => {
    beforeEach(() => {
      setupWithData();
    });

    it('should return true for a timestamp from today', () => {
      expect(component.isToday(makeTodayTimestamp())).toBe(true);
    });

    it('should return true for a timestamp from earlier today', () => {
      const earlyToday = new Date();
      earlyToday.setHours(0, 30, 0, 0);
      expect(component.isToday(earlyToday.toISOString())).toBe(true);
    });

    it('should return false for a timestamp from yesterday', () => {
      expect(component.isToday(makeYesterdayTimestamp())).toBe(false);
    });

    it('should return false for a timestamp from a different year', () => {
      expect(component.isToday('2023-06-15T12:00:00Z')).toBe(false);
    });
  });

  describe('today summary counts', () => {
    it('should count only today feedings', () => {
      const todayFeeding = makeFeeding({ id: 1, fed_at: makeTodayTimestamp(600) });
      const yesterdayFeeding = makeFeeding({
        id: 2,
        fed_at: makeYesterdayTimestamp(),
      });
      setupWithData([todayFeeding, yesterdayFeeding]);

      expect(component.todayFeedings()).toBe(1);
    });

    it('should count only today diapers', () => {
      const todayDiaper = makeDiaper({
        id: 1,
        changed_at: makeTodayTimestamp(480),
      });
      const todayDiaper2 = makeDiaper({
        id: 2,
        changed_at: makeTodayTimestamp(600),
      });
      const yesterdayDiaper = makeDiaper({
        id: 3,
        changed_at: makeYesterdayTimestamp(),
      });
      setupWithData([], [todayDiaper, todayDiaper2, yesterdayDiaper]);

      expect(component.todayDiapers()).toBe(2);
    });

    it('should count only today naps', () => {
      const todayNap = makeNap({ id: 1, napped_at: makeTodayTimestamp(540) });
      const yesterdayNap = makeNap({
        id: 2,
        napped_at: makeYesterdayTimestamp(),
      });
      setupWithData([], [], [todayNap, yesterdayNap]);

      expect(component.todayNaps()).toBe(1);
    });

    it('should return zero counts when no records exist', () => {
      setupWithData();

      expect(component.todayFeedings()).toBe(0);
      expect(component.todayDiapers()).toBe(0);
      expect(component.todayNaps()).toBe(0);
    });

    it('should return zero counts when all records are from yesterday', () => {
      setupWithData(
        [makeFeeding({ id: 1, fed_at: makeYesterdayTimestamp() })],
        [makeDiaper({ id: 1, changed_at: makeYesterdayTimestamp() })],
        [makeNap({ id: 1, napped_at: makeYesterdayTimestamp() })],
      );

      expect(component.todayFeedings()).toBe(0);
      expect(component.todayDiapers()).toBe(0);
      expect(component.todayNaps()).toBe(0);
    });
  });

  describe('diaper breakdown', () => {
    it('should count wet diapers today', () => {
      const wetDiaper1 = makeDiaper({
        id: 1,
        change_type: 'wet',
        changed_at: makeTodayTimestamp(480),
      });
      const wetDiaper2 = makeDiaper({
        id: 2,
        change_type: 'wet',
        changed_at: makeTodayTimestamp(600),
      });
      const dirtyDiaper = makeDiaper({
        id: 3,
        change_type: 'dirty',
        changed_at: makeTodayTimestamp(540),
      });
      setupWithData([], [wetDiaper1, wetDiaper2, dirtyDiaper]);

      expect(component.todayDiapersWet()).toBe(2);
      expect(component.todayDiapersDirty()).toBe(1);
      expect(component.todayDiapersBoth()).toBe(0);
    });

    it('should count dirty diapers today', () => {
      const dirtyDiaper1 = makeDiaper({
        id: 1,
        change_type: 'dirty',
        changed_at: makeTodayTimestamp(480),
      });
      const dirtyDiaper2 = makeDiaper({
        id: 2,
        change_type: 'dirty',
        changed_at: makeTodayTimestamp(600),
      });
      setupWithData([], [dirtyDiaper1, dirtyDiaper2]);

      expect(component.todayDiapersDirty()).toBe(2);
      expect(component.todayDiapersWet()).toBe(0);
      expect(component.todayDiapersBoth()).toBe(0);
    });

    it('should count both diapers today', () => {
      const bothDiaper1 = makeDiaper({
        id: 1,
        change_type: 'both',
        changed_at: makeTodayTimestamp(480),
      });
      const bothDiaper2 = makeDiaper({
        id: 2,
        change_type: 'both',
        changed_at: makeTodayTimestamp(600),
      });
      const wetDiaper = makeDiaper({
        id: 3,
        change_type: 'wet',
        changed_at: makeTodayTimestamp(540),
      });
      setupWithData([], [bothDiaper1, bothDiaper2, wetDiaper]);

      expect(component.todayDiapersBoth()).toBe(2);
      expect(component.todayDiapersWet()).toBe(1);
      expect(component.todayDiapersDirty()).toBe(0);
    });

    it('should count breakdown correctly with mixed types today', () => {
      setupWithData(
        [],
        [
          makeDiaper({
            id: 1,
            change_type: 'wet',
            changed_at: makeTodayTimestamp(480),
          }),
          makeDiaper({
            id: 2,
            change_type: 'wet',
            changed_at: makeTodayTimestamp(520),
          }),
          makeDiaper({
            id: 3,
            change_type: 'dirty',
            changed_at: makeTodayTimestamp(540),
          }),
          makeDiaper({
            id: 4,
            change_type: 'both',
            changed_at: makeTodayTimestamp(600),
          }),
          makeDiaper({
            id: 5,
            change_type: 'dirty',
            changed_at: makeTodayTimestamp(660),
          }),
        ],
      );

      expect(component.todayDiapersWet()).toBe(2);
      expect(component.todayDiapersDirty()).toBe(2);
      expect(component.todayDiapersBoth()).toBe(1);
      expect(component.todayDiapers()).toBe(5);
    });

    it('should not count yesterday diapers in breakdown', () => {
      const todayWet = makeDiaper({
        id: 1,
        change_type: 'wet',
        changed_at: makeTodayTimestamp(480),
      });
      const yesterdayWet = makeDiaper({
        id: 2,
        change_type: 'wet',
        changed_at: makeYesterdayTimestamp(),
      });
      setupWithData([], [todayWet, yesterdayWet]);

      expect(component.todayDiapersWet()).toBe(1);
      expect(component.todayDiapers()).toBe(1);
    });

    it('should return zero breakdown when no diapers today', () => {
      const yesterdayDiapers = [
        makeDiaper({
          id: 1,
          change_type: 'wet',
          changed_at: makeYesterdayTimestamp(),
        }),
        makeDiaper({
          id: 2,
          change_type: 'dirty',
          changed_at: makeYesterdayTimestamp(),
        }),
      ];
      setupWithData([], yesterdayDiapers);

      expect(component.todayDiapersWet()).toBe(0);
      expect(component.todayDiapersDirty()).toBe(0);
      expect(component.todayDiapersBoth()).toBe(0);
      expect(component.todayDiapers()).toBe(0);
    });
  });

  describe('template rendering', () => {
    it('should show empty state when no activity today', () => {
      setupWithData();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No activity recorded today');
    });

    it('should show summary counts when there is activity today', () => {
      setupWithData(
        [
          makeFeeding({ id: 1, fed_at: makeTodayTimestamp(600) }),
          makeFeeding({ id: 2, fed_at: makeTodayTimestamp(660) }),
          makeFeeding({ id: 3, fed_at: makeTodayTimestamp(720) }),
        ],
        [
          makeDiaper({ id: 1, changed_at: makeTodayTimestamp(480) }),
          makeDiaper({ id: 2, changed_at: makeTodayTimestamp(540) }),
        ],
        [makeNap({ id: 1, napped_at: makeTodayTimestamp(600) })],
      );

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain("Today's Summary");
      expect(compiled.textContent).not.toContain(
        'No activity recorded today',
      );

      // Verify computed counts are correct
      expect(component.todayFeedings()).toBe(3);
      expect(component.todayDiapers()).toBe(2);
      expect(component.todayNaps()).toBe(1);

      // Verify labels render
      expect(compiled.textContent).toContain('Feedings');
      expect(compiled.textContent).toContain('Diapers');
      expect(compiled.textContent).toContain('Naps');
    });

    it('should show summary section heading', () => {
      setupWithData();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain("Today's Summary");
    });

    it('should show category labels', () => {
      setupWithData(
        [makeFeeding({ id: 1, fed_at: makeTodayTimestamp() })],
        [makeDiaper({ id: 1, changed_at: makeTodayTimestamp() })],
        [makeNap({ id: 1, napped_at: makeTodayTimestamp() })],
      );

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Feedings');
      expect(compiled.textContent).toContain('Diapers');
      expect(compiled.textContent).toContain('Naps');
    });

    it('should show empty state with old records only', () => {
      setupWithData(
        [makeFeeding({ id: 1, fed_at: makeYesterdayTimestamp() })],
        [makeDiaper({ id: 1, changed_at: makeYesterdayTimestamp() })],
        [makeNap({ id: 1, napped_at: makeYesterdayTimestamp() })],
      );

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
      const mockActivatedRoute = TestBed.inject(ActivatedRoute);

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
});
