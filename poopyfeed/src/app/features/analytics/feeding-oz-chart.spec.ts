/**
 * Feeding oz chart component tests.
 *
 * Tests chart rendering, loading states, and cleanup.
 * Uses zoneless change detection with fixture.whenStable()
 * for deterministic effect flushing.
 *
 * Chart.js is mocked via Angular DI (CHART_FACTORY token)
 * rather than vi.mock(), which is unreliable with AOT bundling.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FeedingOzChart } from './feeding-oz-chart';
import { CHART_FACTORY } from './chart.token';
import type { FeedingTrends } from '../../models/analytics.model';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

interface MockChartInstance {
  destroy: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

describe('FeedingOzChart', () => {
  let component: FeedingOzChart;
  let fixture: ComponentFixture<FeedingOzChart>;
  let mockChartConstructor: ReturnType<typeof vi.fn>;
  let mockDestroyFn: ReturnType<typeof vi.fn>;

  const mockData: FeedingTrends = {
    period: '2024-01-01 to 2024-01-30',
    child_id: 1,
    daily_data: [
      { date: '2024-01-01', count: 5, average_duration: 12.5, total_oz: 20 },
      { date: '2024-01-02', count: 6, average_duration: 13.0, total_oz: 24 },
      { date: '2024-01-03', count: 5, average_duration: 12.0, total_oz: 20 },
    ],
    weekly_summary: {
      avg_per_day: 5.4,
      trend: 'stable',
      variance: 0.5,
    },
    last_updated: '2024-01-30T12:00:00Z',
  };

  beforeEach(async () => {
    mockDestroyFn = vi.fn();
    mockChartConstructor = vi.fn(function (this: MockChartInstance) {
      this.destroy = mockDestroyFn;
      this.update = vi.fn();
      return this;
    }) as unknown as ReturnType<typeof vi.fn>;
    (mockChartConstructor as unknown as Record<string, unknown>)['register'] = vi.fn();

    await TestBed.configureTestingModule({
      imports: [FeedingOzChart],
      providers: [{ provide: CHART_FACTORY, useValue: mockChartConstructor }],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedingOzChart);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should have null data input by default', () => {
      expect(component.data()).toBeNull();
    });

    it('should have loading state false by default', () => {
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Chart Rendering', () => {
    it('should render chart when data is provided', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(mockChartConstructor).toHaveBeenCalled();
    });

    it('should not render chart when data is null', async () => {
      fixture.componentRef.setInput('data', null);
      await fixture.whenStable();

      expect(mockChartConstructor).not.toHaveBeenCalled();
    });

    it('should not render chart when isLoading is true', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', true);
      await fixture.whenStable();

      expect(mockChartConstructor).not.toHaveBeenCalled();
    });

    it('should pass total_oz data to chart', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(mockChartConstructor).toHaveBeenCalled();

      const chartConfig = mockChartConstructor.mock.calls[0][1];
      expect(chartConfig.data.labels).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
      expect(chartConfig.data.datasets[0].data).toEqual([20, 24, 20]);
    });

    it('should use PoopyFeed brand colors', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(mockChartConstructor).toHaveBeenCalled();

      const chartConfig = mockChartConstructor.mock.calls[0][1];
      expect(chartConfig.data.datasets[0].borderColor).toBe('#FF6B35');
    });

    it('should display oz units on y-axis', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const chartConfig = mockChartConstructor.mock.calls[0][1];
      const yAxisConfig = chartConfig.options.scales.y;

      // Verify the callback formats with "oz"
      const formattedValue = yAxisConfig.ticks.callback(10);
      expect(formattedValue).toBe('10 oz');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', async () => {
      fixture.componentRef.setInput('isLoading', true);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const spinner = compiled.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should hide canvas when isLoading is true', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', true);
      await fixture.whenStable();

      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas).toBeFalsy();
    });

    it('should show canvas when isLoading is false and has data', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when data is null', async () => {
      fixture.componentRef.setInput('data', null);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No bottle data yet');
      expect(compiled.querySelector('canvas')).toBeFalsy();
    });

    it('should show empty state when all daily_data oz are zero or null', async () => {
      const emptyData: FeedingTrends = {
        ...mockData,
        daily_data: [
          { date: '2024-01-01', count: 0, average_duration: null, total_oz: null },
          { date: '2024-01-02', count: 0, average_duration: null, total_oz: 0 },
        ],
      };
      fixture.componentRef.setInput('data', emptyData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No bottle data yet');
      expect(compiled.querySelector('canvas')).toBeFalsy();
    });

    it('should have hasData false when data is null', () => {
      expect(component.hasData()).toBe(false);
    });

    it('should have hasData false when all total_oz are zero or null', () => {
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: [{ date: '2024-01-01', count: 5, average_duration: null, total_oz: null }],
      });
      expect(component.hasData()).toBe(false);
    });

    it('should have hasData true when any total_oz is non-zero', () => {
      fixture.componentRef.setInput('data', mockData);
      expect(component.hasData()).toBe(true);
    });

    it('should not render chart when data has all zero oz', async () => {
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: [{ date: '2024-01-01', count: 5, average_duration: null, total_oz: null }],
      });
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(mockChartConstructor).not.toHaveBeenCalled();
    });
  });

  describe('Data Updates', () => {
    it('should re-render chart when data changes', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const initialCallCount = mockChartConstructor.mock.calls.length;

      const newData: FeedingTrends = {
        ...mockData,
        daily_data: [{ date: '2024-01-04', count: 7, average_duration: 14.0, total_oz: 28 }],
      };

      fixture.componentRef.setInput('data', newData);
      await fixture.whenStable();

      expect(mockChartConstructor.mock.calls.length).toBe(initialCallCount + 1);
    });

    it('should destroy previous chart before creating new one', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const firstChartInstance = mockChartConstructor.mock.results[0]?.value;

      const newData: FeedingTrends = {
        ...mockData,
        daily_data: [{ date: '2024-01-04', count: 7, average_duration: 14.0, total_oz: 28 }],
      };

      fixture.componentRef.setInput('data', newData);
      await fixture.whenStable();

      if (firstChartInstance) {
        expect(firstChartInstance.destroy).toHaveBeenCalled();
      }
    });
  });

  describe('Cleanup', () => {
    it('should destroy chart on component destroy', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(mockChartConstructor).toHaveBeenCalled();

      const chartInstance = mockChartConstructor.mock.results[0]?.value;
      expect(chartInstance).toBeTruthy();

      const destroySpy = chartInstance.destroy;
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should handle destroy without error if no chart exists', () => {
      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('Template', () => {
    it('should display chart title', async () => {
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('h2');
      expect(title?.textContent).toContain('Bottle Feeding Volume');
    });

    it('should display bottle emoji in empty state', async () => {
      fixture.componentRef.setInput('data', null);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('🍶');
    });

    it('should have proper styling classes', async () => {
      await fixture.whenStable();

      const container = fixture.nativeElement.querySelector('.rounded-2xl');
      expect(container).toBeTruthy();
      expect(container?.classList.contains('shadow-lg')).toBe(true);
    });
  });

  describe('Tooltip Labels', () => {
    it('should format tooltip with oz units', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const chartConfig = mockChartConstructor.mock.calls[0][1];
      const tooltipConfig = chartConfig.options.plugins.tooltip;

      const context = {
        parsed: { y: 20 },
        dataIndex: 0,
      };

      const label = tooltipConfig.callbacks.label(context);
      expect(label).toBe('Total oz: 20.0');
    });

    it('should handle decimal oz values in tooltip', async () => {
      const dataWithDecimals: FeedingTrends = {
        ...mockData,
        daily_data: [
          { date: '2024-01-01', count: 3, average_duration: null, total_oz: 15.5 },
        ],
      };

      fixture.componentRef.setInput('data', dataWithDecimals);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const chartConfig = mockChartConstructor.mock.calls[0][1];
      const tooltipConfig = chartConfig.options.plugins.tooltip;

      const context = {
        parsed: { y: 15.5 },
        dataIndex: 0,
      };

      const label = tooltipConfig.callbacks.label(context);
      expect(label).toBe('Total oz: 15.5');
    });
  });
});
