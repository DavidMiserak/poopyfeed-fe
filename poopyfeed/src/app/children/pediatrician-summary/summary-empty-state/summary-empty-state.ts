import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Static empty state for pediatrician summary when no activity in the last 7 days.
 * No API calls. Child name is the only dynamic input.
 */
@Component({
  selector: 'app-summary-empty-state',
  templateUrl: './summary-empty-state.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryEmptyStateComponent {
  childName = input.required<string>();
}
