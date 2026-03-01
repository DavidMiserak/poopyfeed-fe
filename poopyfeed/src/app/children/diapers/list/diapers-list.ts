import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, forkJoin } from 'rxjs';
import { DiapersService } from '../../../services/diapers.service';
import { ChildrenService } from '../../../services/children.service';
import { ChildNavigationService } from '../../../services/child-navigation.service';
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
  TrackingPaginationComponent,
} from '../../../components';
import { DiaperChange } from '../../../models/diaper.model';
import { formatActivityAge } from '../../../utils/date.utils';
import { DateTimeService } from '../../../services/datetime.service';

@Component({
  selector: 'app-diapers-list',
  imports: [
    TrackingFilterComponent,
    LoadingStateComponent,
    ErrorCardComponent,
    TrackingListHeaderComponent,
    TrackingBulkActionsComponent,
    TrackingListSelectHeaderComponent,
    TrackingEmptyStateComponent,
    TrackingItemContainerComponent,
    TrackingPaginationComponent,
  ],
  templateUrl: './diapers-list.html',
  styleUrl: './diapers-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiapersList implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childNav = inject(ChildNavigationService);
  private destroyRef = inject(DestroyRef);
  private diapersService = inject(DiapersService);
  private childrenService = inject(ChildrenService);
  private listService = inject(TrackingListService<DiaperChange>);
  private datetimeService = inject(DateTimeService);

  childId = signal<number | null>(null);
  currentPage = signal(1);

  pagination = this.diapersService.pagination;

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
    // Refetch whenever we land on the list route (e.g. return from create/edit/delete).
    if (this.router.events) {
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          const routeId = this.route.snapshot.paramMap.get('childId');
          if (routeId) this.loadData(Number(routeId));
        });
    }
  }

  loadData(childId: number) {
    this.listService.isLoading.set(true);
    this.listService.error.set(null);

    const f = this.listService.filters();
    const filters = {
      dateFrom: f.dateFrom,
      dateTo: f.dateTo,
      change_type: f.type,
    };

    forkJoin({
      child: this.childrenService.get(childId),
      diapers: this.diapersService.list(childId, filters, this.currentPage()),
    }).subscribe({
      next: ({ child, diapers }) => {
        this.listService.child.set(child);
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

  private loadDiapers(childId: number, page: number) {
    const f = this.listService.filters();
    const filters = {
      dateFrom: f.dateFrom,
      dateTo: f.dateTo,
      change_type: f.type,
    };
    this.diapersService.list(childId, filters, page).subscribe({
      next: (diapers) => {
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
    this.currentPage.set(1);
    const childId = this.childId();
    if (childId) this.loadDiapers(childId, 1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    const childId = this.childId();
    if (childId) this.loadDiapers(childId, page);
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

  goToAdvanced() {
    const childId = this.childId();
    if (childId !== null) this.childNav.goToAdvanced(childId);
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
