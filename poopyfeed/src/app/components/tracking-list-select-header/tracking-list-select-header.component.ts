import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tracking-list-select-header',
  imports: [CommonModule],
  templateUrl: './tracking-list-select-header.component.html',
  styleUrl: './tracking-list-select-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingListSelectHeaderComponent {
  isAllSelected = input.required<boolean>();
  selectedCount = input.required<number>();
  totalCount = input.required<number>();
  accentColor = input.required<'rose' | 'orange' | 'amber'>();
  toggleSelectAll = output<void>();

  checkboxClass() {
    const classes = {
      rose: 'text-rose-500',
      orange: 'text-orange-500',
      amber: 'text-amber-500',
    };
    return classes[this.accentColor()];
  }
}
