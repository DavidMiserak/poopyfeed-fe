import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Presentational grid of advanced tool links for a child.
 * All labels and descriptions are static; only childId is used for routing. No API calls.
 */
@Component({
  selector: 'app-advanced-tools-grid',
  imports: [RouterLink],
  templateUrl: './advanced-tools-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedToolsGridComponent {
  childId = input.required<number>();
  childName = input.required<string>();
}
