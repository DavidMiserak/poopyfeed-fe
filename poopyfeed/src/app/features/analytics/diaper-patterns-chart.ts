/**
 * Diaper patterns bar chart component.
 *
 * Displays daily diaper change counts over time with breakdown by type.
 * Uses Chart.js for rendering with PoopyFeed brand colors.
 *
 * Input:
 * - data: DiaperPatterns object from API
 * - isLoading: Loading indicator state
 *
 * Renders a responsive bar chart that updates when data changes.
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
import { DiaperPatterns } from '../../models/analytics.model';
import type { Chart, ChartConfiguration } from 'chart.js';
import { CHART_FACTORY } from './chart.token';

@Component({
  selector: 'app-diaper-patterns-chart',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg p-6">
      <h2 class="font-['Fredoka',sans-serif] text-2xl font-semibold text-gray-800 mb-4">
        Diaper Patterns (30 Days)
      </h2>
      @if (isLoading()) {
        <div class="flex items-center justify-center py-12">
          <svg
            class="w-12 h-12 animate-spin text-rose-500"
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
      } @else if (!hasData()) {
        <div class="flex flex-col items-center justify-center py-12 text-gray-400">
          <span class="text-5xl mb-3">💩</span>
          <p class="font-['Fredoka',sans-serif] text-lg font-medium text-gray-500">No diaper data yet</p>
          <p class="text-sm text-gray-400 mt-1">Start logging diaper changes to see patterns here</p>
        </div>
      } @else {
        <canvas #chartCanvas></canvas>
      }
    </div>
  `,
})
export class DiaperPatternsChart implements OnDestroy {
  private chartFactory = inject(CHART_FACTORY);

  /** Diaper patterns data from API */
  data = input<DiaperPatterns | null>(null);

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
      const patternsData = this.data();
      const canvas = this.chartCanvas();
      const loading = this.isLoading();

      if (patternsData && canvas && !loading) {
        untracked(() => this.renderChart(patternsData, canvas.nativeElement));
      }
    });
  }

  private renderChart(patterns: DiaperPatterns, canvas: HTMLCanvasElement): void {
    // Destroy old chart instance
    this.chart()?.destroy();

    // Guard against missing or invalid data
    if (!patterns || !patterns.daily_data || !Array.isArray(patterns.daily_data)) {
      return;
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: patterns.daily_data.map((d) => d.date),
        datasets: [
          {
            label: 'Diaper changes per day',
            data: patterns.daily_data.map((d) => d.count),
            backgroundColor: '#FF6B35', // PoopyFeed orange
            borderColor: '#E55100',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: undefined,
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
              label: (context) => `Changes: ${context.parsed.y}`,
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
      console.error('Failed to render diaper patterns chart:', error);
    }
  }

  ngOnDestroy(): void {
    this.chart()?.destroy();
  }
}
