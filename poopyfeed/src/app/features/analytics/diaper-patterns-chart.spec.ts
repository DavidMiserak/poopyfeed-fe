/**
 * Diaper patterns chart component tests.
 *
 * Uses zoneless change detection with fixture.whenStable()
 * for deterministic effect flushing.
 *
 * Chart.js is mocked via Angular DI (CHART_FACTORY token)
 * rather than vi.mock(), which is unreliable with AOT bundling.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DiaperPatternsChart } from './diaper-patterns-chart';
import { CHART_FACTORY } from './chart.token';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('DiaperPatternsChart', () => {
  let component: DiaperPatternsChart;
  let fixture: ComponentFixture<DiaperPatternsChart>;
  let mockChartConstructor: ReturnType<typeof vi.fn>;
  let mockDestroyFn: ReturnType<typeof vi.fn>;

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
    mockDestroyFn = vi.fn();
    mockChartConstructor = vi.fn(function (this: any) {
      this.destroy = mockDestroyFn;
      this.update = vi.fn();
      return this;
    }) as any;
    (mockChartConstructor as any).register = vi.fn();

    await TestBed.configureTestingModule({
      imports: [DiaperPatternsChart],
      providers: [{ provide: CHART_FACTORY, useValue: mockChartConstructor }],
    }).compileComponents();

    fixture = TestBed.createComponent(DiaperPatternsChart);
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

  it('should use bar chart type', async () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.componentRef.setInput('isLoading', false);
    await fixture.whenStable();

    const chartConfig = mockChartConstructor.mock.calls[0][1] as any;
    expect(chartConfig.type).toBe('bar');
  });

  it('should display title', async () => {
    await fixture.whenStable();

    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toContain('Diaper Patterns');
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
      expect(compiled.textContent).toContain('No diaper data yet');
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
      expect(compiled.textContent).toContain('No diaper data yet');
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
