/**
 * Chart factory service for lazy-loading Chart.js.
 *
 * Dynamically imports Chart.js only when first requested,
 * reducing initial bundle size by ~60 KB. Registers only
 * the Chart.js components actually used by analytics.
 */

import { Injectable } from '@angular/core';

let chartLoaded = false;
let chartConstructor: typeof import('chart.js').Chart;

@Injectable({ providedIn: 'root' })
export class ChartFactoryService {
  /**
   * Get Chart.js constructor, lazy-loading if needed.
   * Safe to call multiple times - only loads once.
   */
  async getChart() {
    if (!chartLoaded) {
      await this.loadChartJs();
    }
    return chartConstructor;
  }

  /**
   * Get the cached Chart.js constructor synchronously.
   * Must only be called after getChart() has resolved.
   * Used by the DI provider factory (Angular doesn't await async factories).
   */
  getCachedChart() {
    return chartConstructor;
  }

  /**
   * Dynamically import and register Chart.js with required plugins.
   */
  private async loadChartJs() {
    if (chartLoaded) return;

    const {
      Chart,
      LineController,
      BarController,
      LineElement,
      BarElement,
      PointElement,
      CategoryScale,
      LinearScale,
      Legend,
      Tooltip,
      Filler,
    } = await import('chart.js');

    // Register only the Chart.js components actually used by analytics charts
    Chart.register(
      LineController,
      BarController,
      LineElement,
      BarElement,
      PointElement,
      CategoryScale,
      LinearScale,
      Legend,
      Tooltip,
      Filler
    );

    chartConstructor = Chart;
    chartLoaded = true;
  }
}
