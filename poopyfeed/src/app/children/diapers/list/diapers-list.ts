import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DiapersService } from '../../../services/diapers.service';
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
import { DiaperChange } from '../../../models/diaper.model';
import { formatActivityAge } from '../../../utils/date.utils';
import { DateTimeService } from '../../../services/datetime.service';

@Component({
  selector: 'app-diapers-list',
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
  templateUrl: './diapers-list.html',
  styleUrl: './diapers-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiapersList implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private diapersService = inject(DiapersService);
  private childrenService = inject(ChildrenService);
  private listService = inject(TrackingListService<DiaperChange>);
  private datetimeService = inject(DateTimeService);

  childId = signal<number | null>(null);

  // Diaper change type options for filter dropdown
  changeTypeOptions = [
    { value: 'wet', label: 'Wet' },
    { value: 'dirty', label: 'Dirty' },
    { value: 'both', label: 'Both' },
  ];

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
        this.loadDiapers(childId);
      },
      error: (err: Error) => {
        this.listService.error.set(err.message);
        this.listService.isLoading.set(false);
      },
    });
  }

  private loadDiapers(childId: number) {
    this.diapersService.list(childId).subscribe({
      next: (diapers) => {
        this.listService.initialize({
          timestampField: 'changed_at',
          typeField: 'change_type',
          resourceName: 'diaper change',
          deleteConfirmMessage: (count: number) => `Delete ${count} diaper change(s)? This cannot be undone.`,
        });
        this.listService.allItems.set(diapers);
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
      this.router.navigate(['/children', childId, 'diapers', 'create']);
    }
  }

  navigateToEdit(diaperId: number) {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'diapers', diaperId, 'edit']);
    }
  }

  navigateToDelete(diaperId: number) {
    const childId = this.childId();
    if (childId) {
      this.router.navigate([
        '/children',
        childId,
        'diapers',
        diaperId,
        'delete',
      ]);
    }
  }

  navigateToDashboard() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'advanced']);
    }
  }

  formatDateTime(dateTimeStr: string): string {
    return this.datetimeService.formatDateTime(dateTimeStr);
  }

  formatTimeAgo(dateTimeStr: string): string {
    return formatActivityAge(dateTimeStr);
  }

  getDiaperIcon(changeType: DiaperChange['change_type']): string {
    const icons = {
      wet: '💧',
      dirty: '💩',
      both: '🧷',
    };
    return icons[changeType];
  }

  getDiaperTitle(changeType: DiaperChange['change_type']): string {
    const titles = {
      wet: 'Wet Diaper',
      dirty: 'Dirty Diaper',
      both: 'Wet & Dirty',
    };
    return titles[changeType];
  }

  toggleSelection(diaperId: number): void {
    this.listService.toggleSelection(diaperId);
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
      this.diapersService.delete(childId, id)
    );
  }
}
