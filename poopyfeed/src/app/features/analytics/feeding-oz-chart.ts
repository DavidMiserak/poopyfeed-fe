/**
 * Feeding ounces chart component.
 *
 * Displays daily total ounces consumed over time (bottle feedings only).
 * Uses Chart.js for rendering with PoopyFeed brand colors (orange #FF6B35).
 *
 * Input:
 * - data: FeedingTrends object from API
 * - isLoading: Loading indicator state
 *
 * Renders a responsive line chart that updates when data changes.
 * Chart.js instance is properly cleaned up on component destruction.
 */

import {
  Component,
  inject,
  input,
  signal,
  computed,
  effect,
  untracked,
  viewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FeedingTrends } from '../../models/analytics.model';
import type { Chart, ChartConfiguration } from 'chart.js';
import { CHART_FACTORY } from './chart.token';

@Component({
  selector: 'app-feeding-oz-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feeding-oz-chart.html',
})
export class FeedingOzChart implements OnDestroy {
  private chartFactory = inject(CHART_FACTORY);

  /** Feeding trends data from API */
  data = input<FeedingTrends | null>(null);

  /** Loading state indicator */
  isLoading = input(false);

  hasData = computed(() => {
    const d = this.data();
    return d?.daily_data?.some((item) => item.total_oz && item.total_oz > 0) ?? false;
  });

  private chart = signal<Chart | null>(null);
  private chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  constructor() {
    // Re-render chart when data changes
    effect(() => {
      const trendsData = this.data();
      const canvas = this.chartCanvas();
      const loading = this.isLoading();

      if (trendsData && canvas && !loading) {
        untracked(() => this.renderChart(trendsData, canvas.nativeElement));
      }
    });
  }

  private renderChart(trends: FeedingTrends, canvas: HTMLCanvasElement): void {
    // Destroy old chart instance
    this.chart()?.destroy();

    // Guard against missing or invalid data
    if (!trends || !trends.daily_data || !Array.isArray(trends.daily_data)) {
      return;
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: trends.daily_data.map((d) => d.date),
        datasets: [
          {
            label: 'Total oz per day',
            data: trends.daily_data.map((d) => d.total_oz || 0),
            borderColor: '#FF6B35', // PoopyFeed orange
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#FF6B35',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              font: { family: "'Fredoka', sans-serif" },
              padding: 15,
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { family: "'Fredoka', sans-serif" },
            bodyFont: { family: "'Fredoka', sans-serif" },
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? `Total oz: ${value.toFixed(1)}` : 'Total oz: 0.0';
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: { family: "'Fredoka', sans-serif" },
              callback: (value) => `${value} oz`,
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
          },
          x: {
            ticks: { font: { family: "'Fredoka', sans-serif" } },
            grid: { display: false },
          },
        },
      },
    };

    try {
      this.chart.set(new this.chartFactory(canvas, config));
    } catch (error) {
      console.error('Failed to render feeding oz chart:', error);
    }
  }

  ngOnDestroy(): void {
    this.chart()?.destroy();
  }
}
