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
import { FeedingsService } from '../../../services/feedings.service';
import { ChildrenService } from '../../../services/children.service';
import { Feeding } from '../../../models/feeding.model';
import { Child } from '../../../models/child.model';

@Component({
  selector: 'app-feedings-list',
  imports: [CommonModule],
  templateUrl: './feedings-list.html',
  styleUrl: './feedings-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedingsList implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private feedingsService = inject(FeedingsService);
  private childrenService = inject(ChildrenService);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  feedings = signal<Feeding[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

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

    // Load child info first to get name
    this.childrenService.get(childId).subscribe({
      next: (child) => {
        this.child.set(child);
        this.loadFeedings(childId);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  loadFeedings(childId: number) {
    this.feedingsService.list(childId).subscribe({
      next: (feedings) => {
        this.feedings.set(feedings);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
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
}
