/**
 * Feeding trends line chart component.
 *
 * Displays daily feeding counts over time with average trend line.
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
  input,
  signal,
  effect,
  viewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedingTrends } from '../../models/analytics.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components globally
Chart.register(...registerables);

@Component({
  selector: 'app-feeding-trends-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg p-6">
      <h2 class="font-['Fredoka',sans-serif] text-2xl font-semibold text-gray-800 mb-4">
        Feeding Trends (30 Days)
      </h2>
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <svg
            class="w-12 h-12 animate-spin text-orange-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      } @else {
        <canvas #chartCanvas></canvas>
      }
    </div>
  `,
})
export class FeedingTrendsChart implements OnDestroy {
  /** Feeding trends data from API */
  data = input<FeedingTrends | null>(null);

  /** Loading state indicator */
  isLoading = input(false);

  private chart = signal<Chart | null>(null);
  private chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  constructor() {
    // Re-render chart when data changes
    effect(() => {
      const trendsData = this.data();
      const canvas = this.chartCanvas();

      if (trendsData && canvas && !this.isLoading()) {
        this.renderChart(trendsData, canvas.nativeElement);
      }
    });
  }

  private renderChart(trends: FeedingTrends, canvas: HTMLCanvasElement): void {
    // Destroy old chart instance
    this.chart()?.destroy();

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: trends.daily_data.map((d) => d.date),
        datasets: [
          {
            label: 'Feedings per day',
            data: trends.daily_data.map((d) => d.count),
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
              label: (context) => `Count: ${context.parsed.y}`,
              afterLabel: (context) => {
                const trend = trends.daily_data[context.dataIndex];
                if (trend.average_duration) {
                  return `Avg duration: ${trend.average_duration.toFixed(1)} min`;
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

    this.chart.set(new Chart(canvas, config));
  }

  ngOnDestroy(): void {
    this.chart()?.destroy();
  }
}
