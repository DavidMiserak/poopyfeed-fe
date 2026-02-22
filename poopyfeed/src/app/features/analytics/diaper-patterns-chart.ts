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
  templateUrl: './diaper-patterns-chart.html',
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
