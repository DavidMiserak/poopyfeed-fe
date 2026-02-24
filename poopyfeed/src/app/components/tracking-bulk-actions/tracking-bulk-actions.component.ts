import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tracking-bulk-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking-bulk-actions.component.html',
  styleUrl: './tracking-bulk-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingBulkActionsComponent {
  selectedCount = input.required<number>();
  accentColor = input.required<'rose' | 'orange' | 'amber'>();
  isDeleting = input.required<boolean>();
  cancel = output<void>();
  delete = output<void>();

  gradientClass() {
    const gradients = {
      rose: 'from-rose-100 to-pink-100',
      orange: 'from-orange-100 to-amber-100',
      amber: 'from-amber-100 to-yellow-100',
    };
    return gradients[this.accentColor()];
  }

  borderClass() {
    const borders = {
      rose: 'border-rose-300',
      orange: 'border-orange-300',
      amber: 'border-amber-300',
    };
    return borders[this.accentColor()];
  }
}
