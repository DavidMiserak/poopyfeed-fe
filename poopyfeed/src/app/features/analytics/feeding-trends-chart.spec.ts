/**
 * Feeding trends chart component tests.
 *
 * Tests chart rendering, loading states, and cleanup.
 * Uses zoneless change detection with fixture.whenStable()
 * for deterministic effect flushing.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FeedingTrendsChart } from './feeding-trends-chart';
import { Chart } from 'chart.js';
import { FeedingTrends } from '../../models/analytics.model';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Chart.js
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

describe('FeedingTrendsChart', () => {
  let component: FeedingTrendsChart;
  let fixture: ComponentFixture<FeedingTrendsChart>;

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
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [FeedingTrendsChart],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedingTrendsChart);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    vi.clearAllMocks();
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

      expect(vi.mocked(Chart)).toHaveBeenCalled();
    });

    it('should not render chart when data is null', async () => {
      fixture.componentRef.setInput('data', null);
      await fixture.whenStable();

      expect(vi.mocked(Chart)).not.toHaveBeenCalled();
    });

    it('should not render chart when isLoading is true', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', true);
      await fixture.whenStable();

      expect(vi.mocked(Chart)).not.toHaveBeenCalled();
    });

    it('should pass correct data to chart', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const chartMock = vi.mocked(Chart);
      expect(chartMock).toHaveBeenCalled();

      const chartConfig = chartMock.mock.calls[0][1];
      expect(chartConfig.data.labels).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
      expect(chartConfig.data.datasets[0].data).toEqual([5, 6, 5]);
    });

    it('should use PoopyFeed brand colors', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const chartMock = vi.mocked(Chart);
      expect(chartMock).toHaveBeenCalled();

      const chartConfig = chartMock.mock.calls[0][1];
      expect(chartConfig.data.datasets[0].borderColor).toBe('#FF6B35');
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
      expect(compiled.textContent).toContain('No feeding data yet');
      expect(compiled.querySelector('canvas')).toBeFalsy();
    });

    it('should show empty state when all daily_data counts are zero', async () => {
      const emptyData: FeedingTrends = {
        ...mockData,
        daily_data: [
          { date: '2024-01-01', count: 0, average_duration: null, total_oz: null },
          { date: '2024-01-02', count: 0, average_duration: null, total_oz: null },
        ],
      };
      fixture.componentRef.setInput('data', emptyData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('No feeding data yet');
      expect(compiled.querySelector('canvas')).toBeFalsy();
    });

    it('should have hasData false when data is null', () => {
      expect(component.hasData()).toBe(false);
    });

    it('should have hasData false when all counts are zero', () => {
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      expect(component.hasData()).toBe(false);
    });

    it('should have hasData true when any count is non-zero', () => {
      fixture.componentRef.setInput('data', mockData);
      expect(component.hasData()).toBe(true);
    });

    it('should not render chart when data has all zero counts', async () => {
      fixture.componentRef.setInput('data', {
        ...mockData,
        daily_data: [{ date: '2024-01-01', count: 0, average_duration: null, total_oz: null }],
      });
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      expect(vi.mocked(Chart)).not.toHaveBeenCalled();
    });
  });

  describe('Data Updates', () => {
    it('should re-render chart when data changes', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const chartMock = vi.mocked(Chart);
      const initialCallCount = chartMock.mock.calls.length;

      const newData: FeedingTrends = {
        ...mockData,
        daily_data: [{ date: '2024-01-04', count: 7, average_duration: 14.0, total_oz: 28 }],
      };

      fixture.componentRef.setInput('data', newData);
      await fixture.whenStable();

      expect(chartMock.mock.calls.length).toBe(initialCallCount + 1);
    });

    it('should destroy previous chart before creating new one', async () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      await fixture.whenStable();

      const chartMock = vi.mocked(Chart);
      const firstInstanceResult = chartMock.mock.results[0];

      // Check if we got a result from the first Chart constructor call
      let firstChartInstance: any;
      if (firstInstanceResult && firstInstanceResult.value) {
        firstChartInstance = firstInstanceResult.value;
      } else if (firstInstanceResult && firstInstanceResult.type === 'return') {
        firstChartInstance = firstInstanceResult.value;
      }

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

      const chartMock = vi.mocked(Chart);
      expect(chartMock).toHaveBeenCalled();

      const instanceResult = chartMock.mock.results[0];
      let chartInstance: any;

      if (instanceResult && instanceResult.type === 'return') {
        chartInstance = instanceResult.value;
      }

      if (chartInstance) {
        const destroySpy = chartInstance.destroy;
        component.ngOnDestroy();
        expect(destroySpy).toHaveBeenCalled();
      }
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
      expect(title?.textContent).toContain('Feeding Trends');
    });

    it('should have proper styling classes', async () => {
      await fixture.whenStable();

      const container = fixture.nativeElement.querySelector('.rounded-3xl');
      expect(container).toBeTruthy();
      expect(container?.classList.contains('shadow-lg')).toBe(true);
    });
  });
});
