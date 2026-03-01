import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Static nav bar for pediatrician summary: Back to Advanced link and Print button.
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

  printRequested = output<void>();

  onPrint(): void {
    this.printRequested.emit();
  }
}
