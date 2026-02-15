/**
 * Chart.js injection token for dependency injection.
 *
 * Wraps the Chart.js constructor in an Angular InjectionToken so
 * chart components can receive it via DI. This enables reliable
 * test mocking via TestBed providers, which works regardless of
 * how the AOT compiler bundles external dependencies.
 */

import { InjectionToken } from '@angular/core';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components globally (scales, elements, plugins)
Chart.register(...registerables);

/** Injection token providing the Chart.js constructor. */
export const CHART_FACTORY = new InjectionToken<typeof Chart>('ChartFactory', {
  providedIn: 'root',
  factory: () => Chart,
});
