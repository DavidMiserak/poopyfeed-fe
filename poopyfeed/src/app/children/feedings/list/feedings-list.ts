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
import { filter } from 'rxjs';
import { FeedingsService } from '../../../services/feedings.service';
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
import { Feeding } from '../../../models/feeding.model';
import { formatActivityAge } from '../../../utils/date.utils';
import { DateTimeService } from '../../../services/datetime.service';

@Component({
  selector: 'app-feedings-list',
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
  templateUrl: './feedings-list.html',
  styleUrl: './feedings-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedingsList implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private childNav = inject(ChildNavigationService);
  private destroyRef = inject(DestroyRef);
  private feedingsService = inject(FeedingsService);
  private childrenService = inject(ChildrenService);
  private listService = inject(TrackingListService<Feeding>);
  private datetimeService = inject(DateTimeService);

  childId = signal<number | null>(null);
  currentPage = signal(1);

  /** Pagination meta from service (count, page, totalPages, etc.). */
  pagination = this.feedingsService.pagination;

  // Feeding type options for filter dropdown
  feedingTypeOptions = [
    { value: 'bottle', label: 'Bottle' },
    { value: 'breast', label: 'Breast' },
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

    // Load child info first
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.listService.child.set(child);
        this.loadFeedings(childId, this.currentPage());
      },
      error: (err: Error) => {
        this.listService.error.set(err.message);
        this.listService.isLoading.set(false);
      },
    });
  }

  private loadFeedings(childId: number, page: number) {
    const f = this.listService.filters();
    const filters = {
      dateFrom: f.dateFrom,
      dateTo: f.dateTo,
      feeding_type: f.type,
    };
    this.feedingsService.list(childId, filters, page).subscribe({
      next: (feedings) => {
        this.listService.initialize({
          timestampField: 'fed_at',
          typeField: 'feeding_type',
          resourceName: 'feeding',
          deleteConfirmMessage: (count: number) => `Delete ${count} feeding(s)? This cannot be undone.`,
        });
        this.listService.allItems.set(feedings);
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
    if (childId) this.loadFeedings(childId, 1);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    const childId = this.childId();
    if (childId) this.loadFeedings(childId, page);
  }

  navigateToCreate() {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'feedings', 'create']);
    }
  }

  navigateToEdit(feedingId: number) {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'feedings', feedingId, 'edit']);
    }
  }

  navigateToDelete(feedingId: number) {
    const childId = this.childId();
    if (childId) {
      this.router.navigate(['/children', childId, 'feedings', feedingId, 'delete']);
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

  getFeedingIcon(feeding: Feeding): string {
    return feeding.feeding_type === 'bottle' ? '🍼' : '🤱';
  }

  getFeedingTitle(feeding: Feeding): string {
    if (feeding.feeding_type === 'bottle') {
      return `Bottle: ${feeding.amount_oz} oz`;
    } else {
      const side = feeding.side === 'left' ? 'Left' : feeding.side === 'right' ? 'Right' : 'Both';
      return `Breast: ${feeding.duration_minutes} min (${side})`;
    }
  }

  toggleSelection(feedingId: number): void {
    this.listService.toggleSelection(feedingId);
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
      this.feedingsService.delete(childId, id)
    );
  }
}
