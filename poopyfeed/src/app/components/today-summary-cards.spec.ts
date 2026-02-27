import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodaySummaryCards } from './today-summary-cards';
import { TodaySummaryData } from '../models/analytics.model';

function makeSummary(overrides: Partial<TodaySummaryData> = {}): TodaySummaryData {
  return {
    child_id: 1,
    period: 'Today',
    feedings: { count: 4, total_oz: 16, bottle: 3, breast: 1 },
    diapers: { count: 6, wet: 4, dirty: 1, both: 1 },
    sleep: { naps: 2, total_minutes: 120, avg_duration: 60 },
    last_updated: '2024-01-30T12:00:00Z',
    ...overrides,
  };
}

describe('TodaySummaryCards', () => {
  let fixture: ComponentFixture<TodaySummaryCards>;
  let component: TodaySummaryCards;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodaySummaryCards],
    }).compileComponents();

    fixture = TestBed.createComponent(TodaySummaryCards);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('empty state', () => {
    it('should show empty state when summary is null', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No activity recorded today');
    });

    it('should show empty state when all counts are zero', () => {
      const emptySummary = makeSummary({
        feedings: { count: 0, total_oz: 0, bottle: 0, breast: 0 },
        diapers: { count: 0, wet: 0, dirty: 0, both: 0 },
        sleep: { naps: 0, total_minutes: 0, avg_duration: 0 },
      });
      fixture.componentRef.setInput('summary', emptySummary);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No activity recorded today');
    });
  });

  describe('with data', () => {
    it('should display feeding count and oz', () => {
      fixture.componentRef.setInput('summary', makeSummary());
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Feedings Today');
      expect(compiled.textContent).toContain('4');
      expect(compiled.textContent).toContain('16 oz total');
    });

    it('should display diaper count and breakdown', () => {
      fixture.componentRef.setInput('summary', makeSummary());
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Diapers Today');
      expect(compiled.textContent).toContain('6');
      expect(compiled.textContent).toContain('4 wet');
      expect(compiled.textContent).toContain('1 dirty');
      expect(compiled.textContent).toContain('1 both');
    });

    it('should display nap count and total minutes', () => {
      fixture.componentRef.setInput('summary', makeSummary());
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Naps Today');
      expect(compiled.textContent).toContain('2');
      expect(compiled.textContent).toContain('2h total');
    });

    it('should not show empty state when there is activity', () => {
      fixture.componentRef.setInput('summary', makeSummary());
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('No activity recorded today');
    });
  });

  describe('formatMinutes formatting', () => {
    it('should format minutes under 60', () => {
      fixture.componentRef.setInput('summary', makeSummary({
        sleep: { naps: 1, total_minutes: 45, avg_duration: 45 },
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('45m total');
    });

    it('should format exact hours', () => {
      fixture.componentRef.setInput('summary', makeSummary({
        sleep: { naps: 2, total_minutes: 120, avg_duration: 60 },
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('2h total');
    });

    it('should format hours and minutes', () => {
      fixture.componentRef.setInput('summary', makeSummary({
        sleep: { naps: 3, total_minutes: 150, avg_duration: 50 },
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('2h 30m total');
    });

    it('should round fractional minutes', () => {
      fixture.componentRef.setInput('summary', makeSummary({
        sleep: { naps: 1, total_minutes: 45.7, avg_duration: 45.7 },
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('46m total');
    });
  });

  describe('partial activity', () => {
    it('should show cards when only feedings exist', () => {
      fixture.componentRef.setInput('summary', makeSummary({
        feedings: { count: 2, total_oz: 8, bottle: 2, breast: 0 },
        diapers: { count: 0, wet: 0, dirty: 0, both: 0 },
        sleep: { naps: 0, total_minutes: 0, avg_duration: 0 },
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Feedings Today');
      expect(compiled.textContent).not.toContain('No activity recorded today');
    });

    it('should show cards when only diapers exist', () => {
      fixture.componentRef.setInput('summary', makeSummary({
        feedings: { count: 0, total_oz: 0, bottle: 0, breast: 0 },
        diapers: { count: 3, wet: 2, dirty: 1, both: 0 },
        sleep: { naps: 0, total_minutes: 0, avg_duration: 0 },
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Diapers Today');
      expect(compiled.textContent).not.toContain('No activity recorded today');
    });

    it('should show cards when only naps exist', () => {
      fixture.componentRef.setInput('summary', makeSummary({
        feedings: { count: 0, total_oz: 0, bottle: 0, breast: 0 },
        diapers: { count: 0, wet: 0, dirty: 0, both: 0 },
        sleep: { naps: 1, total_minutes: 60, avg_duration: 60 },
      }));
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Naps Today');
      expect(compiled.textContent).not.toContain('No activity recorded today');
    });
  });

  describe('UTC midnight boundary', () => {
    /**
     * Backend defines "today" by the authenticated user's timezone (see
     * analytics.utils.get_today_summary and request.user.timezone). The component
     * displays API data as-is and does not perform client-side "today" filtering.
     * These tests ensure we don't introduce date logic that could break at
     * midnight (e.g. hiding summary when last_updated crosses midnight).
     */

    it('should display summary when last_updated is at UTC midnight', () => {
      const summary = makeSummary({
        last_updated: '2026-02-26T00:00:00Z',
        feedings: { count: 1, total_oz: 4, bottle: 1, breast: 0 },
        diapers: { count: 0, wet: 0, dirty: 0, both: 0 },
        sleep: { naps: 0, total_minutes: 0, avg_duration: 0 },
      });
      fixture.componentRef.setInput('summary', summary);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Feedings Today');
      expect(compiled.textContent).toContain('1');
      expect(compiled.textContent).not.toContain('No activity recorded today');
    });

    it('should display summary when last_updated is just after UTC midnight', () => {
      const summary = makeSummary({
        last_updated: '2026-02-26T00:00:01Z',
        feedings: { count: 2, total_oz: 8, bottle: 2, breast: 0 },
        diapers: { count: 1, wet: 1, dirty: 0, both: 0 },
        sleep: { naps: 1, total_minutes: 45, avg_duration: 45 },
      });
      fixture.componentRef.setInput('summary', summary);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('2');
      expect(compiled.textContent).toContain('8 oz total');
      expect(compiled.textContent).toContain('45m total');
      expect(compiled.textContent).not.toContain('No activity recorded today');
    });

    it('should display empty state when counts are zero regardless of last_updated time', () => {
      const summary = makeSummary({
        last_updated: '2026-02-25T23:59:59Z',
        feedings: { count: 0, total_oz: 0, bottle: 0, breast: 0 },
        diapers: { count: 0, wet: 0, dirty: 0, both: 0 },
        sleep: { naps: 0, total_minutes: 0, avg_duration: 0 },
      });
      fixture.componentRef.setInput('summary', summary);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No activity recorded today');
    });
  });

  describe("user's timezone (today boundary)", () => {
    /**
     * Backend uses request.user.timezone so "today" is the user's local day
     * (e.g. EST midnight boundary). The component just displays the API payload;
     * no client-side date logic. This test documents that we display summary
     * data for "user's today" correctly (e.g. after backend returns counts
     * for America/New_York "today").
     */
    it("should display summary for user's local 'today' (e.g. EST boundary)", () => {
      // Simulate API response for a user in America/New_York: "today" in ET
      // might have last_updated just after midnight ET (05:00 UTC)
      const summary = makeSummary({
        last_updated: '2026-02-26T05:00:00Z', // 00:00 ET
        feedings: { count: 3, total_oz: 12, bottle: 2, breast: 1 },
        diapers: { count: 4, wet: 3, dirty: 0, both: 1 },
        sleep: { naps: 1, total_minutes: 90, avg_duration: 90 },
      });
      fixture.componentRef.setInput('summary', summary);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Feedings Today');
      expect(compiled.textContent).toContain('3');
      expect(compiled.textContent).toContain('12 oz total');
      expect(compiled.textContent).toContain('Diapers Today');
      expect(compiled.textContent).toContain('4');
      expect(compiled.textContent).toContain('Naps Today');
      expect(compiled.textContent).toContain('1');
      expect(compiled.textContent).toContain('1h 30m total');
      expect(compiled.textContent).not.toContain('No activity recorded today');
    });
  });
});
