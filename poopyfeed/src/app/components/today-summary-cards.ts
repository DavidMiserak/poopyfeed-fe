/**
 * Shared Today's Summary stat cards component.
 *
 * Displays today's activity counts (feedings, diapers, naps) as gradient cards.
 * Used by both the child dashboard and analytics dashboard.
 *
 * @example
 * <app-today-summary-cards [summary]="todaySummary()" />
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { TodaySummaryData } from '../models/analytics.model';
import { formatMinutes } from '../utils/date.utils';

@Component({
  selector: 'app-today-summary-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-summary-cards.html',
})
export class TodaySummaryCards {
  summary = input<TodaySummaryData | null>(null);

  getFormattedMinutes(minutes: number): string {
    return formatMinutes(Math.round(minutes));
  }
}
