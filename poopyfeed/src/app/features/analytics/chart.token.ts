/**
 * Chart.js injection token for dependency injection.
 *
 * Wraps the Chart.js constructor in an Angular InjectionToken so
 * chart components can receive it via DI. This enables reliable
 * test mocking via TestBed providers, which works regardless of
 * how the AOT compiler bundles external dependencies.
 */

import { InjectionToken } from '@angular/core';
import {
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
} from 'chart.js';

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
  Filler,
);

/** Injection token providing the Chart.js constructor. */
export const CHART_FACTORY = new InjectionToken<typeof Chart>('ChartFactory');
