import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Static nav bar for pediatrician summary: Back to Advanced link.
 * No API calls. Child ID used only for routing.
 */
@Component({
  selector: 'app-summary-nav',
  imports: [RouterLink],
  templateUrl: './summary-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryNavComponent {
  childId = input.required<number>();
}
