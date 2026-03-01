/**
 * Sleep summary chart component tests.
 *
 * Uses zoneless change detection with fixture.whenStable()
 * for deterministic effect flushing.
 *
 * Chart.js is mocked via Angular DI (CHART_FACTORY token)
 * rather than vi.mock(), which is unreliable with AOT bundling.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SleepSummaryChart } from './sleep-summary-chart';
import { CHART_FACTORY } from './chart.token';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('SleepSummaryChart', () => {
  let component: SleepSummaryChart;
  let fixture: ComponentFixture<SleepSummaryChart>;
  let mockChartConstructor: ReturnType<typeof vi.fn>;
  let mockDestroyFn: ReturnType<typeof vi.fn>;

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
    mockDestroyFn = vi.fn();
    mockChartConstructor = vi.fn(function (this: any) {
      this.destroy = mockDestroyFn;
      this.update = vi.fn();
      return this;
    }) as any;
    (mockChartConstructor as any).register = vi.fn();

    await TestBed.configureTestingModule({
      imports: [SleepSummaryChart],
      providers: [{ provide: CHART_FACTORY, useValue: mockChartConstructor }],
    }).compileComponents();

    fixture = TestBed.createComponent(SleepSummaryChart);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render chart with data', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    await fixture.whenStable();

    expect(mockChartConstructor).toHaveBeenCalled();
  });

  it('should use line chart type', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    await fixture.whenStable();

    const chartConfig = mockChartConstructor.mock.calls[0][1] as any;
    expect(chartConfig.type).toBe('line');
  });

  it('should use amber color for sleep chart', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    await fixture.whenStable();

    const chartConfig = mockChartConstructor.mock.calls[0][1];
    expect(chartConfig.data.datasets[0].borderColor).toBe('#FBBF24');
  });

  it('should display title', async () => {
    await fixture.whenStable();

    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toContain('Sleep Summary');
  });

  it('should destroy chart on component destroy', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    await fixture.whenStable();

    const chartInstance = mockChartConstructor.mock.results[0].value;
    const destroySpy = chartInstance.destroy;

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
  });

  describe('Empty State', () => {
    it('should show empty state when data is null', async () => {
      fixture.componentRef.setInput('data', null);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No sleep data yet');
      expect(compiled.querySelector('canvas')).toBeFalsy();
    });

    it('should show empty state when all counts are zero', async () => {
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

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

    it('should have hasData false when daily_data is empty array', () => {
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: [],
      });
      expect(component.hasData()).toBe(false);
    });

    it('should have hasData false when daily_data is undefined', () => {
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: undefined,
      });
      expect(component.hasData()).toBe(false);
    });
  });

  describe('Chart rendering edge cases', () => {
    it('should not render chart when loading', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', true);
      await fixture.whenStable();

      expect(mockChartConstructor).not.toHaveBeenCalled();
    });

    it('should not render chart when data is null', async () => {
      fixture.componentRef.setInput('data', null);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(mockChartConstructor).not.toHaveBeenCalled();
    });

    it('should destroy old chart before rendering new one', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(mockChartConstructor).toHaveBeenCalledTimes(1);

      // Update data to trigger re-render
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: [{ date: '2024-02-01', count: 4, average_duration: 40.0, total_oz: null }],
      });
      await fixture.whenStable();

      expect(mockDestroyFn).toHaveBeenCalled();
    });

    it('should handle chart factory error', async () => {
      const errorChartConstructor = vi.fn(function (this: unknown) {
        throw new Error('Canvas not supported');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SleepSummaryChart],
        providers: [{ provide: CHART_FACTORY, useValue: errorChartConstructor }],
      }).compileComponents();

      const newFixture = TestBed.createComponent(SleepSummaryChart);
      newFixture.componentRef.setInput('data', mockData);
      newFixture.componentRef.setInput('isLoading', false);
      await newFixture.whenStable();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to render sleep summary chart:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
      newFixture.destroy();
    });

    it('should handle data with null average_duration in tooltip', async () => {
      const dataWithNullDuration = {
        ...mockData,
        daily_data: [{ date: '2024-01-01', count: 2, average_duration: null, total_oz: null }],
      };
      fixture.componentRef.setInput('data', dataWithNullDuration);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(mockChartConstructor).toHaveBeenCalled();

      // Verify the tooltip afterLabel callback handles null duration
      const config = mockChartConstructor.mock.calls[0][1];
      const afterLabel = config.options?.plugins?.tooltip?.callbacks?.afterLabel;
      if (afterLabel) {
        const result = afterLabel({ dataIndex: 0, parsed: { y: 2 } } as any);
        expect(result).toBe('');
      }
    });

    it('should format duration in tooltip when present', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const config = mockChartConstructor.mock.calls[0][1];
      const afterLabel = config.options?.plugins?.tooltip?.callbacks?.afterLabel;
      if (afterLabel) {
        const result = afterLabel({ dataIndex: 0, parsed: { y: 3 } } as any);
        expect(result).toContain('Avg duration: 45.0 min');
      }
    });

    it('should show spinner when loading', async () => {
      fixture.componentRef.setInput('isLoading', true);
      await fixture.whenStable();

      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });
});
