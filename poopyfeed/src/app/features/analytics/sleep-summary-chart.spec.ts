/**
 * Sleep summary chart component tests.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SleepSummaryChart } from './sleep-summary-chart';
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

describe('SleepSummaryChart', () => {
  let component: SleepSummaryChart;
  let fixture: ComponentFixture<SleepSummaryChart>;

  const mockData = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [
      { date: '2024-01-01', count: 3, average_duration: 45.0, total_oz: null },
      { date: '2024-01-02', count: 2, average_duration: 50.0, total_oz: null },
    ],
    weekly_summary: { avg_per_day: 2.8, trend: 'increasing' as const, variance: 0.6 },
    last_updated: '2024-01-30T12:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SleepSummaryChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SleepSummaryChart);
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

  it('should use line chart type', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    const chartConfig = vi.mocked(Chart).mock.calls[0][1] as any;
    expect(chartConfig.type).toBe('line');
  });

  it('should use amber color for sleep chart', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    const chartConfig = vi.mocked(Chart).mock.calls[0][1];
    expect(chartConfig.data.datasets[0].borderColor).toBe('#FBBF24');
  });

  it('should display title', () => {
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toContain('Sleep Summary');
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
