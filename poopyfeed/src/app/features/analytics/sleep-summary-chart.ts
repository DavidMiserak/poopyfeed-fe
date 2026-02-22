/**
 * Sleep summary line chart component.
 *
 * Displays daily nap counts and average duration over time.
 * Uses Chart.js for rendering with PoopyFeed brand colors (amber #FBBF24).
 *
 * Input:
 * - data: SleepSummary object from API
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
import { CommonModule } from '@angular/common';
import { SleepSummary } from '../../models/analytics.model';
import type { Chart, ChartConfiguration } from 'chart.js';
import { CHART_FACTORY } from './chart.token';

@Component({
  selector: 'app-sleep-summary-chart',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sleep-summary-chart.html',
})
export class SleepSummaryChart implements OnDestroy {
  private chartFactory = inject(CHART_FACTORY);

  /** Sleep summary data from API */
  data = input<SleepSummary | null>(null);

  /** Loading state indicator */
  isLoading = input(false);

  hasData = computed(() => {
    const d = this.data();
    return d?.daily_data?.some((item) => item.count > 0) ?? false;
  });

  private chart = signal<Chart | null>(null);
  private chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  constructor() {
    // Re-render chart when data changes
    effect(() => {
      const summaryData = this.data();
      const canvas = this.chartCanvas();
      const loading = this.isLoading();

      if (summaryData && canvas && !loading) {
        untracked(() => this.renderChart(summaryData, canvas.nativeElement));
      }
    });
  }

  private renderChart(summary: SleepSummary, canvas: HTMLCanvasElement): void {
    // Destroy old chart instance
    this.chart()?.destroy();

    // Guard against missing or invalid data
    if (!summary || !summary.daily_data || !Array.isArray(summary.daily_data)) {
      return;
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: summary.daily_data.map((d) => d.date),
        datasets: [
          {
            label: 'Naps per day',
            data: summary.daily_data.map((d) => d.count),
            borderColor: '#FBBF24', // Tailwind amber
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#FBBF24',
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
              label: (context) => `Naps: ${context.parsed.y}`,
              afterLabel: (context) => {
                const data = summary.daily_data[context.dataIndex];
                if (data && data.average_duration) {
                  return `Avg duration: ${data.average_duration.toFixed(1)} min`;
                }
                return '';
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { family: "'Fredoka', sans-serif" },
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
      console.error('Failed to render sleep summary chart:', error);
    }
  }

  ngOnDestroy(): void {
    this.chart()?.destroy();
  }
}
