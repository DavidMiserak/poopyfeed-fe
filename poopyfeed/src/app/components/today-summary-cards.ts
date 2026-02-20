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
  template: `
    @if (summary(); as today) {
      @if (today.feedings.count === 0 && today.diapers.count === 0 && today.sleep.naps === 0) {
        <div class="text-center py-8">
          <div class="text-5xl mb-3">🌅</div>
          <p class="font-['DM_Sans',sans-serif] text-slate-600">
            No activity recorded today
          </p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Feedings Card -->
          <div
            class="bg-gradient-to-br from-amber-50 to-amber-100 rounded-3xl p-6 border-2 border-amber-200 shadow-md"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-amber-700 mb-1">Feedings Today</p>
                <p class="font-['Fredoka',sans-serif] text-4xl font-bold text-amber-800">
                  {{ today.feedings.count }}
                </p>
                <p class="text-xs text-amber-600 mt-1">
                  {{ today.feedings.total_oz }} oz total
                </p>
              </div>
              <div class="text-4xl">🍼</div>
            </div>
          </div>

          <!-- Diapers Card -->
          <div
            class="bg-gradient-to-br from-rose-50 to-rose-100 rounded-3xl p-6 border-2 border-rose-200 shadow-md"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-rose-700 mb-1">Diapers Today</p>
                <p class="font-['Fredoka',sans-serif] text-4xl font-bold text-rose-800">
                  {{ today.diapers.count }}
                </p>
                <p class="text-xs text-rose-600 mt-1">
                  {{ today.diapers.wet }} wet, {{ today.diapers.dirty }} dirty, {{ today.diapers.both }} both (wet + dirty)
                </p>
              </div>
              <div class="text-4xl">💩</div>
            </div>
          </div>

          <!-- Sleep Card -->
          <div
            class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 border-2 border-blue-200 shadow-md"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-700 mb-1">Naps Today</p>
                <p class="font-['Fredoka',sans-serif] text-4xl font-bold text-blue-800">
                  {{ today.sleep.naps }}
                </p>
                <p class="text-xs text-blue-600 mt-1">
                  {{ getFormattedMinutes(today.sleep.total_minutes) }} total
                </p>
              </div>
              <div class="text-4xl">😴</div>
            </div>
          </div>
        </div>
      }
    } @else {
      <div class="text-center py-8">
        <div class="text-5xl mb-3">🌅</div>
        <p class="font-['DM_Sans',sans-serif] text-slate-600">
          No activity recorded today
        </p>
      </div>
    }
  `,
})
export class TodaySummaryCards {
  summary = input<TodaySummaryData | null>(null);

  getFormattedMinutes(minutes: number): string {
    return formatMinutes(Math.round(minutes));
  }
}
