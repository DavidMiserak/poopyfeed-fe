/**
 * Chart.js injection token for dependency injection with lazy loading.
 *
 * Wraps the Chart.js constructor in an Angular InjectionToken so
 * chart components can receive it via DI. Chart.js is lazy-loaded
 * on demand (when first chart component initializes) to reduce
 * initial bundle size by ~60 KB.
 *
 * The lazy-loading factory is provided by analytics-dashboard component,
 * which dynamically imports Chart.js only when the analytics route loads.
 */

import { InjectionToken } from '@angular/core';
import type { Chart } from 'chart.js';

/** Injection token providing the Chart.js constructor (lazy-loaded). */
export const CHART_FACTORY = new InjectionToken<typeof Chart>('ChartFactory');
