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
});
