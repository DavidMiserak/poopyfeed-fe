import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FussBusComponent } from './fuss-bus';
import { ChildrenService } from '../../services/children.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Child } from '../../models/child.model';
import type { DashboardSummaryResponse, PatternAlertsResponse, TimelineResponse } from '../../models/analytics.model';

function createActivatedRouteStub(childId: string) {
  return {
    snapshot: { paramMap: { get: (k: string) => (k === 'childId' ? childId : null) } },
  };
}

const mockChild: Child = {
  id: 1,
  name: 'Baby',
  date_of_birth: '2025-09-01',
  gender: 'F',
  user_role: 'owner',
  created_at: '2025-09-01T00:00:00Z',
  updated_at: '2025-09-01T00:00:00Z',
  last_diaper_change: null,
  last_nap: null,
  last_feeding: null,
  custom_bottle_low_oz: null,
  custom_bottle_mid_oz: null,
  custom_bottle_high_oz: null,
  feeding_reminder_interval: null,
};

const mockDashboard = {
  today: {
    child_id: 1,
    period: 'Today',
    feedings: { count: 5, total_oz: 20, bottle: 5, breast: 0 },
    diapers: { count: 6, wet: 4, dirty: 1, both: 1 },
    sleep: { naps: 2, total_minutes: 120, avg_duration: 60 },
    last_updated: '2026-03-01T12:00:00Z',
  },
  weekly: {
    child_id: 1,
    period: 'Last 7 days',
    feedings: { count: 35, total_oz: 280, bottle: 35, breast: 0, avg_duration: 12 },
    diapers: { count: 42, wet: 28, dirty: 7, both: 7 },
    sleep: { naps: 14, total_minutes: 1260, avg_duration: 90 },
    last_updated: '2026-03-01T12:00:00Z',
  },
  unread_count: 0,
} satisfies DashboardSummaryResponse;

const mockPatternAlerts: PatternAlertsResponse = {
  child_id: 1,
  feeding: {
    alert: false,
    message: null,
    avg_interval_minutes: 180,
    minutes_since_last: 60,
    last_fed_at: '2026-03-01T11:00:00Z',
    data_points: 10,
  },
  nap: {
    alert: false,
    message: null,
    avg_wake_window_minutes: 120,
    minutes_awake: 60,
    last_nap_ended_at: '2026-03-01T11:00:00Z',
    data_points: 5,
  },
};

const mockTimeline: TimelineResponse = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

describe('FussBusComponent', () => {
  let component: FussBusComponent;
  let fixture: ComponentFixture<FussBusComponent>;
  let childrenService: { get: ReturnType<typeof vi.fn> };
  let analyticsService: {
    getDashboardSummary: ReturnType<typeof vi.fn>;
    getPatternAlerts: ReturnType<typeof vi.fn>;
    getTimeline: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    childrenService = { get: vi.fn().mockReturnValue(of(mockChild)) };
    analyticsService = {
      getDashboardSummary: vi.fn().mockReturnValue(of(mockDashboard)),
      getPatternAlerts: vi.fn().mockReturnValue(of(mockPatternAlerts)),
      getTimeline: vi.fn().mockReturnValue(of(mockTimeline)),
    };

    await TestBed.configureTestingModule({
      imports: [FussBusComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: createActivatedRouteStub('1') },
        { provide: ChildrenService, useValue: childrenService },
        { provide: AnalyticsService, useValue: analyticsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FussBusComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    fixture.detectChanges();
  });

  it('creates and loads child and checklist data', async () => {
    await fixture.whenStable();
    expect(childrenService.get).toHaveBeenCalledWith(1);
    expect(analyticsService.getDashboardSummary).toHaveBeenCalledWith(1);
    expect(analyticsService.getPatternAlerts).toHaveBeenCalledWith(1);
    expect(analyticsService.getTimeline).toHaveBeenCalledWith(1, 1, 50);
    expect(component.child()).toEqual(mockChild);
    expect(component.currentStep()).toBe(1);
  });

  it('navigates step 1 to 2 when symptom selected and Next', async () => {
    await fixture.whenStable();
    component.onSymptomSelected('crying');
    component.onNext();
    expect(component.currentStep()).toBe(2);
    expect(component.selectedSymptom()).toBe('crying');
  });

  it('preserves manual checklist state on Back from step 3', async () => {
    await fixture.whenStable();
    component.onSymptomSelected('crying');
    component.onNext();
    component.onToggleManual('comfortable_temperature');
    component.onNext();
    expect(component.currentStep()).toBe(3);
    component.onBack();
    expect(component.currentStep()).toBe(2);
    expect(component.manualCheckedIds().has('comfortable_temperature')).toBe(true);
  });

  it('Start Over resets to step 1 and clears selection', async () => {
    await fixture.whenStable();
    component.onSymptomSelected('wont_sleep');
    component.onNext();
    component.onToggleManual('dark_quiet_room');
    component.onNext();
    component.onStartOver();
    expect(component.currentStep()).toBe(1);
    expect(component.selectedSymptom()).toBeNull();
    expect(component.manualCheckedIds().size).toBe(0);
  });
});
