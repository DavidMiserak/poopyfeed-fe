import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Presentational card for dashboard sections. Holds static title and projects content.
 * No API calls; border color is for visual consistency with dashboard theme.
 */
@Component({
  selector: 'app-dashboard-section-card',
  templateUrl: './dashboard-section-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSectionCardComponent {
  /** Section heading (e.g. "Quick Log", "Today's Summary"). */
  title = input.required<string>();

  /** Border/theme color for the card. */
  borderColor = input<'rose' | 'amber' | 'orange' | 'purple'>('rose');

  borderClass(): string {
    const map: Record<string, string> = {
      rose: 'border-rose-400/20',
      amber: 'border-amber-400/20',
      orange: 'border-orange-400/20',
      purple: 'border-purple-400/20',
    };
    return map[this.borderColor()] ?? 'border-rose-400/20';
  }
}
