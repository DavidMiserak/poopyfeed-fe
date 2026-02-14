import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NapsService } from '../../../services/naps.service';
import { ChildrenService } from '../../../services/children.service';
import { FilterService, FilterCriteria } from '../../../services/filter.service';
import { TrackingFilterComponent } from '../../../components/tracking-filter/tracking-filter';
import { Nap } from '../../../models/nap.model';
import { Child } from '../../../models/child.model';

@Component({
  selector: 'app-naps-list',
  imports: [CommonModule, TrackingFilterComponent],
  templateUrl: './naps-list.html',
  styleUrl: './naps-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NapsList implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private napsService = inject(NapsService);
  private childrenService = inject(ChildrenService);
  private filterService = inject(FilterService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  allNaps = signal<Nap[]>([]);
  filters = signal<FilterCriteria>({});
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Computed: naps after filtering (date range only, no type filter)
  naps = computed(() => {
    const criteria = this.filters();
    const all = this.allNaps();

    // Apply filtering (no type field for naps)
    return this.filterService.filter(all, criteria, 'napped_at');
  });

  canEdit = computed(() => {
    const role = this.child()?.user_role;
    return role === 'owner' || role === 'co-parent';
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('childId');
    if (id) {
      this.childId.set(Number(id));
      this.loadData(Number(id));
    }
  }

  loadData(childId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
        this.loadNaps(childId);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  loadNaps(childId: number) {
    this.napsService.list(childId).subscribe({
      next: (naps) => {
        this.allNaps.set(naps);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  onFilterChange(criteria: FilterCriteria): void {
    this.filters.set(criteria);
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
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatTimeAgo(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
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
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}
