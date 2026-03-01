import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '@angular/core';
import { ChartFactoryService } from './chart-factory.service';

const MockChart = class Chart {
  static register = vi.fn();
};

vi.mock('chart.js', () => ({
  Chart: MockChart,
  LineController: {},
  BarController: {},
  LineElement: {},
  BarElement: {},
  PointElement: {},
  CategoryScale: {},
  LinearScale: {},
  Legend: {},
  Tooltip: {},
  Filler: {},
}));

describe('ChartFactoryService', () => {
  let service: ChartFactoryService;

  beforeEach(async () => {
    vi.resetModules();
    await TestBed.configureTestingModule({
      providers: [ChartFactoryService, ErrorHandler],
    }).compileComponents();
    service = TestBed.inject(ChartFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getChart() should load and return Chart constructor', async () => {
    const Chart = await service.getChart();
    expect(Chart).toBe(MockChart);
  });

  it('getCachedChart() should return Chart after getChart() has resolved', async () => {
    await service.getChart();
    const cached = service.getCachedChart();
    expect(cached).toBe(MockChart);
  });

  it('getChart() should only load once when called multiple times', async () => {
    const a = await service.getChart();
    const b = await service.getChart();
    expect(a).toBe(MockChart);
    expect(b).toBe(MockChart);
    expect(a).toBe(b);
  });
});
