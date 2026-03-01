import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { PediatricianSummaryComponent } from './pediatrician-summary';
import { ChildrenService } from '../../services/children.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Child } from '../../models/child.model';
import { WeeklySummaryData } from '../../models/analytics.model';

const mockChild: Child = {
  id: 1,
  name: 'Baby Alice',
  date_of_birth: '2024-01-15',
  gender: 'F',
  user_role: 'owner',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  last_diaper_change: null,
  last_nap: null,
  last_feeding: null,
  custom_bottle_low_oz: null,
  custom_bottle_mid_oz: null,
  custom_bottle_high_oz: null,
  feeding_reminder_interval: null,
};

const mockWeeklySummary: WeeklySummaryData = {
  child_id: 1,
  period: 'Last 7 days',
  feedings: {
    count: 35,
    total_oz: 280,
    bottle: 35,
    breast: 0,
    avg_duration: 12.5,
  },
  diapers: {
    count: 42,
    wet: 28,
    dirty: 7,
    both: 7,
  },
  sleep: {
    naps: 14,
    total_minutes: 1260,
    avg_duration: 90,
  },
  last_updated: '2024-01-30T12:00:00Z',
};

function makeEmptyWeeklySummary(): WeeklySummaryData {
  return {
    child_id: 1,
    period: 'Last 7 days',
    feedings: { count: 0, total_oz: 0, bottle: 0, breast: 0, avg_duration: null },
    diapers: { count: 0, wet: 0, dirty: 0, both: 0 },
    sleep: { naps: 0, total_minutes: 0, avg_duration: 0 },
    last_updated: '2024-01-30T12:00:00Z',
  };
}

describe('PediatricianSummaryComponent', () => {
  let component: PediatricianSummaryComponent;
  let fixture: ComponentFixture<PediatricianSummaryComponent>;
  let childrenService: ChildrenService;
  let analyticsService: AnalyticsService;
  let titleService: Title;

  const activatedRouteStub = (childId: string | null) => ({
    snapshot: {
      paramMap: {
        get: (key: string) => (key === 'childId' ? childId : null),
      },
    },
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PediatricianSummaryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: activatedRouteStub('1'),
        },
      ],
    }).compileComponents();

    childrenService = TestBed.inject(ChildrenService);
    analyticsService = TestBed.inject(AnalyticsService);
    titleService = TestBed.inject(Title);

    vi.spyOn(childrenService, 'get').mockReturnValue(of(mockChild));
    vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(mockWeeklySummary));
  });

  it('should create', () => {
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load child and weekly summary and display content', () => {
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(childrenService.get).toHaveBeenCalledWith(1);
    expect(analyticsService.getWeeklySummary).toHaveBeenCalledWith(1);
    expect(component.child()).toEqual(mockChild);
    expect(component.summary()).toEqual(mockWeeklySummary);
    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBeNull();

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Baby Alice');
    expect(compiled.textContent).toContain('Last 7 days');
    expect(compiled.textContent).toContain('35');
    expect(compiled.textContent).toContain('280');
    expect(compiled.textContent).toContain('42');
    expect(compiled.textContent).toContain('14');
    expect(compiled.textContent).toContain('Print');
    // Daily averages for doctor-style "how many per day" answers
    expect(compiled.textContent).toContain('Per day');
    expect(compiled.textContent).toContain('5'); // 35/7 feedings per day
    expect(compiled.textContent).toContain('40'); // 280/7 oz per day
    expect(compiled.textContent).toContain('6'); // 42/7 diaper changes per day
    expect(compiled.textContent).toContain('2'); // 14/7 naps per day
    expect(compiled.textContent).toContain('3h'); // 1260/7 = 180 min sleep per day
  });

  it('should compute daily averages from weekly summary', () => {
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.feedingsPerDay()).toBe(5); // 35/7
    expect(component.ozPerDay()).toBe(40); // 280/7
    expect(component.diapersPerDay()).toBe(6); // 42/7
    expect(component.napsPerDay()).toBe(2); // 14/7
    expect(component.sleepMinutesPerDay()).toBe(180); // 1260/7
  });

  it('should set document title when child loads', () => {
    vi.spyOn(titleService, 'setTitle');
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(titleService.setTitle).toHaveBeenCalledWith('Pediatrician summary – Baby Alice – PoopyFeed');
  });

  it('should show empty state when summary has all zero counts', () => {
    vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(makeEmptyWeeklySummary()));
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isEmpty()).toBe(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No activity in the last 7 days');
    expect(compiled.textContent).toContain('Baby Alice');
  });

  it('should show error state when child fetch fails', () => {
    vi.spyOn(childrenService, 'get').mockReturnValue(throwError(() => new Error('Not found')));
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error()).toBe('Not found');
    expect(component.isLoading()).toBe(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Not found');
    expect(compiled.querySelector('app-error-card')).toBeTruthy();
  });

  it('should show error state and retry button when weekly summary fetch fails', () => {
    vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(
      throwError(() => new Error('Server error'))
    );
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error()).toBe('Server error');
    expect(component.isLoading()).toBe(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Server error');
    expect(compiled.textContent).toContain('Try again');
  });

  it('should retry loading when retry button is clicked', () => {
    vi.spyOn(analyticsService, 'getWeeklySummary')
      .mockReturnValueOnce(throwError(() => new Error('Server error')))
      .mockReturnValueOnce(of(mockWeeklySummary));
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error()).toBe('Server error');
    expect(analyticsService.getWeeklySummary).toHaveBeenCalledTimes(1);

    component.onRetry();
    fixture.detectChanges();

    expect(analyticsService.getWeeklySummary).toHaveBeenCalledTimes(2);
    expect(component.error()).toBeNull();
    expect(component.summary()).toEqual(mockWeeklySummary);
  });

  it('should open print window with summary HTML and call print when Print button is clicked', () => {
    let loadListener: () => void = (): void => {
      return;
    };
    const mockPrint = vi.fn();
    const mockWin = {
      print: mockPrint,
      close: vi.fn(),
      focus: vi.fn(),
      addEventListener: vi.fn((event: string, fn: () => void) => {
        if (event === 'load') loadListener = fn;
      }),
    } as unknown as Window;
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(mockWin);
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation((): void => {
  return;
});

    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onPrint();

    expect(openSpy).toHaveBeenCalledOnce();
    expect(openSpy.mock.calls[0][0]).toMatch(/^blob:/);
    expect(openSpy.mock.calls[0][1]).toBe('_blank');
    expect(openSpy.mock.calls[0][2]).toBe('noopener,noreferrer');
    expect(mockPrint).not.toHaveBeenCalled();
    loadListener();
    expect(mockPrint).toHaveBeenCalledOnce();
    openSpy.mockRestore();
    revokeSpy.mockRestore();
  });

  it('should not open print window when summary is empty', () => {
    vi.spyOn(analyticsService, 'getWeeklySummary').mockReturnValue(of(makeEmptyWeeklySummary()));
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.onPrint();

    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should format duration correctly', () => {
    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.formatDuration(30)).toBe('30m');
    expect(component.formatDuration(90)).toBe('1h 30m');
    expect(component.formatDuration(60)).toBe('1h');
  });

  it('should set error when childId param is missing', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PediatricianSummaryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: activatedRouteStub(null) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error()).toBe('Child not found.');
    expect(childrenService.get).not.toHaveBeenCalled();
  });

  it('should set error when childId param is not a number', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PediatricianSummaryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: activatedRouteStub('abc') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PediatricianSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error()).toBe('Invalid child.');
    expect(childrenService.get).not.toHaveBeenCalled();
  });
});
