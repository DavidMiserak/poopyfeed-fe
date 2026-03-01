import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationMeta } from '../../models/pagination.model';

@Component({
  selector: 'app-tracking-pagination',
  imports: [CommonModule],
  templateUrl: './tracking-pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingPaginationComponent {
  /** Pagination state from list API (null when single page or no data). */
  meta = input.required<PaginationMeta | null>();

  /** Accent color for buttons (matches other tracking components). */
  accentColor = input<'rose' | 'orange' | 'amber' | 'green' | 'blue'>('rose');

  pageChange = output<number>();

  onPrevious(): void {
    const m = this.meta();
    if (m?.previous) this.pageChange.emit(m.page - 1);
  }

  onNext(): void {
    const m = this.meta();
    if (m?.next) this.pageChange.emit(m.page + 1);
  }
}
