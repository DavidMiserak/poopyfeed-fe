/**
 * Sleep summary chart component tests.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SleepSummaryChart } from './sleep-summary-chart';
import { Chart } from 'chart.js';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('chart.js', () => {
  const mockDestroyFn = vi.fn();
  const mockUpdateFn = vi.fn();

  const mockChartConstructor = vi.fn(function (this: any) {
    this.destroy = mockDestroyFn;
    this.update = mockUpdateFn;
    return this;
  }) as any;

  mockChartConstructor.register = vi.fn();

  return {
    Chart: mockChartConstructor,
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
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [SleepSummaryChart],
    }).compileComponents();

    fixture = TestBed.createComponent(SleepSummaryChart);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render chart with data', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(vi.mocked(Chart)).toHaveBeenCalled();
  });

  it('should use line chart type', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 50));

    const chartConfig = vi.mocked(Chart).mock.calls[0][1] as any;
    expect(chartConfig.type).toBe('line');
  });

  it('should use amber color for sleep chart', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 50));

    const chartConfig = vi.mocked(Chart).mock.calls[0][1];
    expect(chartConfig.data.datasets[0].borderColor).toBe('#FBBF24');
  });

  it('should display title', () => {
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toContain('Sleep Summary');
  });

  it('should destroy chart on component destroy', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 50));

    const chartInstance = vi.mocked(Chart).mock.results[0].value;
    const destroySpy = chartInstance.destroy;

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
  });

  describe('Empty State', () => {
    it('should show empty state when data is null', () => {
      fixture.componentRef.setInput('data', null);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No sleep data yet');
      expect(compiled.querySelector('canvas')).toBeFalsy();
    });

    it('should show empty state when all counts are zero', () => {
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No sleep data yet');
    });

    it('should have hasData false when data is null', () => {
      expect(component.hasData()).toBe(false);
    });

    it('should have hasData true when data has non-zero counts', () => {
      fixture.componentRef.setInput('data', mockData);
      expect(component.hasData()).toBe(true);
    });
  });
});
