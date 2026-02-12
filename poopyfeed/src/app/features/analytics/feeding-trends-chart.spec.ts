/**
 * Feeding trends chart component tests.
 *
 * Tests chart rendering, loading states, and cleanup.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FeedingTrendsChart } from './feeding-trends-chart';
import { Chart } from 'chart.js';
import { FeedingTrends } from '../../models/analytics.model';

// Mock Chart.js
vi.mock('chart.js', () => {
  const mockChart = vi.fn(function (this: any) {
    this.destroy = vi.fn();
    this.update = vi.fn();
  }) as any;
  mockChart.register = vi.fn();
  return {
    Chart: mockChart,
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
    await TestBed.configureTestingModule({
      imports: [FeedingTrendsChart],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedingTrendsChart);
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
    it('should render chart when data is provided', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      expect(vi.mocked(Chart)).toHaveBeenCalled();
    });

    it('should not render chart when data is null', () => {
      vi.clearAllMocks();
      fixture.componentRef.setInput('data', null);
      fixture.detectChanges();

      expect(vi.mocked(Chart)).not.toHaveBeenCalled();
    });

    it('should not render chart when isLoading is true', () => {
      vi.clearAllMocks();
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      expect(vi.mocked(Chart)).not.toHaveBeenCalled();
    });

    it('should pass correct data to chart', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const chartConfig = vi.mocked(Chart).mock.calls[0][1];
      expect(chartConfig.data.labels).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
      expect(chartConfig.data.datasets[0].data).toEqual([5, 6, 5]);
    });

    it('should use PoopyFeed brand colors', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const chartConfig = vi.mocked(Chart).mock.calls[0][1];
      expect(chartConfig.data.datasets[0].borderColor).toBe('#FF6B35');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const spinner = compiled.querySelector('svg.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should hide canvas when isLoading is true', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas).toBeFalsy();
    });

    it('should show canvas when isLoading is false', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });
  });

  describe('Data Updates', () => {
    it('should re-render chart when data changes', () => {
      vi.clearAllMocks();

      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const newData: FeedingTrends = {
        ...mockData,
        daily_data: [{ date: '2024-01-04', count: 7, average_duration: 14.0, total_oz: 28 }],
      };

      fixture.componentRef.setInput('data', newData);
      fixture.detectChanges();

      expect(vi.mocked(Chart)).toHaveBeenCalledTimes(2);
    });

    it('should destroy previous chart before creating new one', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const firstChartInstance = vi.mocked(Chart).mock.results[0].value;
      const destroySpy = firstChartInstance.destroy;

      vi.clearAllMocks();

      const newData: FeedingTrends = {
        ...mockData,
        daily_data: [{ date: '2024-01-04', count: 7, average_duration: 14.0, total_oz: 28 }],
      };

      fixture.componentRef.setInput('data', newData);
      fixture.detectChanges();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should destroy chart on component destroy', () => {
      fixture.componentRef.setInput('data', mockData);
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();

      const chartInstance = vi.mocked(Chart).mock.results[0].value;
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
    it('should display chart title', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('h2');
      expect(title?.textContent).toContain('Feeding Trends');
    });

    it('should have proper styling classes', () => {
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.bg-white');
      expect(container?.classList.contains('rounded-3xl')).toBe(true);
      expect(container?.classList.contains('shadow-lg')).toBe(true);
    });
  });
});
