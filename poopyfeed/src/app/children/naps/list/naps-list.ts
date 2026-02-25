import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NapsService } from '../../../services/naps.service';
import { ChildrenService } from '../../../services/children.service';
import { TrackingListService } from '../../../services/tracking-list.service';
import { FilterCriteria } from '../../../services/filter.service';
import {
  TrackingFilterComponent,
  LoadingStateComponent,
  ErrorCardComponent,
  TrackingListHeaderComponent,
  TrackingBulkActionsComponent,
  TrackingListSelectHeaderComponent,
  TrackingEmptyStateComponent,
  TrackingItemContainerComponent,
} from '../../../components';
import { Nap } from '../../../models/nap.model';
import { formatActivityAge } from '../../../utils/date.utils';
import { DateTimeService } from '../../../services/datetime.service';

@Component({
  selector: 'app-naps-list',
  imports: [
    CommonModule,
    TrackingFilterComponent,
    LoadingStateComponent,
    ErrorCardComponent,
    TrackingListHeaderComponent,
    TrackingBulkActionsComponent,
    TrackingListSelectHeaderComponent,
    TrackingEmptyStateComponent,
    TrackingItemContainerComponent,
  ],
  templateUrl: './naps-list.html',
  styleUrl: './naps-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NapsList implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private napsService = inject(NapsService);
  private childrenService = inject(ChildrenService);
  private listService = inject(TrackingListService<Nap>);
  private datetimeService = inject(DateTimeService);

  childId = signal<number | null>(null);

  // Expose service state directly
  child = this.listService.child;
  allItems = this.listService.allItems;
  filteredItems = this.listService.filteredItems;
  filters = this.listService.filters;
  isLoading = this.listService.isLoading;
  error = this.listService.error;
  selectedIds = this.listService.selectedIds;
  isBulkDeleting = this.listService.isBulkDeleting;
  canEdit = this.listService.canEdit;
  hasSelectedItems = this.listService.hasSelectedItems;
  isAllSelected = this.listService.isAllSelected;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('childId');
    if (id) {
      this.childId.set(Number(id));
      this.loadData(Number(id));
    }
  }

  loadData(childId: number) {
    this.listService.isLoading.set(true);
    this.listService.error.set(null);

    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.listService.child.set(child);
        this.loadNaps(childId);
      },
      error: (err: Error) => {
        this.listService.error.set(err.message);
        this.listService.isLoading.set(false);
      },
    });
  }

  private loadNaps(childId: number) {
    this.napsService.list(childId).subscribe({
      next: (naps) => {
        this.listService.initialize({
          timestampField: 'napped_at',
          resourceName: 'nap',
          deleteConfirmMessage: (count: number) => `Delete ${count} nap(s)? This cannot be undone.`,
        });
        this.listService.allItems.set(naps);
        this.listService.isLoading.set(false);
      },
      error: (err: Error) => {
        this.listService.error.set(err.message);
        this.listService.isLoading.set(false);
      },
    });
  }

  onFilterChange(criteria: FilterCriteria): void {
    this.listService.filters.set(criteria);
  }

  navigateToCreate() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'naps', 'create']);
    }
  }

  navigateToEdit(napId: number) {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'naps', napId, 'edit']);
    }
  }

  navigateToDelete(napId: number) {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'naps', napId, 'delete']);
    }
  }

  navigateToDashboard() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'dashboard']);
    }
  }

  formatDateTime(dateTimeStr: string): string {
    return this.datetimeService.formatDateTime(dateTimeStr);
  }

  formatTimeAgo(dateTimeStr: string): string {
    return formatActivityAge(dateTimeStr);
  }

  formatDuration(minutes: number | null): string {
    if (minutes === null) {
      return '';
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  formatTimeOnly(dateTimeStr: string): string {
    return this.datetimeService.formatTimeOnly(dateTimeStr);
  }

  toggleSelection(napId: number): void {
    this.listService.toggleSelection(napId);
  }

  toggleSelectAll(): void {
    this.listService.toggleSelectAll();
  }

  clearSelection(): void {
    this.listService.clearSelection();
  }

  bulkDelete(): void {
    const childId = this.childId();
    if (!childId) return;

    this.listService.bulkDelete((id: number) =>
      this.napsService.delete(childId, id)
    );
  }
}
