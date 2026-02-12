/**
 * Diaper patterns chart component tests.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DiaperPatternsChart } from './diaper-patterns-chart';
import { Chart } from 'chart.js';

vi.mock('chart.js', () => {
  const mockChart = vi.fn(function (this: any) {
    this.destroy = vi.fn();
  }) as any;
  mockChart.register = vi.fn();
  return {
    Chart: mockChart,
    registerables: [],
  };
});

describe('DiaperPatternsChart', () => {
  let component: DiaperPatternsChart;
  let fixture: ComponentFixture<DiaperPatternsChart>;

  const mockData = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [
      { date: '2024-01-01', count: 8, average_duration: null, total_oz: null },
      { date: '2024-01-02', count: 7, average_duration: null, total_oz: null },
    ],
    weekly_summary: { avg_per_day: 7.5, trend: 'decreasing' as const, variance: 0.8 },
    breakdown: { wet: 80, dirty: 40, both: 25 },
    last_updated: '2024-01-30T12:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiaperPatternsChart],
    }).compileComponents();

    fixture = TestBed.createComponent(DiaperPatternsChart);
    component = fixture.componentInstance;
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render chart with data', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    expect(vi.mocked(Chart)).toHaveBeenCalled();
  });

  it('should use bar chart type', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    const chartConfig = vi.mocked(Chart).mock.calls[0][1] as any;
    expect(chartConfig.type).toBe('bar');
  });

  it('should display title', () => {
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toContain('Diaper Patterns');
  });

  it('should destroy chart on component destroy', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    const chartInstance = vi.mocked(Chart).mock.results[0].value;
    const destroySpy = chartInstance.destroy;

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
  });
});
